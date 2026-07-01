# QVAC Hackathon Showcase

A filterable gallery of the QVAC Hackathon (Beta Edition) project submissions. It is a plain static site: no framework, no backend, no build step needed just to view it.

## What is inside

- Filter by **track** (General Purpose, Mobile, Psy Models, Tinkerer) and by **category** (Healthcare, Legal, Privacy/Security, Web3, Emergency, and more), with live counts.
- A detail **modal** for each project, plus a standalone **page per project** at `projects/<slug>.html` with its own title, description, and Open Graph tags, so any single project can be shared and indexed.
- A **cover image** per project.

## Run locally

The app fetches `projects.json`, so it needs to be served over http (a plain `file://` open will not load the data):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Data

Every submission lives in `projects.json`. To update the showcase, replace that file and regenerate the per-project pages and the sitemap:

```bash
python3 build_pages.py
```

## Structure

- `index.html`: the gallery app (sidebar filters, grid, detail modal)
- `data.js`: static config plus a small runtime adapter that maps `projects.json` to the render shape
- `core.js`, `cover.js`: shared render helpers and generative fallback covers
- `projects/`: one static page per project
- `covers/`: per-project cover images
- `build_pages.py`: regenerates `projects/` and `sitemap.xml` from `projects.json`
- `covers_plan.json`: the image-generation prompt used for each project cover
- `assets/`: font and logos

## Deploy

Any static host works (GitHub Pages, Netlify, Cloudflare Pages, and so on). All paths are relative.
