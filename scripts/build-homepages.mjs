import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Static generation keeps SEO and complete content available without JavaScript.
// Canonical content lives in data/; never hand-edit the generated HTML pages.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'data/portfolio-content.json'), 'utf8'));
const projectData = JSON.parse(fs.readFileSync(path.join(root, 'data/projects.json'), 'utf8'));
const skills = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json'), 'utf8'));
const projects = [...projectData.projects].sort((a,b) => a.rank - b.rank);
const site = 'https://k-k-ing.github.io/kaixin-technical-art-portfolio/';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span class="kp-arrow" aria-hidden="true">↗</span>';
const ui = {
  en: {work:'Work',playground:'AI Playground',experience:'Experience',about:'About',resume:'Resume',download:'Download resume',menu:'Open menu',selected:'Selected work',library:'Project library',all:'All',spatial:'Spatial AI / Generative 3D',technical:'Technical Art',tools:'Tools & Pipelines',interactive:'Interactive Experiments',count:'projects',playTitle:'AI Playground — Explore My Experiments',playCopy:'An interactive world for AI scenes, materials, NPCs and generation experiments.',soon:'Coming soon',playNote:'A future independent module. Preview only — no playable experience yet.',professional:'Professional experience',personal:'Personal research / Projects',community:'Community',communityText:'From playing tennis to founding and running my university’s tennis club.',motionOn:'Motion on',motionOff:'Motion off',contact:'Let’s connect.',close:'Close photo',kicker:'Technical art / Creative technology',heroCaption:'Research & engineering prototype',language:'Language',unconfigured:'LinkedIn — not configured',personalName:'Kian Kang',skip:'Skip to main content'},
  zh: {work:'作品',playground:'AI Playground',experience:'经历',about:'关于我',resume:'简历',download:'下载简历',menu:'打开导航',selected:'精选作品',library:'项目库',all:'全部',spatial:'空间 AI / 生成式 3D',technical:'技术美术',tools:'工具与管线',interactive:'交互实验',count:'个项目',playTitle:'AI Playground — 探索我的实验',playCopy:'未来连接 AI 场景、AI 材质、AI NPC 与 AI 生成实验的交互式世界。',soon:'即将推出',playNote:'未来的独立模块。本阶段仅预留入口，暂无可试玩内容。',professional:'职业经历',personal:'个人研究 / 项目',community:'社群实践',communityText:'从打网球，到创办并运营大学网球社。',motionOn:'动态开启',motionOff:'动态关闭',contact:'保持联系。',close:'关闭照片',kicker:'技术美术 / 创意技术',heroCaption:'研究与工程原型',language:'语言',unconfigured:'LinkedIn — 尚未配置',personalName:'Kian Kang',skip:'跳至主要内容'}
};

