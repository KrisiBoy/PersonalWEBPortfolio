# Personal Portfolio & Digital Developer CV

A modern personal portfolio and interactive digital CV built with semantic HTML5 and vanilla CSS/JS. Deployed at [krisithecoder.hu](https://krisithecoder.hu).

## Site structure

```
PersonalWEB/
├── index.html              Portfolio hub (tools, HR HUB demo, cert playgrounds)
├── IK_Developer_CV.html    ATS-friendly digital CV
├── js/hub-demo.js          Universal HR HUB interactive workflow demo
├── Pictures/               Avatar and hero images
├── CV/                     Downloadable PDF resume
└── CNAME                   Custom domain (krisithecoder.hu)
```

## Live pages

1. **Portfolio (`index.html`)** — Tool showcase with a connected Universal HR HUB demo (vacation calc → contract engine → print queue) plus FreeCodeCamp cert playgrounds.
2. **Digital CV (`IK_Developer_CV.html`)** — Minimalist resume formatted for ATS and recruiters.

## Featured work

### Universal HR HUB — HR Document Factory

Modular CustomTkinter desktop platform: multi-country JSON profiles, `{{token}}` template engine, vacation calculator addon, Nyomtatás print automation, PDF export via PyInstaller.

The portfolio includes a browser demo at `#hub-demo` that mirrors the workflow with shared state between addons.

### Legacy tools (evolved into HR HUB)

- **HR Contract Document Generator** — Original Hungary-focused tkinter prototype
- **Print Automation CLI** — Standalone CMD tool, now integrated as the Nyomtatás addon

### Cert projects

- **Budget Tracker** — Python OOP ledger with ASCII spend chart
- **User Configuration Manager** — Dict-based settings CRUD (FreeCodeCamp)

## Tech stack

- HTML5, CSS3 (custom properties, Grid, Flexbox)
- Vanilla JavaScript (no framework)
- Google Fonts: Geist, Geist Mono, Instrument Serif / DM Sans, DM Serif Display

- https://roadmap.sh/projects/single-page-cv
