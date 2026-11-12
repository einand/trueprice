# Trueprice

Trueprice compares the cost of things with wages: what share of annual pay a price represents, and how the relationship changes over time. Missing years stay missing; they are not interpolated.

## Site structure

- `/` introduces the project and links to the comparisons. Item prices and charts belong on their own pages.
- `/bensin/`, `/skatt/`, and `/tv-licens/` share `layouts/_default/comparison.html` and use the same content order: short description, relative-cost chart, annual price chart and table, then shared wage data and sources.
- `/loner/` is the single human-readable page for reusable wage series. Comparison pages link there instead of repeating wage tables.
- `AGENTS.md` and `SITE_TEMPLATE.md` define the rules for future page and data contributions.

The gasoline comparison uses annual national pump-price averages for gasoline 95 from 1980–2025. Its complete comparison with SCB's all-sector average monthly salary is available for 1992–2025. The Energy Agency price series is published in 2024 price level and converted to nominal values with SCB annual-average CPI. Source inputs remain separate in `data/`, and provenance is documented in `data/sources.json`.

The TV-fee comparison covers annual rates in force at year-end for 1991–2025. It changes from one household fee for a TV receiver through 2018 to the individual maximum public service fee from 2019. `/bensin/` and `/tv-licens/` each show only their own series and have separate generated JSON data files. The scenario control switches between one average gross salary and **Familj** (two adults, each earning the SCB average). Before 2019 the family scenario counts one household fee against two salaries; from 2019 it counts two individual fees against two salaries. The fee units are not equivalent; the TV chart marks the break and trend arrows stop at the change. The underlying source values and legislative/tax authority references are in `data/tv_license_annual_fees.csv` and `data/sources.json`.

A separate historical dataset contains manufacturing-industry hourly earnings by category and sex from the 1860s onward (coverage varies by category). This is not treated as equivalent to the modern all-sector monthly salary.

## Build

`npm run validate` validates inputs and generates `static/data/series.json`. The comparison JSON contains item prices and computed shares, but refers to the reusable wage source rather than repeating wage observations. `npm run build` validates, generates data, and builds the static Hugo site into `public/`. Use `npm run preview` to view it locally at `http://localhost:1313/trueprice/`.

Open the site through Hugo's local server instead of double-clicking `public/index.html`. The production build uses the GitHub Pages project path (`/trueprice/`), and browsers also restrict JavaScript data requests from `file://` pages. These path and browser-security rules can make a direct-file preview lose its styling or charts; this is not a CSS cache issue.

Tax and TV-license routes use the shared layout with explicit no-data states until their source series and definitions have been verified.
