# NOCAI — Product Site

Static product site for Guangzhou Nuocai Digital Products Co., Ltd. (NOCAI), built as a single deployable folder.

- `index.html` — home
- `products/` — catalogue + one page per machine
- `company/`, `downloads/`, `contact/` — supporting pages
- `assets/` — images, Chinese-style SVG motifs, CSS, JS, brochure PDFs (13 English brochures)
- 404.html, robots.txt included

Deployment: upload the contents of this folder to a GitHub repository root, then Settings → Pages → Deploy from branch `main` / root.

All copy is bilingual (EN default, 中文 toggle). Content is generated from `content/*.json` by `build.py` in the design workspace.
