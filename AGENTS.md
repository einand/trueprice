# Project instructions

## Site structure
- The root page (`content/_index.md`) is a presentation and directory only. Do not put item prices, yearly values, or item charts on it.
- Every item comparison lives at its own route (`/bensin/`, `/skatt/`, `/tv-licens/`) and uses the shared `comparison` layout.
- Keep comparison sections in this order: short description, cost as a share of wage chart, annual item price chart, annual values table, then links to the shared wage page and source metadata.
- Use one shared wage data page at `/loner/`. Item pages must link to it rather than reproduce wage series or wage tables.
- Trend presentation is a single arrow: ↑ means more expensive relative to wage than the previous year; ↓ means cheaper. No percentage change is needed. Preserve a text label for screen readers.
- An unavailable series still uses the shared layout, with an explicit no-data state. Never add illustrative or inferred values to make a graph look complete.

## Data and evidence
- Store observed item series in separate, clearly named source files. Document source, URL, unit, definition, coverage, retrieval time, and transformations in `data/sources.json`.
- Keep gaps as gaps. Do not interpolate or silently change definitions.
- Run `npm run validate` and `npm run build` after changes to templates, pipeline, or source data.
- Do not publish or push unless the user explicitly asks.

## Adding a comparison
1. Add a content section with the required `comparison` front matter fields documented in `SITE_TEMPLATE.md`.
2. Add a pipeline series and source metadata before setting `available: true`.
3. Add a navigation link in `layouts/_default/baseof.html` and a directory card on the root page.
4. Keep all comparison pages on `layouts/_default/comparison.html`; avoid one-off page markup or styles.
