# Portfolio Main — Phase 1 delivery

## Approved release follow-ups

After the initial homepage review, the user approved these additional changes and publication to the existing main portfolio:

- Homepage internship dates now read August–October 2026 in both languages.
- All five project detail pages in both languages load shared `design-tokens.css` and `project-theme.css` after their existing styles. This applies the matching dark theme without changing project copy, media, layout or scripts.
- The dark-theme browser check passed on all ten pages at desktop (1440px) and mobile (390px), including mobile menus, the WORLDIR saved-case switch and image lightbox. The ten HTML files match the original content after removing the two approved stylesheet imports.
- The original protected-file baseline is retained. Validation permits only those exact imports in the ten case studies; all remaining content and protected files must still match the baseline.

The original delivery record below describes the initial homepage-only scope and its checks before these follow-ups. The separate World Model specialist repository remains outside this release.

## Scope and preview

- Workspace: `F:/portfolio`; branch: `codex/main-portfolio-redesign`.
- Preserved baseline: `ac675f8fe6b5dc1741f6a6de87a4322412055a1f` on `main`.
- English default: `http://127.0.0.1:4173/`.
- English compatibility entry: `http://127.0.0.1:4173/en/`.
- Chinese: `http://127.0.0.1:4173/zh/`.
- At initial delivery: no push or deployment, no AI Playground implementation or WORLDIR detail-page redesign.

The default route is English on a first visit. An explicit language selection is remembered for the current browser session, including return links from unchanged legacy detail pages. `/en/` explicitly selects English; `/zh/` explicitly selects Chinese. Both languages are complete static HTML and remain usable without JavaScript.

## Before / after

The former light homepage used a MATE hero, a long project list, capabilities, biography, interests and contact. The redesign changes presentation, not project claims:

- Dark neutral editorial design, restrained cyan, larger name and clearer actions.
- Real WORLDIR corridor experiment replaces the hero image; MATE imagery remains in its project cards.
- WORLDIR is the largest feature, followed by MATE and the existing asset-production project.
- A complete five-project library supports four actual-content categories plus All.
- The existing public resume experience now has a dedicated timeline, separate from personal projects and community activity.
- All original biography, education, opportunities, skills, interest photos and contact information remain; the portrait stays in color.
- The AI Playground preview is explicitly Coming Soon, with a real local navigation anchor and no fake playable page.

Reference-site principles were studied in a real desktop/mobile browser: [Maciej Sojka](https://maciejsojka.dev/). The resulting layout is original and uses only this portfolio's own project media and text.

## Files

Generated entry pages:

- `index.html`, `en/index.html` (replaced homepage layout only).
- `zh/index.html` (new full Chinese homepage).

New homepage source:

- `design-tokens.css`, `homepage.css`, `homepage.js`.
- `data/portfolio-content.json`, `data/projects.json`, `data/modules.json`.
- `scripts/build-homepages.mjs`.

Verification and integration:

- `scripts/validate-homepages.mjs`, `scripts/protected-source-baseline.json`.
- `docs/main-module-contract.md`, this delivery note.

At initial delivery, no existing project detail, resume, shared stylesheet/script or media file was changed. The later approved theme imports are described above. The separate specialist portfolio repository was not touched.

## Checks

- Static generator and JavaScript syntax: passed, no installed dependency required.
- Static audit: 2,341 checks; 413 local references; all 37 protected SHA-256 values match the baseline.
- Real Chrome HTTP browser QA: 490 assertions, 58 screenshots, five primary widths (1920, 1440, 1366, 768, 390), both languages; zero errors/warnings. Both languages also passed a 320px overflow/bounds check.
- Filters, mobile navigation/Escape, locale switching, image dialog/focus restoration, motion preference, reduced motion, no-JavaScript content, `/en/` compatibility and WORLDIR `#chair-workflow` deep-link: passed.
- Original-content preservation audit: 311 checks; titles retain their original punctuation after visual line splitting.
- Native hero concept dimensions (1422 × 1106): browser capture and visual comparison completed.
- Main first-view resource inspection: no third-party requests, no MP4 download, no framework or 3D runtime needed. The main HTML/CSS/JS/token files total approximately 62 KB before compression; actual project-image bytes remain the dominant cost. This is a local resource check, not a production performance benchmark.
- Body, navigation and caption contrast against the homepage background: 11.71:1, 8.84:1 and 8.84:1 in the checked hero state. This is a targeted contrast check, not a complete WCAG certification.

The first browser launch was blocked by sandbox socket access. Restarting the localhost-only server outside the sandbox resolved it; the final report uses real HTTP, not the earlier file-backed fallback.

Not tested: Safari/Firefox, real phone hardware, production CDN/cache behavior and deployment. There is no known outstanding homepage failure in the tested Chrome environment. External profiles are retained links, not a fresh audit of third-party account ownership. The old Chinese LinkedIn placeholder remains an explicitly unconfigured disclosure.

## Future integration

See `main-module-contract.md` for routes, bilingual project manifest fields, repository-relative media URLs, `--kp-*` design tokens, namespace boundaries, optional module initialization/cleanup, and independent test expectations. Both future module manifest entries remain disabled with `href: null`. Existing WORLDIR detail links remain active.

## Evidence locations

Task evidence is outside the site repository and is not shipped as website assets:

The local task artifact directory (excluded from this repository) contains:

- `browser-qa-http/browser-qa.json` and final desktop/mobile screenshots.
- `content-preservation-check.json`.
- `final-native-hero.png`, `final-native-review.json`.
- `fidelity-ledger.md`.

Image-generation concepts are UI design references only. No generated image was added to the live site or presented as experimental evidence.
