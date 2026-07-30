# Personal Experience Hub

Interactive personal brand site for **Illés István Kristóf** — a story-first homepage, with deep-dive area pages and downloadable role-fit CVs. Live at [krisithecoder.hu](https://krisithecoder.hu).

## Structure

```
PersonalWEB/
├── index.html              Story opener (one continuous narrative)
├── areas/                  Key-area deep dives + CV download
│   ├── hr-ta.html
│   ├── delivery.html
│   ├── build.html          (+ live HR HUB demo)
│   └── ops.html
├── cv/                     Standalone role-fit PDFs
│   └── src/                ATS HTML sources
├── css/site.css
├── js/hub-interact.js
├── js/hub-demo.js
└── CNAME
```

## Flow

1. **Home** — scroll the personal journey (not a portfolio of sections).
2. **Paths** — enter HR / Delivery / Build / Ops for depth.
3. **Download CV** — separate pre-built PDF from `cv/` (not print-of-site).

## Local preview

```bash
npm run serve
```

Open http://localhost:5173

## Regenerate CV PDFs

After editing files in `cv/src/`:

```bash
npm install
npx playwright install chromium
npm run generate-cvs
```

PDFs are written to `cv/*.pdf` and committed for static hosting.

## Design notes

- One brand shell; four area accents (teal / amber / blue / slate-green).
- Responsive, modern, intentional motion (`prefers-reduced-motion` respected).
- CV PDFs stay plain document design — independent of the marketing site.
