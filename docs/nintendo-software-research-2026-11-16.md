# Nintendo-utgivna spel: publisherfilter och prisbegränsningar

Uppdaterad 2026-11-16. Nintendo-spelserien avgränsas nu till spel vars Nintendo-sida anger Nintendo som utgivare. Tredjepartsutgivna spel på Nintendo-konsoler räknas inte som Nintendo-spel.

## Vad som har tagits bort

Äldre katalogpriserna för 1987, 1991–1994 saknade fullständigt titelunderlag för att kontrollera spelens utgivare. Branschserierna 1998–2015 redovisade försäljning av mjukvara på Nintendo-format, inte bara Nintendo-utgivna spel. Därför går dessa värden inte att använda i en serie för Nintendo-spel. De ursprungliga raderna ligger kvar i `data/nintendo_software_prices_mixed_publishers_archive.csv` som arkiv och läses inte längre av pipelinen.

## Kvarvarande prisnoteringar

Av de 61 recensionsnoteringarna från blandade utgivare återstår 14 noterade priser för Nintendo-utgivna titlar, från 2019–2025. Varje rad har Nördlivs exakta prisuppgift och datum samt en officiell Nintendo-sida där Nintendo står som utgivare. De är lägsta priser vid recensionstillfället; kanaler och spel varierar. De mäter inte lanseringspris eller ett representativt årsgenomsnitt. Webbplatsen visar varje belopp som en separat punkt och tabellrad, jämför med inkomsten samma kalenderår och drar ingen trend mellan olika titlar.

Inga Nintendo-utgivna noteringar återstår i det här urvalet för 2017–2018 eller 2026. Frånvaron betyder inte att Nintendo saknade spel då, bara att den här prisinsamlingen saknar kvalificerad notering.

## Filer och verifiering

- `data/nintendo_software_review_price_observations.csv`: endast de 14 Nintendo-utgivna recensionsnoteringarna, med utgivare och officiell evidens-URL.
- `data/sources.json`: URL, definition, täckning, hämtningstid och begränsningar för källserierna.
- `data/nintendo_software_prices.csv`: tomt äldre årsschema; det blandade historiska materialet finns i arkivfilen.
- `scripts/build.py`: avvisar prisnoteringar utan utgivarvärdet Nintendo och en officiell Nintendo-URL; publicerar varje observation utan årsaggregering.
- `scripts/verify.py`: kontrollerar att bara Nintendo-utgivna rader finns kvar, räknar om löneandelarna och att trender inte sätts för olika enskilda titlar.
