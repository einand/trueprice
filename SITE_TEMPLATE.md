# Trueprice page template

All comparisons use `layouts/_default/comparison.html` and the same content sequence:

1. **Kort presentation**: what is measured, for whom, and which unit is used.
2. **Relativ kostnad**: item amount divided by annual wage, multiplied by 100. Household comparisons offer **En vuxen** or **Familj** (two adults with one average salary each). Console pages show only the individual scenario. Show year-on-year direction as ↑ or ↓ only where the series is comparable; provide its meaning to assistive technology.
3. **Kostnad per år**: a yearly price chart followed by a table. Show the observed value and relative share where both input series exist. Leave missing shares empty.
4. **Gemensamt löneunderlag och källor**: link to `/loner/` and expose provenance for the item series. Do not copy salary observations into page content.

Each comparison route must load, chart, table, and link only to its own item series. Keep the shared wage source reusable; do not place unrelated comparison series on an item's page.

The root route is a project presentation and navigation index. The `/loner/` page is the single human-readable directory of wage series and definitions. Raw reusable series remain in `data/` and are copied to the generated site's `data/` directory.

## Required front matter for a comparison

```yaml
title: Item name
layout: comparison
comparison:
  id: stable-series-id
  category: JÄMFÖRELSE NN · CATEGORY
  intro: One or two factual sentences describing the measure.
  available: false
  price_label: Item name and unit
  period: —
  price_description: Definition and important coverage limits.
```

`available` must stay `false` until observed source values, the annual wage join, source metadata, validation, and charts are ready. Never use sample values as published data. The shared layout renders an explicit no-data state for unavailable comparisons.

## Series rules

- A year-on-year arrow is only defined when current and preceding calendar-year shares are both observed and comparable. First years and gaps have no arrow.
- Use national/yearly coverage only when the source supports that coverage. Document tax inclusion, geographic scope, and price basis.
- Keep item source observations, wage observations, and any adjustment index as separate reusable inputs.
- Mark a structural definition or liable-population change as a series break. Do not draw a continuous line or year-on-year trend across it, even if a numeric value exists on both sides.
- For household-based fees, count a single fee for Familj. For per-person fees, count one fee for each adult. State the assumption beside the scenario control and in source metadata.
- Document source organization and URL, unit, definition, coverage, retrieval time, and transformations in `data/sources.json`.
- Never interpolate missing observations. Clearly distinguish nominal prices from inflation-adjusted prices.

## Adding a route

Create `content/<slug>/_index.md` with the front matter above, add it to the shared navigation in `layouts/_default/baseof.html`, and add a directory card to `content/_index.md`. Console brands use the Konsoller dropdown with separate Mjukvara and Hårdvara routes. Keep page-specific styling and markup out of comparison content; shared presentation belongs in the comparison layout and site stylesheet.
