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
    plotYear: d.plot_year ?? d.year,
    gameTitle: d.game_title || null,
    observationDate: d.observation_date || null,
    amount: isTvPage ? d.fee_sek : ((isNintendoHardware || isNintendoSoftware) ? d.price_sek : d.price_sek_per_liter),
    familyAmount: isTvPage ? (d.fee_sek == null ? null : d.fee_sek * (d.fee_unit === 'person_year_max' ? 2 : 1)) : ((isNintendoHardware || isNintendoSoftware) ? d.price_sek : d.price_sek_per_liter),
    console: d.console || null,
    priceBasis: d.price_basis || null,
    priceEur: d.price_eur ?? null,
    observationSourceUrls: d.observation_source_urls || [],
    observationDates: d.observation_dates || [],
    sourceUrl: d.source_url || null,
    publisherSourceUrl: d.publisher_source_url || null,
    wageBasis: d.wage_basis || null,
    wageSourceUrl: d.wage_source_url || null,
    annualWage: d.annual_wage_sek ?? null,
    disposableIncome: d.disposable_income_2024_sek ?? null,
    disposableOne: d.disposable_share_percent ?? null,
    disposableFamily: d.disposable_share_percent_two_adults ?? null,
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
  const valid = rows.filter((d) => d.one != null || d.family != null || d.disposableOne != null || d.disposableFamily != null);
  const chartStart = rows[0]?.year || valid[0]?.year || 0;
  const chartEnd = rows.at(-1)?.year || valid.at(-1)?.year || chartStart;
  document.getElementById('chart-period').textContent = valid.length ? `${chartStart}–${chartEnd}` : '—';
  renderRelative(root, valid, chartStart, chartEnd);
  renderAmount(document.getElementById('price-chart'), rows);
  renderTable(document.getElementById('table'), rows);
  document.getElementById('chart-takeaway').textContent = isNintendoSoftware
    ? 'Varje punkt är en prisnotering för en Nintendo-utgiven titel, inte ett årsgenomsnitt. Punkterna binds inte ihop eftersom titelurval och recensionsdatum varierar. Andelen jämförs med bruttolön och SCB:s disponibla hushållsmedian samma kalenderår.'
    : isNintendoHardware
    ? 'Punkterna visar olika konsolers rapporterade svenska lanseringspris. Modellerna lanserades olika år; linjer och år-till-år-pilar används därför inte. NES-andelen använder en separat historisk industrilön och är inte direkt jämförbar med SCB:s allsektorslön från 1992.'
    : isTvPage
    ? 'Tidsaxeln börjar 1925. Inkomstjämförelser börjar 1991 där hushållsmåttet finns; SCB:s bruttoårslön börjar 1992. Tidigare år lämnas tomma. Linjebrott markerar ändrade avgiftsregler.'
    : 'Röd linje visar andel av bruttolön och blå linje visar andel av disponibel hushållsinkomst. För bensin visas familjens andel som samma literpris delat med två hushålls disponibla medianinkomster. Uppåtpil betyder dyrare relativt bruttolön; nedåtpil billigare.';
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
    const values = points.flatMap((d) => [d.one, d.family, d.disposableOne, d.disposableFamily]).filter((v) => v != null);
    const max = values.length ? (Math.ceil(Math.max(...values) * 200) / 200 || 1) : 1;
    const x = (year) => m.left + (lastYear===firstYear ? iw/2 : (year-firstYear)*iw/(lastYear-firstYear));
    const y = (v) => m.top + ih - v/max*ih;
    const grid = Array.from({length:6}, (_,i) => { const v=max*i/5, yy=y(v); return `<line class="grid-line" x1="${m.left}" x2="${w-m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left-12}" y="${yy+3}" text-anchor="end">${fmt(v,3)}%</text>`; }).join('');
    const series = (isConsolePage ? [['one',''],['disposableOne',' blue']] : [['one',''],['family',' blue'],['disposableOne',' gold'],['disposableFamily',' gold']]).map(([key, color]) => {
      const ps = points.map((d,i) => ({...d,index:i,value:d[key]})).filter((d) => d.value != null);
      const lines = (isNintendoHardware || isNintendoSoftware) ? '' : segments(ps).map((g) => g.length > 1 ? `<polyline class="chart-line${color.includes('blue') ? ' chart-line-blue' : color.includes('gold') ? ' chart-line-gold' : ''}" points="${g.map((p)=>`${x(p.year)},${y(p.value)}`).join(' ')}"/>` : '').join('');
      const marks = ps.map((p) => `<circle class="chart-point${color.includes('blue') ? ' chart-point-blue' : color.includes('gold') ? ' chart-point-gold' : ''}" cx="${x(p.plotYear)}" cy="${y(p.value)}" r="3.5" tabindex="0" aria-label="${p.gameTitle ? `${p.gameTitle}, ` : ''}${p.observationDate || p.year}: ${fmt(p.value,4)} procent"><title>${p.gameTitle ? `${p.gameTitle}, ` : ''}${p.observationDate || p.year}: ${fmt(p.value,4)} %</title></circle>`).join('');
      return lines + marks;
    }).join('');
    const yearStep = lastYear-firstYear > 60 ? 20 : lastYear-firstYear > 30 ? 10 : 5;
    const labels = Array.from({length:Math.floor((lastYear-firstYear)/yearStep)+1},(_,i)=>firstYear+i*yearStep).concat(lastYear).filter((year,i,all)=>all.indexOf(year)===i).map((year) => `<text class="axis-label" x="${x(year)}" y="${h-8}" text-anchor="middle">${year}</text>`).join('');
    const firstObserved = points.find((d) => d.one != null || d.family != null || d.disposableOne != null || d.disposableFamily != null)?.year;
    const missing = firstObserved && firstObserved > firstYear ? `<rect class="chart-missing-region" x="${x(firstYear)}" y="${m.top}" width="${x(firstObserved)-x(firstYear)}" height="${ih}"/><text class="chart-missing-label" x="${(x(firstYear)+x(firstObserved))/2}" y="${m.top+ih/2}" text-anchor="middle">Löneunderlag saknas</text>` : '';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${itemName} som andel av årslön och disponibel hushållsinkomst; tidsaxel ${firstYear} till ${lastYear}" preserveAspectRatio="none">${grid}${missing}${series}${labels}</svg>`;
  }
  function renderAmount(el, points) {
    if (!el) return;
    const w=900,h=260,m={top:16,right:24,bottom:34,left:70},iw=w-m.left-m.right,ih=h-m.top-m.bottom;
    const maxV=Math.max(...points.map((d)=>d.familyAmount||d.amount||0)),step=isTvPage?500:(isNintendoHardware?500:5),max=Math.ceil(maxV/step)*step||1;
    const firstYear=points[0]?.year||0,lastYear=points.at(-1)?.year||firstYear;
    const x=(year)=>m.left+(lastYear===firstYear?iw/2:(year-firstYear)*iw/(lastYear-firstYear)), y=(v)=>m.top+ih-v/max*ih;
    const grid=Array.from({length:5},(_,i)=>{const v=max*i/4,yy=y(v);return `<line class="grid-line" x1="${m.left}" x2="${w-m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left-12}" y="${yy+3}" text-anchor="end">${fmt(v,0)} kr</text>`}).join('');
    const amountSeries=isTvPage?[['amount','En vuxen',''],['familyAmount','Familj',' blue']]:[['amount',itemName,'']];
    const series=amountSeries.map(([key,label,color])=>{
      const ps=points.map((d)=>({...d,value:d[key]})).filter(d=>d.value!=null);
      const lines=(isNintendoHardware||isNintendoSoftware)?'':segments(ps).map(g=>g.length>1?`<polyline class="chart-line${color?' chart-line-blue':''}" points="${g.map(p=>`${x(p.year)},${y(p.value)}`).join(' ')}"/>`:'').join('');
      const marks=ps.map(p=>`<circle class="chart-point${color?' chart-point-blue':''}" cx="${x(p.plotYear)}" cy="${y(p.value)}" r="2.8"><title>${p.gameTitle?`${p.gameTitle}, `:''}${p.observationDate||p.year}${p.console?`, ${p.console}`:''}${p.platformScope?`, ${p.platformScope}`:''}, ${label}: ${fmt(p.value,(isTvPage||isNintendoHardware)?0:2)} kr</title></circle>`).join('');
      return lines+marks;
    }).join('');
    const labels=[...new Set(points.map(d=>d.year))].map(year=>({year})).map(d=>d.year%5===0||d.year===firstYear||d.year===lastYear?`<text class="axis-label" x="${x(d.year)}" y="${h-8}" text-anchor="middle">${d.year}</text>`:'').join('');
    el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${itemName} per år${isTvPage?' för en vuxen och familj':''}" preserveAspectRatio="none">${grid}${series}${labels}</svg>`;
  }
  function renderTable(el, points) {
    if (!el) return;
    const body=points.map(d=>{
      const mark=(t)=>`<td class="trend-cell ${arrow(t)==='↑'?'trend-up':arrow(t)==='↓'?'trend-down':''}" aria-label="${trendLabel(t)}">${arrow(t)}</td>`;
      const share=(v)=>`<td class="share">${val(v,4)}${v==null?'':' %'}</td>`;
      if (isNintendoHardware) return `<tr><td>${d.year}</td><td>${d.console}</td><td>${val(d.amount,0)} kr${d.console==='Nintendo Wii'?' ≈':''}</td>${share(d.one)}<td>${val(d.disposableIncome,0)} kr</td>${share(d.disposableOne)}<td>${d.priceBasis || '—'}${d.sourceUrl?` <a href="${d.sourceUrl}">Priskälla ↗</a>`:''}<br><small>${d.wageBasis || 'Löneunderlag saknas'}${d.wageSourceUrl?` <a href="${d.wageSourceUrl}">Lönekälla ↗</a>`:''}</small></td></tr>`;
      if (isNintendoSoftware) return `<tr><td>${d.year}</td><td>${d.gameTitle || '—'}</td><td>${d.platformScope || '—'}</td><td>${val(d.amount,2)} kr/spel</td><td>${val(d.annualWage,0)} kr${d.wageSourceUrl?` <a href="${d.wageSourceUrl}">Lönekälla ↗</a>`:''}<br><small>${d.wageBasis || 'Löneunderlag saknas'}</small></td>${share(d.one)}<td>${val(d.disposableIncome,0)} kr</td>${share(d.disposableOne)}${mark(d.trend)}<td>${d.priceBasis || '—'}${d.sourceUrl?` <a href="${d.sourceUrl}">Prisnotering ↗</a>`:''}${d.publisherSourceUrl?` · <a href="${d.publisherSourceUrl}">Utgivare ↗</a>`:''}</td></tr>`;
      if (isConsolePage) return `<tr><td>${d.year}</td><td>${val(d.amount,2)} ${page.dataset.priceUnit || 'kr'}</td>${share(d.one)}<td>${val(d.disposableIncome,0)} kr</td>${share(d.disposableOne)}${mark(d.trend)}</tr>`;
      if (!isTvPage) return `<tr><td>${d.year}</td><td>${val(d.amount,2)} kr/l</td>${share(d.one)}${mark(d.trend)}${share(d.family)}${mark(d.familyTrend)}<td>${val(d.disposableIncome,0)} kr</td>${share(d.disposableOne)}${share(d.disposableFamily)}</tr>`;
      const adultUnit=d.unit==='household_year'?'kr/hushåll':d.unit==='receiver_year'?'kr/mottagare':'kr/person, max';
      const familyUnit=d.unit==='household_year'?'kr/hushåll':d.unit==='receiver_year'?'kr/mottagare (en delad apparat)':'kr/hushåll, max';
      return `<tr><td>${d.year}</td><td>${val(d.amount,0)} ${adultUnit}</td><td>${val(d.familyAmount,0)} ${familyUnit}</td>${share(d.one)}${mark(d.trend)}${share(d.family)}${mark(d.familyTrend)}<td>${val(d.disposableIncome,0)} kr</td>${share(d.disposableOne)}${share(d.disposableFamily)}</tr>`;
    }).join('');
    const headers=isNintendoHardware?'<tr><th>Lanseringsår enl. källa</th><th>Konsol</th><th>Lanseringspris</th><th>Andel av årslön</th><th>Disponibel hushållsinkomst (2024 års kr)</th><th>Andel av disponibel inkomst</th><th>Källanmärkning</th></tr>':isNintendoSoftware?'<tr><th>År</th><th>Nintendo-utgiven titel</th><th>Plattform</th><th>Lägsta recensionspris</th><th>Jämförelselön</th><th>Andel av årslön</th><th>Median disponibel hushållsinkomst (2024 års kr)</th><th>Andel av disponibel inkomst</th><th>Trend</th><th>Pris- och utgivarkälla</th></tr>':isConsolePage?'<tr><th>År</th><th>Pris</th><th>Andel av årslön</th><th>Median disponibel hushållsinkomst (2024 års kr)</th><th>Andel av disponibel inkomst</th><th>Trend</th></tr>':isTvPage?'<tr><th>År</th><th>En vuxen, avgift</th><th>Familj, avgift</th><th>En vuxen, andel av årslön</th><th>Trend</th><th>Familj, andel av årslön</th><th>Trend</th><th>Median disponibel hushållsinkomst (2024 års kr)</th><th>En vuxen, andel disponibel</th><th>Familj, andel disponibel</th></tr>':'<tr><th>År</th><th>Bensinpris</th><th>En vuxen, andel av årslön</th><th>Trend</th><th>Familj, andel av årslön</th><th>Trend</th><th>Median disponibel hushållsinkomst (2024 års kr)</th><th>Andel disponibel, en vuxen</th><th>Andel disponibel, familj</th></tr>';
    const note=isNintendoSoftware?'Kostnadsandelar jämför varje enskild Nintendo-utgiven speltitel med bruttolönen och SCB:s disponibla hushållsmedian samma år. Hushållsinkomsten är inte individuell lön och hushållet kan ha fler medlemmar. Priserna är lägsta recensionsnoteringar, inte lanseringspriser; titlar och kanaler varierar. Ingen årsmedel- eller trendserie visas.':isNintendoHardware?'NES-andelen av bruttolön använder separat timlön i tillverkningsindustrin 1987. Disponibel inkomst saknas för NES. Övriga disponibla inkomstandelar använder SCB:s hushållsmedian i fasta 2024 års priser. Switch 2-priset är en rapporterad återförsäljarprislapp.':isConsolePage?'Visas både mot genomsnittlig bruttolön och mot disponibel hushållsinkomst; inkomstmåtten har olika definitioner.':(isTvPage?'Disponibel-andel använder en hushållsmedian, inte en enskild vuxens inkomst. Avgiftsbeloppet för Familj följer samma antagande om hushållsavgift eller två personavgifter som i bruttolönsjämförelsen. Saknade inkomstår visas som luckor.':'Disponibel-andel är literpriset dividerat med hushållets medianinkomst, inte kostnaden för hushållets faktiska bensinförbrukning. Familjescenariot visar samma liter i bruttolönsjämförelsen. Hushållsmedianen visas som separat inkomstjämförelse.');
    el.innerHTML=`<table class="comparison-data-table${isTvPage?' comparison-data-table-tv':''}"><thead>${headers}</thead><tbody>${body}</tbody></table><p class="table-note">${note}</p>`;
  }
})();
