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
      gasolineAmount: isTvPage ? null : d.price_sek_per_liter,
      gasolineShare: isTvPage ? null : adults === 2 ? d.share_percent_two_adults : d.share_percent,
      gasolineTrend: isTvPage ? null : adults === 2 ? d.trend_two_adults : d.trend,
      tvAmount: isTvPage
        ? d.fee_sek * (adults === 2 && d.fee_unit === 'person_year_max' ? 2 : 1)
        : null,
      tvUnit: isTvPage ? d.fee_unit : null,
      tvShare: isTvPage ? adults === 2 ? d.share_percent_two_adults : d.share_percent : null,
      tvTrend: isTvPage ? adults === 2 ? d.trend_two_adults : d.trend : null,
      tvBreak: isTvPage && d.break_before === true
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

    const shareKey = isTvPage ? 'tvShare' : 'gasolineShare';
    const shareRows = rows.filter((d) => d[shareKey] !== null && d[shareKey] !== undefined);
    const firstYear = shareRows[0]?.year;
    const lastYear = shareRows.at(-1)?.year;
    document.getElementById('chart-period').textContent = firstYear ? `${firstYear}–${lastYear}` : '—';
    renderRelativeShareChart(root, shareRows, fmt, isTvPage);
    renderAnnualPriceChart(document.getElementById('price-chart'), rows, fmt, itemName, isTvPage);
    renderItemTable(document.getElementById('table'), rows, fmt, isTvPage);
    const takeaway = document.getElementById('chart-takeaway');
    takeaway.textContent = isTvPage
      ? 'Diagrammet visar TV-avgiften som andel av vald årslön. Linjebrottet markerar bytet från hushållsavgift till individuell public service-avgift 2019.'
      : 'Diagrammet visar priset för en liter bensin som andel av vald årslön.';
  }

  function groupAtBreak(series) {
    const groups = [];
    for (const point of series) {
      if (point.breakBefore || !groups.length) groups.push([]);
      groups[groups.length - 1].push(point);
    }
    return groups;
  }

  function renderRelativeShareChart(el, rows, fmt, isTv) {
    const w = 900, h = 300, m = { top: 18, right: 24, bottom: 34, left: 70 };
    const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
    const shareKey = isTv ? 'tvShare' : 'gasolineShare';
    const values = rows.map((d) => d[shareKey]).filter((v) => v !== null && v !== undefined);
    const max = Math.ceil(Math.max(...values) * 200) / 200;
    const x = (i) => m.left + (rows.length === 1 ? iw / 2 : i * iw / (rows.length - 1));
    const y = (v) => m.top + ih - (v / max) * ih;
    const grid = [];
    for (let i = 0; i <= 5; i++) {
      const value = max * i / 5, yy = y(value);
      grid.push(`<line class="grid-line" x1="${m.left}" x2="${w - m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left - 12}" y="${yy + 3}" text-anchor="end">${fmt(value, 3)}%</text>`);
    }

    const points = rows.map((d, i) => ({ index: i, year: d.year, value: d[shareKey], amount: isTv ? d.tvAmount : d.gasolineAmount, breakBefore: isTv && d.tvBreak }));
    const groups = [];
    for (const point of points) {
      const previous = groups.at(-1)?.at(-1);
      if (!previous || point.breakBefore || point.year !== previous.year + 1) groups.push([]);
      groups.at(-1).push(point);
    }
    const lineClass = `chart-line${isTv ? ' chart-line-blue' : ''}`;
    const pointClass = `chart-point${isTv ? ' chart-point-blue' : ''}`;
    const lines = groups.map((g) => `<polyline class="${lineClass}" points="${g.map((d) => `${x(d.index)},${y(d.value)}`).join(' ')}"/>`).join('');
    const marks = points.map((d, i) => `<circle class="${pointClass}${i === points.length - 1 ? ' latest' : ''}" cx="${x(d.index)}" cy="${y(d.value)}" r="${i === points.length - 1 ? 5.5 : 3.5}" tabindex="0" aria-label="${isTv ? 'TV-avgift' : 'Bensin'} ${d.year}: ${fmt(d.value, 4)} procent av årslönen"><title>${isTv ? 'TV-avgift' : 'Bensin'} ${d.year}: ${fmt(d.value, 4)} % · ${fmt(d.amount, isTv ? 0 : 2)} kr${isTv ? '/år' : '/l'}</title></circle>`).join('');
    const labels = rows.map((d, i) => i === 0 || i === rows.length - 1 || d.year % 5 === 0 ? `<text class="axis-label" x="${x(i)}" y="${h - 8}" text-anchor="middle">${d.year}</text>` : '').join('');
    const title = isTv ? 'TV-avgift' : 'Bensin';
    const desc = isTv
      ? 'TV-avgiftens andel av den valda årslönen. Linjen bryts vid systembytet 2019.'
      : 'Priset på en liter bensin som andel av den valda årslönen.';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="share-title share-desc" preserveAspectRatio="none"><title id="share-title">${title} som andel av årslön</title><desc id="share-desc">${desc}</desc>${grid.join('')}${lines}${marks}${labels}</svg>`;
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

  function renderItemTable(el, rows, fmt, isTv) {
    if (!el) return;
    const body = rows.map((d) => {
      if (!isTv) {
        const share = valueOrDash(d.gasolineShare, 4) + (d.gasolineShare == null ? '' : ' %');
        const mark = arrow(d.gasolineTrend);
        return `<tr><td>${d.year}</td><td>${d.gasolineAmount == null ? '—' : `${fmt(d.gasolineAmount, 2)} kr/l`}</td><td class="share">${share}</td><td class="${mark === '↑' ? 'trend-up' : mark === '↓' ? 'trend-down' : ''}" aria-label="${trendLabel(d.gasolineTrend)}">${mark}</td></tr>`;
      }
      const share = valueOrDash(d.tvShare, 4) + (d.tvShare == null ? '' : ' %');
      const mark = arrow(d.tvTrend);
      const unit = d.tvUnit === 'household_year' ? 'Hushåll' : scenarioAdults === 2 ? 'Familj, 2 personer' : 'Person, max';
      const fee = d.tvAmount == null ? '—' : `${fmt(d.tvAmount, 0)} kr`;
      return `<tr><td>${d.year}</td><td>${fee}</td><td>${unit}</td><td class="share">${share}</td><td class="${mark === '↑' ? 'trend-up trend-blue' : mark === '↓' ? 'trend-down trend-blue' : ''}" aria-label="${trendLabel(d.tvTrend)}">${mark}</td></tr>`;
    }).join('');
    const note = isTv
      ? '<p class="table-note">Före 2019 visas en avgift per hushåll. Från 2019 visas maxavgift per person; i Familj-scenariot räknas två avgifter mot två löner. Trendpilen jämför inte över systembytet.</p>'
      : '<p class="table-note">Priset gäller en liter bensin. Andelen beräknas mot vald årslön.</p>';
    const headers = isTv
      ? '<tr><th>År</th><th>TV-avgift</th><th>Betalningsenhet</th><th>Andel av årslön</th><th>Trend</th></tr>'
      : '<tr><th>År</th><th>Bensinpris</th><th>Andel av årslön</th><th>Trend</th></tr>';
    el.innerHTML = `<table class="comparison-data-table${isTv ? ' comparison-data-table-blue' : ''}"><thead>${headers}</thead><tbody>${body}</tbody></table>${note}`;
  }

  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.addEventListener('click', () => setScenario(Number(button.dataset.adults)));
  });
  setScenario(1);
})();
