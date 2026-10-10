# Main homepage module contract

This document describes Phase 1 and the subsequently approved project-page theme. The user has approved publishing the main portfolio. Future games and interactive WORLDIR modules remain unimplemented.

## Ownership and generated output

The homepage source of truth is:

- `data/portfolio-content.json`: original bilingual biography, capabilities, experience, interests, contact, and homepage content.
- `data/projects.json`: five projects with categories, bilingual content, original media, and locale-specific detail URLs.
- `scripts/build-homepages.mjs`: dependency-free Node renderer for the three homepage routes.
- `design-tokens.css`: homepage design tokens, all prefixed `--kp-`.
- `homepage.css` and `homepage.js`: isolated homepage layout and behavior.
- `data/modules.json`: inert future-module declarations, not implemented modules.

The files `index.html`, `en/index.html`, and `zh/index.html` are generated. Do not edit them by hand: edit data or renderer and regenerate. Each generated file must include a notice naming `scripts/build-homepages.mjs`.

```powershell
node scripts/build-homepages.mjs
node scripts/validate-homepages.mjs
```

Both commands use the installed Node runtime and built-in modules only; no npm install or package dependency is required. Validation is read-only and performs no network requests. The generator is restricted to its three declared HTML outputs.

## Routes and language boundaries

| Route | Homepage language | Detail links | Resume HTML |
|---|---|---|---|
| `index.html` | English, default | `en/projects/*.html` | `en/resume-source.html` |
| `en/index.html` | English compatibility route | `projects/*.html`, relative to `/en/` | `resume-source.html` |
| `zh/index.html` | Chinese | `../projects/*.html` | `../resume-source.html` |

Existing `projects/*.html` stay Chinese and existing `en/projects/*.html` stay English. Their content, layout, scripts and media remain unchanged; the approved shared dark theme is loaded through `design-tokens.css` and `project-theme.css` after each page's existing styles. Existing `asset-weathering.html` and `json-generator.html` redirects remain intact. ROOT becoming English does not change the language of root detail or resume routes.

Data stores asset and detail paths relative to the repository root, without a leading slash. The renderer rebases them for the output directory: `assets/...` becomes `../assets/...` in both nested homepages; `en/projects/worldir.html` becomes `projects/worldir.html` from the English compatibility homepage. Do not run literal string replacement over prose/HTML to rebase URLs.

The site is hosted under a GitHub Pages project subdirectory. Local `href`, `src`, `poster`, stylesheet, and script URLs must be relative to the containing file. Root-absolute `/assets/...` and `/projects/...` paths would incorrectly refer to the hosting domain root. Full HTTPS canonical/alternate metadata remains intentional; internal navigation does not use the deployment hostname.

English images are generally under root `assets/en/...`, but its PDF is under `en/assets/resume/Kaixin_Kang_Technical_Artist_Resume_EN.pdf`. The Chinese PDF and original DOCX are under root `assets/resume/`. Preserve all resume files unchanged.

Keep `#main`, `#work`, `#skills`, `#about`, `#interests`, and `#contact` in every generated route. Preserve root `#linkedin` as a compatibility target because unchanged Chinese detail pages link there. No real LinkedIn profile was supplied: never invent a URL or turn the existing placeholder into an external profile.

## Current and future module boundaries

| Module | Namespace | Phase 1 state | Navigation |
|---|---|---|---|
| Main portfolio | `kp-`; tokens `--kp-*` | Active homepage | Three generated routes |
| AI Playground | `playground-` | `coming-soon`, disabled | Main navigation targets local `#playground` |
| Future WORLDIR interactive module | `worldir-` | `coming-soon`, disabled | No href or route |

`data/modules.json` stores future `href` values as JSON `null`, not `#`, an empty string, a nonexistent `.html` file, or a guessed route. The AI Playground teaser is a real, accessible section with `id="playground"` on the main homepage; it does not imply the game or module exists. Existing WORLDIR project detail links remain active and are independent of this future-module declaration.

Future integration, when separately authorized, must preserve these boundaries:

