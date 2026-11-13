(async function () {
  const root = document.getElementById('chart');
  if (!root) return;

  const page = document.querySelector('.comparison-page');
  const isTvPage = page?.dataset.comparison === 'tv-license';
  const isNintendoHardware = page?.dataset.comparison === 'nintendo-hardware';
  const isNintendoSoftware = page?.dataset.comparison === 'nintendo-software';
  const isConsolePage = page?.dataset.console === 'true';
  const itemName = page?.dataset.priceLabel || 'Pris';
  const response = await fetch(page?.dataset.seriesUrl || 'data/series.json');
  if (!response.ok) {
    root.innerHTML = '<p class="loading">Årsdiagrammet kunde inte hämtas. Öppna källdatan för att granska serien.</p>';
    return;
  }

  const payload = await response.json();
  const data = payload.data.slice().sort((a, b) => a.year - b.year);
  const fmt = (value, digits = 2) => Number(value).toLocaleString('sv-SE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const val = (value, digits = 2) => value == null ? '—' : fmt(value, digits);
  const arrow = (trend) => trend?.startsWith('dyrare') ? '↑' : trend?.startsWith('billigare') ? '↓' : '—';
  const trendLabel = (trend) => trend?.startsWith('dyrare') ? 'Dyrare relativt lön än föregående år' : trend?.startsWith('billigare') ? 'Billigare relativt lön än föregående år' : 'Ingen jämförbar trend';
  const rows = data.map((d) => ({
    year: d.year,
    amount: isTvPage ? d.fee_sek : ((isNintendoHardware || isNintendoSoftware) ? d.price_sek : d.price_sek_per_liter),
    familyAmount: isTvPage ? (d.fee_sek == null ? null : d.fee_sek * (d.fee_unit === 'person_year_max' ? 2 : 1)) : ((isNintendoHardware || isNintendoSoftware) ? d.price_sek : d.price_sek_per_liter),
    console: d.console || null,
    priceBasis: d.price_basis || null,
    sourceUrl: d.source_url || null,
    wageBasis: d.wage_basis || null,
    wageSourceUrl: d.wage_source_url || null,
    annualWage: d.annual_wage_sek ?? null,
    sampleSize: d.sample_size || null,
    platformScope: d.platform_scope || null,
    unit: isTvPage ? d.fee_unit : null,
    one: isTvPage ? d.share_percent : d.share_percent,
    family: isConsolePage ? null : d.share_percent_two_adults,
    trend: d.trend,
    familyTrend: d.trend_two_adults,
    breakBefore: isTvPage && d.break_before === true
  }));
  const latest = [...rows].reverse().find((d) => d.one != null && (isConsolePage || d.family != null));
  if (latest) {
    document.getElementById('latest-year').textContent = latest.year;
    document.getElementById('latest-share').textContent = fmt(latest.one, 4);
    if (!isConsolePage) document.getElementById('latest-family-share').textContent = fmt(latest.family, 4);
    for (const [id, trend] of (isConsolePage ? [] : [['latest-trend', latest.trend], ['latest-family-trend', latest.familyTrend]])) {
      const el = document.getElementById(id); el.textContent = arrow(trend); el.setAttribute('aria-label', trendLabel(trend));
    }
    const unit = isTvPage ? (latest.unit === 'household_year' ? 'kr/hushåll/år' : 'kr/person/år, max') : (page.dataset.priceUnit || (isNintendoSoftware ? 'kr/spel' : 'kr/l'));
    document.getElementById('latest-amount-label').textContent = isNintendoHardware ? latest.console : 'En vuxen';
    document.getElementById('latest-price').textContent = `${fmt(latest.amount, isTvPage ? 0 : 2)} ${unit}`;
    if (!isConsolePage) document.getElementById('latest-family-price').textContent = `${fmt(latest.familyAmount, isTvPage ? 0 : 2)} ${isTvPage ? (latest.unit === 'household_year' ? 'kr/hushåll/år' : 'kr/hushåll/år, max') : (page.dataset.priceUnit || 'kr/l')}`;
    document.getElementById('latest-amount-label').textContent = isNintendoHardware ? latest.console : (isConsolePage ? 'Pris' : 'En vuxen');
  }
  const valid = rows.filter((d) => d.one != null || d.family != null);
  const chartStart = rows[0]?.year || valid[0]?.year || 0;
  const chartEnd = rows.at(-1)?.year || valid.at(-1)?.year || chartStart;
  document.getElementById('chart-period').textContent = valid.length ? `${chartStart}–${chartEnd}` : '—';
  renderRelative(root, valid, chartStart, chartEnd);
  renderAmount(document.getElementById('price-chart'), rows);
  renderTable(document.getElementById('table'), rows);
  document.getElementById('chart-takeaway').textContent = isNintendoSoftware
    ? 'Punkterna visar medelpriset i daterade svenska Nintendo-källurval. Källtyp, urval och konsolgeneration skiljer sig, så punkterna binds inte ihop och ingen trendpil visas. År utan belagda prisurval är luckor; löneandel visas bara där SCB:s löneunderlag finns.'
    : isNintendoHardware
    ? 'Punkterna visar olika konsolers rapporterade svenska lanseringspris. Modellerna lanserades olika år; linjer och år-till-år-pilar används därför inte. NES-andelen använder en separat historisk industrilön och är inte direkt jämförbar med SCB:s allsektorslön från 1992.'
    : isTvPage
    ? 'Tidsaxeln börjar 1925. Löneandelen kan beräknas från 1992, då jämförbara årslöner börjar; tidigare år lämnas tomma. Linjebrott markerar ändrade avgiftsregler.'
    : 'Röd linje visar en vuxen och blå linje familj med två vuxna. Uppåtpil betyder dyrare relativt lön; nedåtpil billigare.';
  const historicalTable = document.getElementById('historical-data-table');
  if (historicalTable && page.dataset.historicalUrl) {
    const historicalResponse = await fetch(page.dataset.historicalUrl);
    if (historicalResponse.ok) {
      const lines = (await historicalResponse.text()).trim().split(/\r?\n/);
      const headers = lines.shift().split(',');
      const records = lines.map((line) => line.split(','));
      historicalTable.innerHTML = `<table class="comparison-data-table"><thead><tr><th>År</th><th>Pris/notering</th><th>Skatt</th><th>Område</th><th>Underlag</th></tr></thead><tbody>${records.map((record) => {
        const item = Object.fromEntries(headers.map((header, i) => [header, record[i]]));
        const low=Number(item.price_min_ore_per_liter)/100, high=Number(item.price_max_ore_per_liter)/100;
        const quotation=low===high?`${fmt(low,2)} kr/l`:`${fmt(low,2)}–${fmt(high,2)} kr/l`;
        const kind={annual_range:'Årsintervall',single_zone_price:'En zonnotering',current_price_not_annual_mean:'Enskilt pris (ej årsmedel)',calculated_price_october_1953:'Kalkylpris okt. (ej årsmedel)'}[item.observation_type]||item.observation_type;
        return `<tr><td>${item.year}</td><td>${quotation}</td><td>${item.tax_included==='true'?'Inklusive':'Exklusive'}</td><td>${item.geography==='O-zone'?'O-zon':'Ej angivet'}</td><td>${kind}</td></tr>`;
      }).join('')}</tbody></table><p class="table-note">Noteringarna är omräknade från öre till kronor per liter (÷ 100). De äldre värdena har olika skattestatus och geografisk/metodisk täckning; de ska inte läsas som en jämn årsmedelsserie.</p>`;
    } else historicalTable.innerHTML = '<p class="loading">De historiska prisnoteringarna kunde inte hämtas.</p>';
  }

  function segments(points) {
    const out = [];
    for (const p of points) {
      const prev = out.at(-1)?.at(-1);
      if (!prev || p.breakBefore || p.year !== prev.year + 1) out.push([]);
      out.at(-1).push(p);
    }
    return out;
  }
  function renderRelative(el, points, firstYear, lastYear) {
    const w = 900, h = 300, m = { top: 18, right: 24, bottom: 34, left: 70 }, iw = w-m.left-m.right, ih=h-m.top-m.bottom;
    const values = points.flatMap((d) => [d.one, d.family]).filter((v) => v != null);
    const max = Math.ceil(Math.max(...values) * 200) / 200 || 1;
    const x = (year) => m.left + (lastYear===firstYear ? iw/2 : (year-firstYear)*iw/(lastYear-firstYear));
    const y = (v) => m.top + ih - v/max*ih;
    const grid = Array.from({length:6}, (_,i) => { const v=max*i/5, yy=y(v); return `<line class="grid-line" x1="${m.left}" x2="${w-m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left-12}" y="${yy+3}" text-anchor="end">${fmt(v,3)}%</text>`; }).join('');
    const series = (isConsolePage ? [['one','']] : [['one',''],['family',' blue']]).map(([key, color]) => {
      const ps = points.map((d,i) => ({...d,index:i,value:d[key]})).filter((d) => d.value != null);
      const lines = isNintendoHardware ? '' : segments(ps).map((g) => g.length > 1 ? `<polyline class="chart-line${color ? ' chart-line-blue' : ''}" points="${g.map((p)=>`${x(p.year)},${y(p.value)}`).join(' ')}"/>` : '').join('');
      const marks = ps.map((p) => `<circle class="chart-point${color ? ' chart-point-blue' : ''}" cx="${x(p.year)}" cy="${y(p.value)}" r="3.5" tabindex="0" aria-label="${p.year}: ${fmt(p.value,4)} procent"><title>${p.year}: ${fmt(p.value,4)} %</title></circle>`).join('');
      return lines + marks;
    }).join('');
    const yearStep = lastYear-firstYear > 60 ? 20 : lastYear-firstYear > 30 ? 10 : 5;
    const labels = Array.from({length:Math.floor((lastYear-firstYear)/yearStep)+1},(_,i)=>firstYear+i*yearStep).concat(lastYear).filter((year,i,all)=>all.indexOf(year)===i).map((year) => `<text class="axis-label" x="${x(year)}" y="${h-8}" text-anchor="middle">${year}</text>`).join('');
    const firstObserved = points.find((d) => d.one != null || d.family != null)?.year;
    const missing = firstObserved && firstObserved > firstYear ? `<rect class="chart-missing-region" x="${x(firstYear)}" y="${m.top}" width="${x(firstObserved)-x(firstYear)}" height="${ih}"/><text class="chart-missing-label" x="${(x(firstYear)+x(firstObserved))/2}" y="${m.top+ih/2}" text-anchor="middle">Löneunderlag saknas</text>` : '';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${itemName} som andel av lön; tidsaxel ${firstYear} till ${lastYear}" preserveAspectRatio="none">${grid}${missing}${series}${labels}</svg>`;
  }
  function renderAmount(el, points) {
    if (!el) return;
    const w=900,h=260,m={top:16,right:24,bottom:34,left:70},iw=w-m.left-m.right,ih=h-m.top-m.bottom;
    const maxV=Math.max(...points.map((d)=>d.familyAmount||0)),step=isTvPage?500:(isNintendoHardware?500:5),max=Math.ceil(maxV/step)*step||1;
    const firstYear=points[0]?.year||0,lastYear=points.at(-1)?.year||firstYear;
    const x=(year)=>m.left+(lastYear===firstYear?iw/2:(year-firstYear)*iw/(lastYear-firstYear)), y=(v)=>m.top+ih-v/max*ih;
    const grid=Array.from({length:5},(_,i)=>{const v=max*i/4,yy=y(v);return `<line class="grid-line" x1="${m.left}" x2="${w-m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left-12}" y="${yy+3}" text-anchor="end">${fmt(v,0)} kr</text>`}).join('');
    const amountSeries=isTvPage?[['amount','En vuxen',''],['familyAmount','Familj',' blue']]:[['amount',itemName,'']];
    const series=amountSeries.map(([key,label,color])=>{
      const ps=points.map((d)=>({...d,value:d[key]})).filter(d=>d.value!=null);
      const lines=(isNintendoHardware||isNintendoSoftware)?'':segments(ps).map(g=>g.length>1?`<polyline class="chart-line${color?' chart-line-blue':''}" points="${g.map(p=>`${x(p.year)},${y(p.value)}`).join(' ')}"/>`:'').join('');
      const marks=ps.map(p=>`<circle class="chart-point${color?' chart-point-blue':''}" cx="${x(p.year)}" cy="${y(p.value)}" r="2.8"><title>${p.year}${p.console?`, ${p.console}`:''}${p.platformScope?`, ${p.platformScope}`:''}, ${label}: ${fmt(p.value,(isTvPage||isNintendoHardware)?0:2)} kr</title></circle>`).join('');
      return lines+marks;
    }).join('');
    const labels=points.map(d=>d.year%5===0||d.year===firstYear||d.year===lastYear?`<text class="axis-label" x="${x(d.year)}" y="${h-8}" text-anchor="middle">${d.year}</text>`:'').join('');
    el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${itemName} per år${isTvPage?' för en vuxen och familj':''}" preserveAspectRatio="none">${grid}${series}${labels}</svg>`;
  }
  function renderTable(el, points) {
    if (!el) return;
    const body=points.map(d=>{
      const mark=(t)=>`<td class="trend-cell ${arrow(t)==='↑'?'trend-up':arrow(t)==='↓'?'trend-down':''}" aria-label="${trendLabel(t)}">${arrow(t)}</td>`;
      const share=(v)=>`<td class="share">${val(v,4)}${v==null?'':' %'}</td>`;
      if (isNintendoHardware) return `<tr><td>${d.year}</td><td>${d.console}</td><td>${val(d.amount,0)} kr${d.console==='Nintendo Wii'?' ≈':''}</td>${share(d.one)}<td>${d.priceBasis || '—'}${d.sourceUrl?` <a href="${d.sourceUrl}">Priskälla ↗</a>`:''}<br><small>${d.wageBasis || 'Löneunderlag saknas'}${d.wageSourceUrl?` <a href="${d.wageSourceUrl}">Lönekälla ↗</a>`:''}</small></td></tr>`;
      if (isNintendoSoftware) return `<tr><td>${d.year}</td><td>${d.platformScope || '—'}</td><td>${val(d.amount,2)} kr/spel</td><td>${val(d.annualWage,0)} kr${d.wageSourceUrl?` <a href="${d.wageSourceUrl}">Lönekälla ↗</a>`:''}<br><small>${d.wageBasis || 'Löneunderlag saknas'}</small></td>${share(d.one)}<td>${d.sampleSize} spel</td><td>${d.priceBasis || '—'}${d.sourceUrl?` <a href="${d.sourceUrl}">Källannons ↗</a>`:''}</td></tr>`;
      if (isConsolePage) return `<tr><td>${d.year}</td><td>${val(d.amount,2)} ${page.dataset.priceUnit || 'kr'}</td>${share(d.one)}${mark(d.trend)}</tr>`;
      if (!isTvPage) return `<tr><td>${d.year}</td><td>${val(d.amount,2)} kr/l</td>${share(d.one)}${mark(d.trend)}${share(d.family)}${mark(d.familyTrend)}</tr>`;
      const adultUnit=d.unit==='household_year'?'kr/hushåll':d.unit==='receiver_year'?'kr/mottagare':'kr/person, max';
      const familyUnit=d.unit==='household_year'?'kr/hushåll':d.unit==='receiver_year'?'kr/mottagare (en delad apparat)':'kr/hushåll, max';
      return `<tr><td>${d.year}</td><td>${val(d.amount,0)} ${adultUnit}</td><td>${val(d.familyAmount,0)} ${familyUnit}</td>${share(d.one)}${mark(d.trend)}${share(d.family)}${mark(d.familyTrend)}</tr>`;
    }).join('');
    const headers=isNintendoHardware?'<tr><th>Lanseringsår enl. källa</th><th>Konsol</th><th>Lanseringspris</th><th>Andel av årslön</th><th>Källanmärkning</th></tr>':isNintendoSoftware?'<tr><th>År</th><th>Plattform</th><th>Prisurvalets medel</th><th>Jämförelselön</th><th>Andel av årslön</th><th>Urval</th><th>Prisunderlag</th></tr>':isConsolePage?'<tr><th>År</th><th>Pris</th><th>Andel av årslön</th><th>Trend</th></tr>':isTvPage?'<tr><th>År</th><th>En vuxen, avgift</th><th>Familj, avgift</th><th>En vuxen, andel</th><th>Trend</th><th>Familj, andel</th><th>Trend</th></tr>':'<tr><th>År</th><th>Bensinpris</th><th>En vuxen, andel</th><th>Trend</th><th>Familj, andel</th><th>Trend</th></tr>';
    const note=isNintendoSoftware?'Medelvärdena avser bara prissatta spel i respektive källa: 1987 Milu-reklamblad (12 NES-kassetter, årtalet anges av arkivförsäljaren), 1991 Larkman-annons i Datormagazin 6/91 (51 NES-spel), 1992 Aintronic i Datormagazin 13/92 (26 NES-spel, medel 359,77 kr; 10 SNES-spel, medel 476 kr) samt Landsbergs Spel & Data i Datormagazin 17/92 (44 SNES-titlar à 499 kr; vissa markerade "ute snart"), 1993 Spelhuset/High Score (17 SNES-spel) och 1994 Nordic Games (9 nya SNES-spel; annonsen beskriver priserna som låga). Källor, urval och plattform skiljer sig; värdena är inte års- eller marknadsgenomsnitt och ska inte jämföras som en trend. För 1987 och 1991 används Riksbankens manliga viktade genomsnittslön per timme i tillverkningsindustrin × 2 080 timmar; från 1992 används SCB:s genomsnittliga månadslön för samtliga sektorer × 12. Dessa löneunderlag har olika populationer och är inte direkt jämförbara. 1988–1990 och 1995– saknar verifierat prisurval.':isNintendoHardware?'NES-andelen (1,06 %) beräknas med mäns viktade genomsnittliga timlön i tillverkningsindustrin 1987, omräknad med 2 080 timmar/år. Övriga löneandelar använder SCB:s genomsnittslön för samtliga sektorer från 1992. Löneunderlagen har olika populationer och är inte direkt jämförbara. Switch 2-priset är en rapporterad återförsäljarprislapp; enligt Konkurrensverket satte återförsäljarna sina priser självständigt och Bergsala lämnade inget rekommenderat pris.':isConsolePage?'Andel beräknad mot en genomsnittlig årslön.':'Familj avser två vuxna med varsin genomsnittlig lön. Andelarna använder samma pris.';
    el.innerHTML=`<table class="comparison-data-table${isTvPage?' comparison-data-table-tv':''}"><thead>${headers}</thead><tbody>${body}</tbody></table><p class="table-note">${note}</p>`;
  }
})();
