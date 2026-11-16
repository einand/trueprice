# Nintendo-spel: recensionsnoteringar sparade, inte publicerade som årsmedel

Hämtat 2026-11-16. Granskningen samlade 61 daterade prisnoteringar för Switch/Switch 2 från Nördliv, 2–10 per kalenderår 2017–2026. Noteringarna är en blandning av olika spel, däribland lågpris/indie och fullpristitlar, samt fysiska lägstapriser och digitala priser. De är inte ett slumpmässigt urval av spel, försäljningsvägda priser eller en konsekvent serie av nya Nintendo-publicerade fullprisspel.

Snitten som tidigare visades på webbplatsen underskattade lätt det pris en besökare förväntar sig när hen frågar vad ett Nintendo-spel kostar. Urvalets storlek, titlar och pris-kanal varierar mellan år. Vi har därför tagit bort årsmedlen från diagram, tabell och jämförelseberäkning. De 61 observationerna finns kvar enbart som revisionsunderlag; inga årsvärden har ersatts med antagna listpriser.

För att skapa en framtida jämförbar serie behöver samma urvalsregel användas varje år, exempelvis svenska rekommenderade/listade nypriser för Nintendo-publicerade fullprisspel, med en fast hantering av fysiska/digitala utgåvor och konsolgeneration. Daterade enskilda källor behövs för varje observerat belopp. Fram tills sådan serie kan beläggas, lämnas perioden efter 2015 utan årsmedel.

## Urval och källbegränsningar

Urvalet hittades genom tolv sidor i Nördlivs offentliga WordPress-API (sökord Nintendo, poster efter 2016-01-01) och granskning av prisavsnitten. Vi behöll exakta SEK-belopp med explicit källa och datum, i publiceringsåret och högst 45 dagar före publicering. Utländsk valuta, ungefärliga priser, motstridiga datum och priser explicit för en annan plattform uteslöts. Nördlivs uppgifter hänvisar till Prisjakt, Nintendo/eShop och DekuDeals. De är redaktionellt rapporterade priser, inte verifierade transaktioner; skattevillkor är inte särredovisade per notering.

## Filer

- `data/nintendo_software_review_price_observations.csv`: 61 enskilda belopp med datum, plattform, källa och prisformulering; inte inlästa i webbplatsens årsserie.
- `data/sources.json`: källa, urvalsdefinition, täckning, URL:er och uttrycklig notering om att arkivet inte aggregeras.
- `scripts/build.py`: kontrollerar observationernas format och kopierar datafilerna, men exkluderar dem från publicerade årsdata.
- `scripts/verify.py`: kontrollerar att arkiverade observationer inte förekommer i det genererade jämförelsedata.