function render(locale, output) {
  const c = content.locales[locale], u = ui[locale];
  const prefix = output.includes('/') ? '../' : './';
  const url = raw => /^(?:https?:|mailto:|tel:|#)/.test(raw) ? raw : prefix + raw;
  const href = raw => esc(url(raw));
  const paragraph = text => `<p>${esc(text).replace(/\n/g,'<br>')}</p>`;
  const tags = p => `<ul class="kp-tags" aria-label="${locale === 'en'?'Project tools':'项目工具'}">${p.techTags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const title = p => { const split=p.title.indexOf(' — '); return split<0?esc(p.title):`<span class="kp-title-main">${esc(p.title.slice(0,split))}</span><span class="kp-title-sub"> — ${esc(p.title.slice(split+3))}</span>`; };
  const img = (m, eager=false) => `<img src="${href(m.src)}" alt="${esc(m.alt)}"${m.width?` width="${m.width}"`:''}${m.height?` height="${m.height}"`:''} ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
  const skillIcon = (name, size=40) => `<img class="kp-skill-icon" src="${href(`assets/skills/${name}.svg`)}" alt="" aria-hidden="true" width="${size}" height="${size}" loading="lazy" decoding="async">`;
  const skillBoard = `<div class="kp-skill-board">${skills.groups.map(group=>`<section class="kp-skill-panel" aria-labelledby="skills-${group.id}"><h3 id="skills-${group.id}">${esc(group.heading[locale])}</h3><ul class="kp-tool-grid">${group.items.map(item=>`<li>${skillIcon(item.icon,44)}<span>${esc(item.name)}</span>${item.note?`<small>${esc(item.note[locale])}</small>`:''}</li>`).join('')}</ul></section>`).join('')}<section class="kp-skill-panel kp-capability-panel" aria-labelledby="skills-production"><h3 id="skills-production">${esc(skills.capabilitiesHeading[locale])}</h3><ul class="kp-capability-grid">${skills.capabilities.map(item=>`<li>${skillIcon(item.icon,30)}<span>${esc(item.label[locale])}</span></li>`).join('')}</ul></section></div>`;
  const worldir=projects.find(p=>p.id==='worldir').locales[locale];
  const feature = project => {const p=project.locales[locale];return `<article class="kp-feature-card${project.id==='worldir'?' kp-feature-card-worldir':''}" data-kp-reveal><a href="${href(p.projectUrl)}" aria-label="${esc(p.ariaLabel)}"><div class="kp-card-media">${img(p.media)}</div><div class="kp-card-copy"><p class="kp-card-status">${esc(p.status)}</p><h3>${title(p)}</h3><p class="kp-card-summary">${esc(p.summary)}</p>${tags(p)}<span class="kp-text-link">${esc(p.ctaLabel)} ${arrow}</span></div></a></article>`;};
  const library = project => {const p=project.locales[locale];return `<article class="kp-library-card" data-project-id="${project.id}" data-categories="${project.category.join(' ')}"><a href="${href(p.projectUrl)}" aria-label="${esc(p.ariaLabel)}"><div class="kp-card-media">${img(p.media)}</div><p class="kp-card-status">${esc(p.status)}</p><h3>${title(p)}</h3><p class="kp-card-summary">${esc(p.summary)}</p>${tags(p)}<span class="kp-text-link">${esc(p.ctaLabel)} ${arrow}</span></a></article>`;};
  const heading = (num,kicker,text,intro='') => `<div class="kp-section-heading"><div><p class="kp-eyebrow"><span>${num}</span> / ${esc(kicker)}</p><h2>${esc(text)}</h2></div>${intro?`<p class="kp-section-intro">${esc(intro)}</p>`:''}</div>`;
  const canonical = site+(locale==='en'?'':'zh/');
  const meta = c.meta.filter(m=>m.name!=='viewport' && !m.charset && !['og:url','og:image','og:image:alt'].includes(m.property)).map(m=>`<meta ${m.name?`name="${esc(m.name)}"`:`property="${esc(m.property)}"`} content="${esc(m.content)}">`).join('\n');
  const resumePdf = c.resume.actions.find(a=>Object.hasOwn(a,'download') && a.href.endsWith('.pdf')).href;
  const localeLink = (lang,label,current=false) => `<a href="${href(lang==='zh'?'zh/index.html':'en/index.html')}" data-locale-link="${lang}" lang="${lang==='zh'?'zh-CN':'en'}" hreflang="${lang==='zh'?'zh-CN':'en'}"${current?' aria-current="page"':''}>${label}</a>`;
  const navItems=[['#work',u.work],['#playground',u.playground],['#experience',u.experience],['#about',u.about],[c.resume.pageUrl,u.resume]];
  const interestMedia=c.interests.figures.map(f=>`<figure><button type="button" data-kp-lightbox data-src="${href(f.media[0].src)}" data-alt="${esc(f.media[0].alt)}" data-caption="${esc(f.caption)}" aria-label="${esc(f.buttonAttributes[0]['aria-label'])}">${img(f.media[0])}</button><figcaption>${esc(f.caption)}</figcaption></figure>`).join('');
  const contactLinks=c.contact.items.filter(i=>i.links.length && !i.links[0].href.startsWith('mailto:')).map(i=>{const a=i.links[0];if(a.hreflang==='zh-CN')return localeLink('zh',a.text+' '+arrow);return `<a href="${href(a.href)}"${a.target?' target="_blank" rel="noopener noreferrer"':''}>${esc(a.text)} ${arrow}</a>`;}).join('');
  const html=`<!doctype html>
<!-- Generated by scripts/build-homepages.mjs -->
<html lang="${c.language}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.title)}</title>
${meta}
<meta property="og:url" content="${canonical}"><meta property="og:image" content="${site}${worldir.media.src}"><meta property="og:image:alt" content="${esc(worldir.media.alt)}">
<meta name="theme-color" content="#0c0f12">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="${site}"><link rel="alternate" hreflang="zh-CN" href="${site}zh/"><link rel="alternate" hreflang="x-default" href="${site}">
<link rel="icon" type="image/svg+xml" href="${href('assets/favicon.svg')}">
<link rel="stylesheet" href="${href('design-tokens.css')}"><link rel="stylesheet" href="${href('homepage.css')}">
<script src="${href('homepage.js')}" defer></script>
<noscript><style>.kp-menu-toggle{display:none}.kp-nav{display:flex;position:static;flex-wrap:wrap;padding:0;border:0;gap:14px}.kp-header{position:static;height:auto;min-height:80px}.kp-header-inner{flex-wrap:wrap;padding-block:16px}.kp-nav a{padding:5px 0}.kp-hero{padding-top:0}</style></noscript>
</head>
<body class="kp-home" data-locale="${locale}" data-root-page="${output==='index.html'}" data-root-prefix="${prefix}" data-motion="on">
<a class="kp-skip" href="#main">${esc(u.skip)}</a>
<header class="kp-header"><div class="kp-wrap kp-header-inner">
<a class="kp-logo" href="#main" aria-label="Kian Kang">KIAN <span aria-hidden="true">/</span></a>
<nav id="kp-nav" class="kp-nav" data-nav aria-label="${locale==='en'?'Main navigation':'主导航'}">${navItems.map(([dest,label])=>`<a href="${href(dest)}">${esc(label)}</a>`).join('')}</nav>
<div class="kp-languages" aria-label="${esc(u.language)}">${localeLink('en','EN',locale==='en')}<span aria-hidden="true">/</span>${localeLink('zh','中文',locale==='zh')}</div>
<button class="kp-menu-toggle" type="button" aria-controls="kp-nav" aria-expanded="false" aria-label="${esc(u.menu)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg></button>
</div></header>
<main id="main">
<section class="kp-hero kp-wrap" aria-labelledby="kp-hero-title">
<div class="kp-hero-grid"><div class="kp-hero-copy">
<p class="kp-kicker">${esc(u.kicker)}</p>
<h1 id="kp-hero-title">Kian Kang<span>.</span></h1>
<p class="kp-role">${esc(c.hero.title.replace(/\n/g,' '))}</p>
<p class="kp-hero-intro">${esc(c.hero.intro[0])}</p>
<p class="kp-hero-specialties">${esc(c.hero.subtitle)}</p>
<div class="kp-actions"><a class="kp-button kp-button-primary" href="#work">${esc(c.hero.actions[0].text)} <span aria-hidden="true">↓</span></a><a class="kp-button" href="${href(resumePdf)}" download>${esc(u.download)} <span aria-hidden="true">↓</span></a></div>
<div class="kp-hero-links">${c.hero.actions.slice(1).map(a=>`<a href="${href(a.href)}"${a.target?' target="_blank" rel="noopener noreferrer"':''}>${esc(a.text)} ${arrow}</a>`).join('')}</div>
</div><a class="kp-hero-visual" href="${href(worldir.projectUrl)}" aria-label="${esc(worldir.ariaLabel)}"><div class="kp-hero-image">${img(worldir.media,true)}</div><div class="kp-visual-caption"><span><strong>WORLDIR</strong> / ${esc(u.heroCaption)}</span>${arrow}</div></a></div>
<div class="kp-statusbar"><div class="kp-current-role"><span>${esc(c.hero.status).replace(/\n/,'<br>')}</span></div><a href="#work">${esc(u.selected)} <span aria-hidden="true">↓</span></a></div>
</section>
<section id="work" class="kp-section kp-featured"><div class="kp-wrap">
${heading('01',u.selected,c.work.heading,c.work.intro[0])}
<div class="kp-context">${paragraph(c.hero.intro[1])}${paragraph(c.work.intro[1])}</div>
<div class="kp-featured-grid">${projects.filter(p=>p.featured).map(feature).join('\n')}</div>
</div></section>
<section id="project-library" class="kp-section kp-library"><div class="kp-wrap">
${heading('02',u.library,u.library)}
<div class="kp-filter-bar"><div class="kp-filters" role="group" aria-label="${esc(u.library)}">${[['all',u.all],['spatial-ai',u.spatial],['technical-art',u.technical],['tools',u.tools],['interactive',u.interactive]].map(([id,label])=>`<button type="button" data-filter="${id}" aria-pressed="${id==='all'}" aria-controls="kp-library-grid">${esc(label)}</button>`).join('')}</div><p id="kp-filter-count" aria-live="polite" aria-atomic="true" data-count-label="${u.count}">${projects.length} ${u.count}</p></div>
<div class="kp-library-grid" id="kp-library-grid">${projects.map(library).join('\n')}</div>
<aside id="playground" class="kp-playground" aria-labelledby="kp-playground-title" data-module="playground" data-status="coming-soon"><div class="kp-playground-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3"><path d="m16 3 11 6v14l-11 6-11-6V9L16 3Zm0 12v14M5 9l11 6 11-6M16 3v12"/></svg></div><div class="kp-playground-copy"><h3 id="kp-playground-title">${esc(u.playTitle)}</h3><p>${esc(u.playCopy)}</p><p>${esc(u.playNote)}</p></div><span class="kp-coming-soon">${esc(u.soon)}</span></aside>
</div></section>
<section id="experience" class="kp-section kp-experience"><div class="kp-wrap">
${heading('03',u.experience,u.experience)}
${c.experience.entries.map(e=>`<article class="kp-experience-row"><p class="kp-experience-label">${esc(u.professional)}</p><div class="kp-experience-content"><h3>${esc(e.organization)}</h3><p class="kp-experience-role">${esc(e.role)}</p><p class="kp-experience-period">${esc(e.period)}</p><ul>${e.responsibilities.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div></article>`).join('')}
<div class="kp-experience-row"><p class="kp-experience-label">${esc(u.personal)}</p><div class="kp-experience-content kp-project-inline">${projects.map(p=>`<a href="${href(p.locales[locale].projectUrl)}">${esc(p.locales[locale].title.split(' — ')[0])} ${arrow}</a>`).join('')}</div></div>
<div class="kp-experience-row"><p class="kp-experience-label">${esc(u.community)}</p><div class="kp-experience-content">${paragraph(u.communityText)}</div></div>
</div></section>
<section id="about" class="kp-section kp-about"><div class="kp-wrap">
${heading('04',u.about,c.about.heading)}
<div class="kp-about-layout"><figure class="kp-portrait">${img(c.about.media[0])}<figcaption>${esc(c.footer.paragraphs[0])}<br>${esc(c.footer.paragraphs[1])}</figcaption></figure><div class="kp-about-copy">${c.about.paragraphs.map(paragraph).join('')}<div class="kp-about-meta"><div><h3>${esc(c.about.education.heading)}</h3>${c.about.education.paragraphs.map(paragraph).join('')}</div><div><h3>${esc(c.about.availability.heading)}</h3>${c.about.availability.paragraphs.map(paragraph).join('')}</div></div></div></div>
<div id="skills" class="kp-skills"><h2>${esc(c.skills.heading)}</h2>${c.skills.intro.map(t=>`<p class="kp-skills-intro">${esc(t)}</p>`).join('')}${skillBoard}<details class="kp-skill-details"><summary>${esc(skills.detailsLabel[locale])}</summary><div class="kp-skill-grid">${c.skills.groups.map(g=>`<article class="kp-skill"><span>${esc(g.number)}</span><h3>${esc(g.heading)}</h3><ul>${g.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></article>`).join('')}</div></details></div>
</div></section>
<section id="interests" class="kp-section kp-interests"><div class="kp-wrap">
${heading('05',c.interests.heading,c.interests.heading,c.interests.description.join(' '))}
<div class="kp-interest-grid">${interestMedia}</div><div class="kp-interest-note">${c.interests.note.map(paragraph).join('')}<small>${esc(c.interests.controlLabels.instruction)}</small></div>
</div></section>
<section id="contact" class="kp-section kp-contact"><div class="kp-wrap">
<p class="kp-eyebrow"><span>06</span> / ${esc(c.contact.heading)}</p><h2>${esc(u.contact)}</h2>
<a class="kp-contact-email" href="mailto:122880509@qq.com">122880509@qq.com ${arrow}</a>
<div class="kp-contact-links">${contactLinks}</div>
${locale==='zh'?`<details id="linkedin" class="kp-unconfigured"><summary>${esc(u.unconfigured)}</summary><code>LINKEDIN_URL_HERE</code></details>`:'<span id="linkedin" class="kp-sr-only" aria-hidden="true"></span>'}
</div></section>
</main>
<footer class="kp-footer kp-wrap"><div class="kp-footer-meta"><span class="kp-footer-name">${esc(c.footer.paragraphs[0])}</span><span>${esc(c.footer.paragraphs[1])}</span><span>${esc(c.footer.paragraphs[2]).replace(/\n/,' · ')}</span></div><button type="button" class="kp-motion-toggle" data-motion-toggle data-label-on="${esc(u.motionOn)}" data-label-off="${esc(u.motionOff)}" aria-pressed="false">${esc(u.motionOn)}</button></footer>
<dialog id="kp-lightbox" class="kp-lightbox" aria-label="${locale==='en'?'Photo viewer':'照片查看器'}"><button type="button" data-lightbox-close aria-label="${esc(u.close)}">×</button><figure><img alt=""><figcaption></figcaption></figure></dialog>
</body></html>\n`;
  fs.mkdirSync(path.dirname(path.join(root,output)),{recursive:true});
  fs.writeFileSync(path.join(root,output),html,'utf8');
  console.log(`Generated ${output} (${locale})`);
}
render('en','index.html');
render('en','en/index.html');
render('zh','zh/index.html');
