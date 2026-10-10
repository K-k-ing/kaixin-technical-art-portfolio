#!/usr/bin/env node
/** Read-only, dependency-free validation for the generated portfolio homepage. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultBaseline = path.join(root, 'scripts/protected-source-baseline.json');
const args = process.argv.slice(2);
const options = { baseline: process.env.PORTFOLIO_PROTECTED_BASELINE || defaultBaseline, json: false, protectedOnly: false };
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--baseline' && args[i + 1]) options.baseline = args[++i];
  else if (args[i] === '--json') options.json = true;
  else if (args[i] === '--protected-only') options.protectedOnly = true;
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage: node scripts/validate-homepages.mjs [--baseline PATH] [--json] [--protected-only]\nRead-only checks; no npm dependencies, network calls, or file writes.');
    process.exit(0);
  } else {
    console.error(`Unknown or incomplete argument: ${args[i]}`);
    process.exit(2);
  }
}

const report = { ok: false, root, baseline: path.resolve(options.baseline), protectedFiles: 0, pages: 0, localReferences: 0, checks: 0, errors: [], warnings: [] };
const check = (condition, message) => {
  report.checks += 1;
  if (!condition) report.errors.push(message);
  return Boolean(condition);
};
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const insideRoot = (file) => {
  const rel = path.relative(root, file);
  return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
};
const exists = (file) => {
  try { return fs.statSync(file).isFile(); } catch { return false; }
};
const decodeEntities = (value) => String(value).replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
  const names = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  if (names[entity.toLowerCase()]) return names[entity.toLowerCase()];
  const hex = /^&#x/i.test(entity);
  const point = Number.parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
  return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
});
const decodeURIValue = (value, context) => {
  try { return decodeURIComponent(value); } catch {
    check(false, `${context}: malformed URL encoding ${value}`);
    return value;
  }
};
const parsed = new Map();

function parseHtml(file) {
  if (parsed.has(file)) return parsed.get(file);
  const html = fs.readFileSync(file, 'utf8');
  const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?<\/(?:script|style)\s*>/gi, '$1');
  const tags = [];
  const ids = new Set();
  const duplicates = [];
  for (const match of clean.matchAll(/<([a-z][\w:-]*)\b([^<>]*?)\/?\s*>/gi)) {
    const attrs = {};
    for (const attr of match[2].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = decodeEntities(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const tag = { name: match[1].toLowerCase(), attrs };
    tags.push(tag);
    if (attrs.id) {
      if (ids.has(attrs.id)) duplicates.push(attrs.id);
      ids.add(attrs.id);
    }
  }
  const result = { html, tags, ids, duplicates };
  parsed.set(file, result);
  return result;
}

function resolveLocal(value, sourceFile, context) {
  const raw = decodeEntities(value).trim();
  if (!check(raw.length > 0, `${context}: empty resource/link URL`)) return null;
  if (/^(?:https?:|mailto:|tel:|data:|blob:)/i.test(raw) || raw.startsWith('//')) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) {
    check(false, `${context}: unsupported URL scheme in ${raw}`);
    return null;
  }
  if (!check(!raw.startsWith('/'), `${context}: root-absolute URL breaks GitHub Pages subdirectory hosting: ${raw}`)) return null;
  const hashIndex = raw.indexOf('#');
  const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const fragment = hashIndex >= 0 ? decodeURIValue(raw.slice(hashIndex + 1), context) : null;
  const pathname = decodeURIValue(beforeHash.split('?')[0], context);
  const destination = pathname ? path.resolve(path.dirname(sourceFile), pathname) : sourceFile;
  if (!check(insideRoot(destination), `${context}: URL escapes repository root: ${raw}`)) return null;
  let file = destination;
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch { /* reported below */ }
  report.localReferences += 1;
  if (!check(exists(file), `${context}: missing local target ${raw} -> ${relative(file)}`)) return null;
  if (fragment !== null && /\.html?$/i.test(file)) {
    check(fragment.length > 0, `${context}: empty placeholder fragment ${raw}`);
    if (fragment) check(parseHtml(file).ids.has(fragment), `${context}: missing anchor #${fragment} in ${relative(file)}`);
  }
  return { file, fragment };
}

function references(file, anchorsOnly = false) {
  const dom = parseHtml(file);
  for (const tag of dom.tags) {
    const label = `${relative(file)} <${tag.name}>`;
    if (tag.name === 'a' && 'href' in tag.attrs) resolveLocal(tag.attrs.href, file, `${label} href`);
    if (anchorsOnly) continue;
    if (['img', 'script', 'video', 'source', 'audio', 'iframe'].includes(tag.name) && 'src' in tag.attrs) {
      resolveLocal(tag.attrs.src, file, `${label} src`);
    }
    if (tag.name === 'video' && 'poster' in tag.attrs) resolveLocal(tag.attrs.poster, file, `${label} poster`);
    if (tag.name === 'link' && (tag.attrs.rel || '').split(/\s+/).includes('stylesheet')) {
      resolveLocal(tag.attrs.href || '', file, `${label} stylesheet`);
    }
    if (['img', 'source'].includes(tag.name) && tag.attrs.srcset && !tag.attrs.srcset.startsWith('data:')) {
      for (const candidate of tag.attrs.srcset.split(',')) resolveLocal(candidate.trim().split(/\s+/)[0], file, `${label} srcset`);
    }
    if (tag.name === 'video') {
      check('controls' in tag.attrs, `${label}: preview video must expose native controls`);
      check(!('autoplay' in tag.attrs), `${label}: video must be user initiated, not autoplay`);
      check(tag.attrs.preload === 'none', `${label}: video must use preload="none"`);
    }
  }
  if (!anchorsOnly) check(dom.duplicates.length === 0, `${relative(file)}: duplicate IDs ${dom.duplicates.join(', ')}`);
  return dom;
}

