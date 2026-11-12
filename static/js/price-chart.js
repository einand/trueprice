(async function () {
  const root = document.getElementById('chart');
  if (!root) return;

  const page = document.querySelector('.comparison-page');
  const isTvPage = page?.dataset.comparison === 'tv-license';
  const itemName = page?.dataset.priceLabel || 'Pris';
  const response = await fetch(page?.dataset.seriesUrl || 'data/series.json');
  if (!response.ok) {
    root.innerHTML = '<p class="loading">Årsdiagrammet kunde inte hämtas. Öppna källdatan för att granska serien.</p>';
    return;
  }

  const payload = await response.json();
  const data = payload.data.slice().sort((a, b) => a.year - b.year);
  let scenarioAdults = 1;
  const fmt = (value, digits = 2) => Number(value).toLocaleString('sv-SE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const valueOrDash = (value, digits = 2) => value === null || value === undefined ? '—' : fmt(value, digits);

  function trendFor(d, prefix) {
    const suffix = scenarioAdults === 2 ? '_trend_two_adults' : '_trend';
    return d[`${prefix}${suffix}`];
  }

  function adjustData(adults) {
    scenarioAdults = adults;
    return data.map((d) => ({
      year: d.year,
      gasolineAmount: d.gasoline_price_sek_per_liter,
      gasolineShare: adults === 2 ? d.share_percent_two_adults : d.share_percent,
      gasolineTrend: adults === 2 ? d.trend_two_adults : d.trend,
      tvAmount: d.tv_license_fee_sek === null || d.tv_license_fee_sek === undefined
        ? null
        : d.tv_license_fee_sek * (adults === 2 && d.tv_license_fee_unit === 'person_year_max' ? 2 : 1),
      tvUnit: d.tv_license_fee_unit,
      tvShare: adults === 2 ? d.tv_license_share_percent_two_adults : d.tv_license_share_percent,
      tvTrend: adults === 2 ? d.tv_license_trend_two_adults : d.tv_license_trend,
      tvBreak: d.tv_license_break_before === true
    }));
  }

  function arrow(trend) {
    return trend?.startsWith('dyrare') ? '↑' : trend?.startsWith('billigare') ? '↓' : '';
  }

  function trendLabel(trend) {
    return trend?.startsWith('dyrare') ? 'Dyrare relativt lön än föregående år'
      : trend?.startsWith('billigare') ? 'Billigare relativt lön än föregående år'
        : 'Ingen jämförbar trend';
  }

  function updateLatest(rows) {
    const key = isTvPage ? 'tvShare' : 'gasolineShare';
    const latest = rows.filter((d) => d[key] !== null && d[key] !== undefined).at(-1);
    if (!latest) return;
    const share = latest[key];
    const trend = isTvPage ? latest.tvTrend : latest.gasolineTrend;
    document.getElementById('latest-year').textContent = latest.year;
    document.getElementById('latest-share').textContent = fmt(share, 4);
    document.getElementById('latest-share-caption').textContent = scenarioAdults === 1
      ? 'av en genomsnittlig årslön'
      : 'av hushållets två genomsnittliga årslöner';

    const amount = isTvPage ? latest.tvAmount : latest.gasolineAmount;
    const amountUnit = isTvPage
      ? (latest.tvUnit === 'household_year' ? 'kr/hushåll/år' : `kr/${scenarioAdults === 2 ? 'hushåll' : 'person'}/år, max`)
      : (page.dataset.priceUnit || 'kr/l');
    document.getElementById('latest-price').textContent = `${fmt(amount, isTvPage ? 0 : 2)} ${amountUnit}`;
    document.getElementById('latest-amount-label').textContent = isTvPage && scenarioAdults === 2 ? 'Årsbelopp för hushållet' : 'Årsvärde';

    const arrowText = arrow(trend);
    const trendEl = document.getElementById('latest-trend');
    trendEl.textContent = arrowText;
    trendEl.setAttribute('aria-label', trendLabel(trend));
  }

  function scenarioNote() {
    const note = document.getElementById('scenario-explanation');
    if (!note) return;
    note.textContent = scenarioAdults === 1
      ? 'En vuxen med SCB:s genomsnittliga bruttolön.'
      : 'Familj med två vuxna och varsin genomsnittlig bruttolön. En hushållsavgift räknas en gång; personavgifter räknas för båda.';
  }

  function setScenario(adults) {
    const rows = adjustData(adults);
    document.querySelectorAll('.scenario-button').forEach((button) => {
      const selected = Number(button.dataset.adults) === adults;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    scenarioNote();
    updateLatest(rows);

    const shareRows = rows.filter((d) => d.gasolineShare !== null || d.tvShare !== null)
      .filter((d) => d.gasolineShare !== null || d.tvShare !== null);
    const firstYear = shareRows.find((d) => d.gasolineShare !== null || d.tvShare !== null)?.year;
    const lastYear = shareRows.filter((d) => d.gasolineShare !== null || d.tvShare !== null).at(-1)?.year;
    document.getElementById('chart-period').textContent = `${firstYear}–${lastYear}`;
    renderCombinedShareChart(root, shareRows, fmt);
    renderAnnualPriceChart(document.getElementById('price-chart'), rows, fmt, itemName, isTvPage);
    renderCombinedTable(document.getElementById('table'), rows, fmt);
    const takeaway = document.getElementById('chart-takeaway');
    takeaway.textContent = 'Röd linje: en liter bensin. Blå linje: TV-avgiften. Den blå linjen bryts 2019 då betalningsenheten ändrades; trendpilarna jämför bara år inom samma avgiftssystem.';
  }

  function groupAtBreak(series) {
    const groups = [];
    for (const point of series) {
      if (point.breakBefore || !groups.length) groups.push([]);
      groups[groups.length - 1].push(point);
    }
    return groups;
  }

  function renderCombinedShareChart(el, rows, fmt) {
    const w = 900, h = 300, m = { top: 18, right: 24, bottom: 34, left: 70 };
    const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
    const values = rows.flatMap((d) => [d.gasolineShare, d.tvShare]).filter((v) => v !== null && v !== undefined);
    const max = Math.ceil(Math.max(...values) * 200) / 200;
    const x = (i) => m.left + (rows.length === 1 ? iw / 2 : i * iw / (rows.length - 1));
    const y = (v) => m.top + ih - (v / max) * ih;
    const grid = [];
    for (let i = 0; i <= 5; i++) {
      const value = max * i / 5, yy = y(value);
      grid.push(`<line class="grid-line" x1="${m.left}" x2="${w - m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left - 12}" y="${yy + 3}" text-anchor="end">${fmt(value, 3)}%</text>`);
    }

    const gas = rows.map((d, i) => d.gasolineShare == null ? null : { index: i, year: d.year, value: d.gasolineShare, amount: d.gasolineAmount }).filter(Boolean);
    const tv = rows.map((d, i) => d.tvShare == null ? null : { index: i, year: d.year, value: d.tvShare, amount: d.tvAmount, breakBefore: d.tvBreak }).filter(Boolean);
    const gasPoints = gas.map((d) => `${x(d.index)},${y(d.value)}`).join(' ');
    const tvGroups = groupAtBreak(tv);
    const tvLines = tvGroups.map((g) => `<polyline class="chart-line chart-line-blue" points="${g.map((d) => `${x(d.index)},${y(d.value)}`).join(' ')}"/>`).join('');
    const gasMarks = gas.map((d, i) => `<circle class="chart-point${i === gas.length - 1 ? ' latest' : ''}" cx="${x(d.index)}" cy="${y(d.value)}" r="${i === gas.length - 1 ? 5.5 : 3.5}" tabindex="0" aria-label="Bensin ${d.year}: ${fmt(d.value, 4)} procent av årslönen"><title>Bensin ${d.year}: ${fmt(d.value, 4)} % · ${fmt(d.amount, 2)} kr/l</title></circle>`).join('');
    const tvMarks = tv.map((d, i) => `<circle class="chart-point chart-point-blue${i === tv.length - 1 ? ' latest' : ''}" cx="${x(d.index)}" cy="${y(d.value)}" r="${i === tv.length - 1 ? 5.5 : 3.5}" tabindex="0" aria-label="TV-avgift ${d.year}: ${fmt(d.value, 4)} procent av årslönen"><title>TV-avgift ${d.year}: ${fmt(d.value, 4)} %</title></circle>`).join('');
    const labels = rows.map((d, i) => i === 0 || i === rows.length - 1 || d.year % 5 === 0 ? `<text class="axis-label" x="${x(i)}" y="${h - 8}" text-anchor="middle">${d.year}</text>` : '').join('');
    const desc = 'Andel av årslönen för en liter bensin och TV-avgiften. TV-serien bryts vid systembytet 2019.';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="share-title share-desc" preserveAspectRatio="none"><title id="share-title">Bensin och TV-avgift som andel av årslön</title><desc id="share-desc">${desc}</desc>${grid.join('')}<polyline class="chart-line" points="${gasPoints}"/>${tvLines}${gasMarks}${tvMarks}${labels}</svg>`;
  }

  function renderAnnualPriceChart(el, rows, fmt, label, isTv) {
    if (!el) return;
    const series = rows.filter((d) => isTv ? d.tvAmount !== null : d.gasolineAmount !== null)
      .map((d) => ({ year: d.year, amount: isTv ? d.tvAmount : d.gasolineAmount, feeUnit: d.tvUnit, breakBefore: isTv && d.tvBreak }));
    if (!series.length) return;
    const w = 900, h = 260, m = { top: 16, right: 24, bottom: 34, left: 70 };
    const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
    const maxValue = Math.max(...series.map((d) => d.amount));
    const step = isTv ? 500 : 5;
    const max = Math.ceil(maxValue / step) * step;
    const x = (i) => m.left + (series.length === 1 ? iw / 2 : i * iw / (series.length - 1));
    const y = (v) => m.top + ih - (v / max) * ih;
    const grid = [];
    for (let i = 0; i <= 4; i++) {
      const value = max * i / 4, yy = y(value);
      grid.push(`<line class="grid-line" x1="${m.left}" x2="${w - m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left - 12}" y="${yy + 3}" text-anchor="end">${fmt(value, 0)} kr</text>`);
    }
    const indexed = series.map((d, i) => ({ ...d, index: i }));
    const groups = groupAtBreak(indexed);
    const lines = groups.map((g) => `<polyline class="chart-line${isTv ? ' chart-line-blue' : ''}" points="${g.map((d) => `${x(d.index)},${y(d.amount)}`).join(' ')}"/>`).join('');
    const marks = indexed.map((d, i) => `<circle class="chart-point${isTv ? ' chart-point-blue' : ''}${i === indexed.length - 1 ? ' latest' : ''}" cx="${x(i)}" cy="${y(d.amount)}" r="${i === indexed.length - 1 ? 5.5 : 2.8}" tabindex="0"><title>${d.year}: ${fmt(d.amount, isTv ? 0 : 2)} kr${isTv ? (d.feeUnit === 'household_year' ? ' per hushåll/år' : ' per person/år, max') : '/l'}</title></circle>`).join('');
    const labels = indexed.map((d, i) => i === 0 || i === indexed.length - 1 || d.year % 5 === 0 ? `<text class="axis-label" x="${x(i)}" y="${h - 8}" text-anchor="middle">${d.year}</text>` : '').join('');
    const desc = isTv ? 'Årsavgift i nivån som gällde den 31 december. Linjebrott markerar övergången till individuell public service-avgift 2019.' : 'Årsmedel för bensinpriset i kronor per liter.';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="price-title price-desc" preserveAspectRatio="none"><title id="price-title">${label} per år</title><desc id="price-desc">${desc}</desc>${grid.join('')}${lines}${marks}${labels}</svg>`;
  }

  function renderCombinedTable(el, rows, fmt) {
    if (!el) return;
    const body = rows.map((d) => {
      const gasShare = valueOrDash(d.gasolineShare, 4) + (d.gasolineShare == null ? '' : ' %');
      const tvShare = valueOrDash(d.tvShare, 4) + (d.tvShare == null ? '' : ' %');
      const gasArrow = arrow(d.gasolineTrend), tvArrow = arrow(d.tvTrend);
      const tvUnit = d.tvUnit === 'household_year' ? 'Hushåll' : d.tvUnit === 'person_year_max' ? (scenarioAdults === 2 ? 'Familj' : 'Person, max') : '—';
      const tvAmount = d.tvAmount == null ? '—' : `${fmt(d.tvAmount, 0)} kr`;
      return `<tr><td>${d.year}</td><td>${d.gasolineAmount == null ? '—' : `${fmt(d.gasolineAmount, 2)} kr/l`}</td><td class="share">${gasShare}</td><td class="${gasArrow === '↑' ? 'trend-up' : gasArrow === '↓' ? 'trend-down' : ''}" aria-label="${trendLabel(d.gasolineTrend)}">${gasArrow}</td><td>${tvAmount}</td><td>${tvUnit}</td><td class="share">${tvShare}</td><td class="${tvArrow === '↑' ? 'trend-up trend-blue' : tvArrow === '↓' ? 'trend-down trend-blue' : ''}" aria-label="${trendLabel(d.tvTrend)}">${tvArrow}</td></tr>`;
    }).join('');
    const note = '<p class="table-note">Röd: bensin, pris för en liter. Blå: TV-avgift. Före 2019 en avgift per hushåll; från 2019 maxavgift per person. Pilen jämför med föregående år och visas inte över systembytet.</p>';
    el.innerHTML = `<table class="comparison-data-table"><thead><tr><th>År</th><th>Bensin</th><th>Bensinens andel</th><th>Trend</th><th>TV-avgift</th><th>Betalare</th><th>TV-avgiftens andel</th><th>Trend</th></tr></thead><tbody>${body}</tbody></table>${note}`;
  }

  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.addEventListener('click', () => setScenario(Number(button.dataset.adults)));
  });
  setScenario(1);
})();
