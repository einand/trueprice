# Granskning 2026-11-16

Granskningen omfattar alla befintliga jämförelsesidor, källdata, genererade värden och diagramkod. Det går inte att ge en generell garanti för alla historiska uppgifter. Nedan skiljs avstämda källvärden från beräkningar och kvarstående osäkerheter. Inget har publicerats i denna granskning.

## Avstämda originalserier

- SCB, [genomsnittlig månadslön efter sektor](https://www.scb.se/hitta-statistik/statistik-efter-amne/arbetsmarknad/loner-och-arbetskostnader/lonestrukturstatistik-hela-ekonomin/pong/tabell-och-diagram/genomsnittlig-manadslon-efter-sektor/): samtliga 34 lokala värden 1992–2025 stämmer med Totalt / Samtliga sektorer. Jämförelsen använder bruttolön × 12; detta är inte disponibel inkomst.
- Riksbankens [ursprungliga lönearbetsbok](https://www.riksbank.se/globalassets/media/forskning/monetar-statistik/volym1/volumeich10wages1860_.xls), tabeller I.A10.1 och I.A10.2: samtliga 2 309 lokala observationer stämmer, med CSV-filens avrundning och korrekt koppling mellan industrikolumner och kön. Omräkningen × 2 080 timmar är ett uttryckligt jämförelsescenario (40 × 52), inte observerad historisk årsinkomst eller historisk arbetstid.
- Energimyndighetens [arbetsbok Energiläget i siffror 2026](https://www.energimyndigheten.se/4a076b/globalassets/statistik/energilaget/energilaget-i-siffror-2026-excel.xlsx), blad 5.5: samtliga 46 lokala bensinvärden 1980–2025 stämmer med källans värden i 2024 års prisnivå. Källrubriken anger inklusive skatter och moms.
- SCB:s [KPI-API](https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020M1980), innehållskod 000007T9: samtliga 46 lokala årsmedel stämmer med aritmetiskt medel av tolv observerade månader. Bensinens omräkning är realpris × KPI för året / KPI 2024, avrundat till öre. CSV-källans begränsade decimalprecision ger ingen exaktare historisk prisuppgift än källan.

## Rättelser

- TV 1978 och 1979: 400 → **480 kr** = 340 + 140 kr. [KrU 1977/78:24](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/med-anledning-av-propositionerna-19777891-om_g101kru24/html/) och [propositionens lagtext, giltig från 1 juli 1978](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/proposition/om-radions-och-televisionens-fortsatta-verksamhet_g10391/html/). Även 1980 års betänkande beskriver den tidigare nivån 340 + 140 kr.
- TV 1980: 400 → **572 kr** = 412 + 160 kr. [KrU 1979/80:24](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/med-anledning-av-propositionen-197980100-savitt_g301kru24/html/), utskottets förslag inklusive 2 kr utöver regeringens föreslagna 410 kr. Kontroll mot [prop. 1980/81:101](https://lagen.nu/prop/1980/81:101), som beskriver 412 kr före höjningen till 508 kr.
- TV 1984: 708 → **736 kr** = (144 + 40 kr per kvartal) × 4. [KrU 1983/84:17](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/om-radio-och-television-prop-198384100-bil-10_g701kru17/html/), bilaga 1 (tillstyrkt), giltig 1 juli 1984. Reservationen i bilaga 2 är inte underlag för den sparade avgiften.
- Nintendo 2010–2015: tidigare kronpriser och tillhörande löneandelar/trendpilar har dragits tillbaka. Rapporterna 2010–2014 trycker datumanknutna SEK/EUR-kurser, inte årsgenomsnitt. Rapporten 2015 styrker inte återomräkningskursen. SCB:s årsgenomsnitt är därför inte en verifiering av de kronpriser som ursprungligen betalades. Försäljningsvärden och antal exemplar finns kvar; tabellen visar EUR/spel. Inga ersättningsvärden uppskattas.
- Nintendo-spelens relativa diagram ritade sammanhängande linjer trots att sidtexten sade motsatsen. Båda diagrammen visar nu bara separata punkter. Dubbla årsetiketter har tagits bort i prisdiagrammet.
- Motstridiga texter om Nintendo-trendpilar och hushållsavgifter har rättats. Bensinens familjescenario avser samma liter delad med två löner, inte ett antagande om hushållets årsvisa körsträcka.
- Två trasiga historiska källadresser har ersatts med befintliga adresser för samma SOU respektive riksdagsbetänkande.

## Matematik och presentation

`python3 scripts/verify.py` kontrollerar samtliga 181 genererade dataposter oberoende av byggskriptets mellanresultat: pris/årslön × 100, familjens nämnare och avgiftsmultiplikator, datafilernas kopior, metadata, luckor samt TV- och bensintrender. Nintendo får ingen familjejämförelse. Från 2019 är TV-familjens belopp två maxavgifter och nämnaren två löner; därför är andelen identisk med individens. Före 2019 är familjens andel hälften vid en gemensam avgift/mottagare.

Webbläsarkontroll av lokalt Hugo-bygge: bensin (46 tabellrader, 68 relativa punkter), TV (101 tabellrader inklusive två luckor, 68 relativa punkter), Nintendo hårdvara (9 punkter) och mjukvara (25 tabellrader, 19 kronpunkter). Inga NaN/Infinity-koordinater; Nintendo-diagrammen saknar sammanbindande linjer. TV-linjen bryts vid 2019. Startsidan har inga varudiagram; skatt och ännu tomma konsolserier visar uttryckligt datalöst läge.

## Kvarstående begränsningar

- Historiska TV-avgifter före 1991 är en sammansatt serie: radio, radio plus TV, färg-TV samt senare enhetlig TV-avgift. Samma tjänst/utrustning eller geografiska täckning gäller inte hela perioden. Alla tidiga avgifters ikraftträdanden och oförändrade mellanår har inte blivit självständigt återverifierade i denna granskning. De ska inte beskrivas som en fullständigt jämförbar hundraårsserie.
- TV-tabellen 1991–2005 stämmer med SOU 2005:2. Senare hänvisningar styrker bl.a. 2 076 kr 2009–2014, 2 216 kr från juli 2015 och 2 340 kr från januari 2017. Skatteverket bekräftar 1 249 kr 2025. Serien är avsiktligt en årsnivå vid 31 december, inte årets faktiskt erlagda belopp vid halvårshöjningar.
- Nintendo-katalogurvalens sju medelvärden kan inte fullt ut omräknas oberoende från en sparad lista med individuella priser: sådan transkription saknas i repot. 1992 nr 13:s länk gav dessutom HTTP 404 vid omhämtning. Dessa värden har inte fått en ny fullständig verifieringsstämpel. 1987 års flyer är daterad av en arkivförsäljare, inte säkert av trycksaken själv.
- Nintendo 1998–2009 bygger på branschens rapporterade försäljningsvärden/volymer, med metodbyte mot senare detaljhandelsmätning. Den äldre rapporten har själv avvikande kategorisering (Game Boy Advance före maskinens lanseringsår); källans etiketter är inte bevis för att just den konsolen såldes då. Snittet gäller endast de format som rapporterats, och är ingen generell rekommenderad nyspelsprislapp. Ändrad mix av format, rabatter och katalogtitlar påverkar snittet och därmed trendpilarna.
- Nintendo-konsolernas källor är delvis sekundära. NES år/pris är osäkra, Wii är ungefärligt inklusive spel, Wii U har olika paket och Switch 2 är rapporterat återförsäljarpris. Ingen matematisk kontroll gör dessa till officiella eller universella lanseringspriser.
- Äldre bensinnoteringar är intervall/enskilda zonpriser med olika skattestatus och visas separat. De är inte pumpprisårsmedel.

Originalfilernas fullständiga adresser och definitioner finns i `data/sources.json`. HTTP-status och SHA-256 för omhämtade källfiler finns i `docs/source-checks-2026-11-16.json`; status 200 bevisar åtkomst, inte statistisk korrekthet. FZ och Konkurrensverket gav 403 via direkt hämtning; FZ:s sammanställning gick att läsa via webbsökning. Några länkar kräver fortsatt arkivarbete.