let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(options.baseline, 'utf8'));
  check(baseline.algorithm === 'SHA256', 'Protected baseline must declare SHA256.');
  const entries = Object.entries(baseline.files || {});
  check(entries.length === 37, `Protected baseline must contain 37 files; found ${entries.length}.`);
  for (const [file, hash] of entries) {
    const target = path.resolve(root, file);
    if (!check(insideRoot(target) && exists(target), `Protected file is missing or outside workspace: ${file}`)) continue;
    const bytes = fs.readFileSync(target);
    const digest = (value) => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
    let unchanged = digest(bytes) === String(hash).toUpperCase();
    // The approved dark-theme follow-up adds only these two stylesheet imports.
    // Keep the original baseline and verify all remaining page content against it.
    if (!unchanged && /^(?:en\/)?projects\/(?:worldir|mate|track-assembly|ai-asset-pipeline|ai-npc)\.html$/.test(file)) {
      const prefix = file.startsWith('en/') ? '../../' : '../';
      const lines = bytes.toString('utf8').replace(/\r\n/g, '\n').split('\n');
      const imports = ['design-tokens.css', 'project-theme.css'].map((name) => `  <link rel="stylesheet" href="${prefix}${name}">`);
      if (imports.every((line) => lines.filter((candidate) => candidate === line).length === 1)) {
        const original = lines.filter((line) => !imports.includes(line)).join('\n');
        unchanged = [original, original.replace(/\n/g, '\r\n')].some((value) => digest(value) === String(hash).toUpperCase());
      }
    }
    check(unchanged, `Protected file changed beyond approved theme imports: ${file}`);
    report.protectedFiles += 1;
  }
} catch (error) {
  check(false, `Cannot read protected baseline ${options.baseline}: ${error.message}. Supply --baseline PATH.`);
}

const expectedIds = ['worldir', 'mate', 'asset-pipeline', 'track-assembly', 'ai-npc'];
const expectedSlugs = ['worldir', 'mate', 'ai-asset-pipeline', 'track-assembly', 'ai-npc'];
const homeRoutes = [
  { file: 'index.html', locale: 'en', lang: 'en' },
  { file: 'en/index.html', locale: 'en', lang: 'en' },
  { file: 'zh/index.html', locale: 'zh', lang: 'zh-CN' }
];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); } catch (error) {
    check(false, `Cannot read ${file}: ${error.message}`);
    return null;
  }
}