- A module owns a real route/container, namespaced CSS, namespaced data attributes, and its own assets. It must not replace main homepage content or claim global ownership of `body`, `window`, navigation, or lightbox behavior.
- A module receives explicit container/configuration inputs. Initialization must be idempotent and return a cleanup function for listeners, observers, timers, animation frames, and WebGL resources.
- Do not inject global CSS resets, alter legacy shared styles/scripts, or attach non-removable document-wide handlers. Any required document handler must be removed by the module's cleanup.
- Heavy media and runtime bundles load only after the user enters the module. Feature availability is determined by manifest state, never by treating a null href as a navigable target.
- Changing a future module to active requires an implemented route, keyboard/reduced-motion support, separate QA, and a new explicit scope decision. This Phase 1 manifest alone does not grant that authorization.

## Content and interaction contract

Five project identities must remain available in both languages: `worldir`, `mate`, `asset-pipeline`, `track-assembly`, and `ai-npc`. The asset-pipeline ID maps to the existing `ai-asset-pipeline.html` filename. Display ordering and categories are data-driven; do not duplicate descriptions inside the renderer.

Original project status and caveats remain visible. WORLDIR's real corridor screenshot and film are early experiment evidence, not proof of a completed generic production or v2 delivery chain. Screenshots are real project resources; do not use generated substitutes as project evidence. Preview videos expose controls, play only after user action, use `playsinline` and `preload="none"`, and retain useful still-image fallbacks. There are no dedicated Face Value or AI NPC videos in the existing media set.

The homepage remains useful without JavaScript. JavaScript enhances navigation, filtering, preview controls, and lightboxes; it must not be the only source of project links, content, or locale selection. New behavior belongs to `homepage.js`. Homepages must not load or modify the legacy `script.js`, WORLDIR/MATE/Track scripts, `styles.css`, `geometry.css`, or their localized copies.

## Validation and immutable baseline

`scripts/validate-homepages.mjs` checks:

- Original SHA-256 equality for 37 protected detail, shared source, resume HTML/CSS, and original resume binary files. Ten case-study HTML pages may include the two exact approved theme stylesheet imports; after excluding only those imports and normalizing checkout line endings, their original content must still match the unchanged baseline.
- Three generated routes, correct HTML languages, generator notices, required compatibility anchors, and isolated assets.
- Every homepage local anchor/link, image, script, stylesheet, video/poster, source/srcset target, plus all protected detail/resume local anchor backlinks.
- The five locale-correct project links in every route; bilingual manifest entries, categories, media dimensions/alt text, and section completeness.
- `--kp-*` tokens, relative stylesheet resource paths, user-initiated videos, and inert coming-soon module state.

The portable protected baseline is stored at `scripts/protected-source-baseline.json`. It was copied from the read-only audit at baseline commit `ac675f8fe6b5dc1741f6a6de87a4322412055a1f`; it must not be regenerated from changed files. The original audit copy is also retained in the local task artifact directory outside the repository.

On another machine the default command uses the checked-in portable baseline. To use a separately retained trusted baseline, pass its location:

```powershell
node scripts/validate-homepages.mjs --baseline "C:/path/to/protected-source-baseline.json"
node scripts/validate-homepages.mjs --protected-only
node scripts/validate-homepages.mjs --json
```

The `PORTFOLIO_PROTECTED_BASELINE` environment variable is an alternative to `--baseline`. Validation fails when the baseline is unavailable, a protected file changes, or a local target/anchor is missing. Static validation does not replace browser checks of desktop/mobile layout, keyboard operation, focus restoration, media controls, contrast, reduced motion, and no-JavaScript access.

## Rollback boundary

The audited main baseline commit is `ac675f8fe6b5dc1741f6a6de87a4322412055a1f`. Initial homepage hashes are:

- `index.html`: `23495CA91017977ADD79374800A2C7BFA373415491CA11191D9E7C59F99E1957`.
- `en/index.html`: `1FB720D10B652E69878DDE849EF4F68532F8F1E85B6BE0EB0AD870C7BF99148D`.

Rollback is a separate, explicitly requested operation. First preserve current homepage work in a commit or recoverable copy. Restore only the two original homepage files from the baseline commit; do not reset or clean the workspace. The added Chinese route, isolated styles/scripts, manifests, renderer, QA, and this document can remain unlinked for recovery. Remove newly added files only after confirming they are unused and the user has authorized deletion. Never restore/overwrite unrelated user changes.

After restoring the original HTML, verify both hashes above and run the protected-only check. Re-run the renderer only when returning to the redesigned module, since it intentionally replaces those generated homepage outputs. No command in this document automatically pushes or deploys anything.
