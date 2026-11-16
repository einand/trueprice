# Nintendo-spel: nya prisurval 2017–2026

Hämtat 2026-11-16. 61 daterade prisnoteringar ger tio årsvisa snitt. Alla nya priser avser spel på Switch eller Switch 2; även tredjepartsutgivare ingår. Sidan visar snitt per urval och år. Individuella titlar sparas endast som granskningsunderlag.

| År | Antal noteringar | Oviktat snitt, kr/spel |
|---|---:|---:|
| 2017 | 2 | 398.00 |
| 2018 | 3 | 366.33 |
| 2019 | 8 | 395.25 |
| 2020 | 10 | 365.40 |
| 2021 | 5 | 400.60 |
| 2022 | 6 | 303.17 |
| 2023 | 5 | 538.20 |
| 2024 | 7 | 392.71 |
| 2025 | 10 | 478.10 |
| 2026 | 5 | 327.00 |

## Vad värdena betyder

Noteringarna är Nördlivs uttryckligen daterade lägstaprisuppgifter, med Prisjakt, Nintendo/eShop eller DekuDeals angivet som ursprung. Det är redaktionellt rapporterade prisobservationer, inte myndighetsstatistik eller en självständigt verifierad köptransaktion. Den angivna recensionsplattformen måste vara Switch eller Switch 2. Den oberoende pipelinekontrollen räknar om varje snitt från den sparade observationsfilen.

Urvalet hittades genom tolv sidor i Nördlivs offentliga WordPress-API (sökord Nintendo, poster efter 2016-01-01) och granskning av prisavsnitten. Vi behöll exakta SEK-belopp med explicit källa och datum, i publiceringsåret och högst 45 dagar före publicering. Utländsk valuta, ungefärliga priser, motstridiga datum och explicit andra prisplattformar uteslöts. Urvalet är avgränsat och innehåller inte alla recensioner eller spel. Olika år har olika titlar, butikskanaler och datum. De årsvisa snitten är därför inte representativa nationella årsmedel eller en jämförbar prisindexserie. De får ingen trendpil.

2016 saknar ännu en kvalificerad svensk prisnotering i detta urval. De äldre luckorna kvarstår. 2026 avser endast observerade datum t.o.m. hämtningen; året är inte avslutat. SCB-årslön för 2026 saknas i projektet, så priset visas utan löneandel och 2025 är senaste jämförbara år. Lön för andra år återanvänds inte som ersättning.

Källornas generella skattevillkor är inte särredovisade per recension. Beloppen används som rapporterade konsumentnoteringar i SEK utan momsjustering eller valutaomräkning. Både digitala priser och butikernas lägstapriser förekommer, vilket ska beaktas vid jämförelse.

## Filer

- `data/nintendo_software_review_price_observations.csv`: samtliga 61 belopp med datum, plattform, källa, hämtningstid och källans prisformulering.
- `data/sources.json`: definition, urval, täckning, samtliga URL:er och omräkningsmetod.
- `scripts/build.py`: räknar snitten, kopplar lön på år och skriver prisdata med källmetadata.
- `scripts/verify.py`: oberoende omräkning av alla nya snitt och löneandelar.

Fullständiga källformuleringar finns i observationsfilen; inga löpande recensionstexter återpubliceras.