if (!options.protectedOnly) {
  for (const route of homeRoutes) {
    const file = path.join(root, route.file);
    if (!check(exists(file), `Generated homepage missing: ${route.file}. Run node scripts/build-homepages.mjs first.`)) continue;
    const dom = references(file);
    report.pages += 1;
    check(dom.tags.find((tag) => tag.name === 'html')?.attrs.lang === route.lang, `${route.file}: expected html lang="${route.lang}".`);
    check(/generated[^\n]*scripts\/build-homepages\.mjs/i.test(dom.html), `${route.file}: missing generated-file notice naming scripts/build-homepages.mjs.`);
    for (const id of ['main', 'work', 'skills', 'about', 'interests', 'contact', 'playground']) {
      check(dom.ids.has(id), `${route.file}: missing required section/compatibility anchor #${id}.`);
    }
    if (route.file === 'index.html') check(dom.ids.has('linkedin'), 'index.html: preserve #linkedin for protected Chinese detail-page backlinks.');
    const links = dom.tags.filter((tag) => tag.name === 'a' && tag.attrs.href);
    check(links.some((tag) => tag.attrs.href === '#playground'), `${route.file}: AI Playground must link to the in-page #playground coming-soon section.`);
    for (const slug of expectedSlugs) {
      const destination = path.resolve(root, route.locale === 'en' ? `en/projects/${slug}.html` : `projects/${slug}.html`);
      check(links.some((tag) => {
        const href = tag.attrs.href.split(/[?#]/)[0];
        return !/^[a-z][a-z\d+.-]*:|^\/\//i.test(href) && path.resolve(path.dirname(file), href) === destination;
      }), `${route.file}: missing locale-correct project link to ${relative(destination)}.`);
    }
    const resources = dom.tags.filter((tag) => (tag.name === 'link' && (tag.attrs.rel || '').includes('stylesheet')) || tag.name === 'script');
    const names = resources.map((tag) => path.basename((tag.attrs.href || tag.attrs.src || '').split('?')[0]));
    for (const required of ['design-tokens.css', 'homepage.css', 'homepage.js']) check(names.includes(required), `${route.file}: missing isolated resource ${required}.`);
    check(!names.some((name) => ['styles.css', 'geometry.css', 'script.js', 'worldir.css', 'worldir.js', 'mate.css', 'mate.js', 'track.css', 'track.js'].includes(name)), `${route.file}: homepage must not load legacy shared/detail CSS or JS.`);
  }

  // Check immutable detail/resume backlinks as well as the generated-page links.
  for (const file of Object.keys(baseline?.files || {}).filter((name) => /\.html?$/.test(name))) {
    const target = path.join(root, file);
    if (exists(target)) references(target, true);
  }
  for (const css of ['design-tokens.css', 'homepage.css']) {
    const file = path.join(root, css);
    if (!check(exists(file), `Missing isolated stylesheet ${css}.`)) continue;
    const source = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of source.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)) {
      if (match[2] && !match[2].startsWith('#')) resolveLocal(match[2], file, `${css} url()`);
    }
    if (css === 'design-tokens.css') check(/--kp-[\w-]+\s*:/.test(source), 'design-tokens.css must declare --kp-* tokens.');
  }

  const manifest = readJson('data/projects.json');
  if (manifest) {
    const projects = manifest.projects || [];
    check(projects.length === 5, `data/projects.json: expected five projects, found ${projects.length}.`);
    check(new Set(projects.map((project) => project.id)).size === projects.length, 'data/projects.json: duplicate project IDs.');
    for (let i = 0; i < expectedIds.length; i += 1) {
      const project = projects.find((item) => item.id === expectedIds[i]);
      if (!check(Boolean(project), `data/projects.json: missing ${expectedIds[i]}.`)) continue;
      check(Array.isArray(project.category) && project.category.length > 0, `Project ${project.id}: category IDs must be a non-empty array.`);
      for (const category of project.category || []) check((manifest.categoryIds || []).includes(category), `Project ${project.id}: unknown category ${category}.`);
      for (const locale of ['en', 'zh']) {
        const content = project.locales?.[locale];
        if (!check(Boolean(content), `Project ${project.id}: missing locale ${locale}.`)) continue;
        for (const field of ['title', 'summary', 'status', 'projectUrl']) check(typeof content[field] === 'string' && content[field].trim().length > 0, `Project ${project.id}/${locale}: missing ${field}.`);
        check(Array.isArray(content.techTags) && content.techTags.length > 0, `Project ${project.id}/${locale}: missing original tech tags.`);
        const expected = `${locale === 'en' ? 'en/' : ''}projects/${expectedSlugs[i]}.html`;
        check(content.projectUrl === expected, `Project ${project.id}/${locale}: projectUrl must be repo-root relative ${expected}.`);
        for (const [field, value] of [['projectUrl', content.projectUrl], ['media.src', content.media?.src]]) {
          if (typeof value === 'string') resolveLocal(value, path.join(root, 'index.html'), `Project ${project.id}/${locale} ${field}`);
          else check(false, `Project ${project.id}/${locale}: missing ${field}.`);
        }
        check(content.media?.width > 0 && content.media?.height > 0 && typeof content.media?.alt === 'string', `Project ${project.id}/${locale}: preview needs width, height, and alt.`);
      }
    }
  }
  const portfolio = readJson('data/portfolio-content.json');
  if (portfolio) for (const locale of ['en', 'zh']) {
    const content = portfolio.locales?.[locale];
    if (!check(Boolean(content), `portfolio-content.json: missing locale ${locale}.`)) continue;
    for (const section of ['hero', 'work', 'skills', 'about', 'interests', 'contact', 'footer']) check(Boolean(content[section]), `portfolio-content.json/${locale}: missing ${section}.`);
    for (const id of expectedIds) check(content.work?.projectIds?.includes(id), `portfolio-content.json/${locale}: work.projectIds missing ${id}.`);
  }
  const modules = readJson('data/modules.json');
  if (modules) {
    check(modules.homepageNamespace === 'kp-', 'Module contract: homepage namespace must be kp-.');
    for (const [id, namespace] of [['playground', 'playground-'], ['worldir-interactive', 'worldir-']]) {
      const module = modules.modules?.find((item) => item.id === id);
      check(module?.namespace === namespace, `Future module ${id}: namespace must be ${namespace}.`);
      check(module?.status === 'coming-soon' && module?.href === null && module?.enabled === false, `Future module ${id}: must remain coming-soon, href null, enabled false in Phase 1.`);
    }
  }
}

report.ok = report.errors.length === 0;
if (options.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`${report.ok ? 'PASS' : 'FAIL'}: ${report.checks} checks; ${report.protectedFiles} protected files; ${report.pages} homepages; ${report.localReferences} local references.`);
  for (const error of report.errors) console.error(`ERROR: ${error}`);
  for (const warning of report.warnings) console.warn(`WARN: ${warning}`);
}
process.exitCode = report.ok ? 0 : 1;
