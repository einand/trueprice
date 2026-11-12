(async function () {
  const root = document.getElementById('chart');
  if (!root) return;

  const page = document.querySelector('.comparison-page');
  const isTvLicense = page?.dataset.comparison === 'tv-license';
  const itemName = page?.dataset.priceLabel || 'Pris';
  const response = await fetch(page?.dataset.seriesUrl || 'data/series.json');
  if (!response.ok) {
    root.innerHTML = '<p class="loading">Årsdiagrammet kunde inte hämtas. Öppna källdatan för att granska serien.</p>';
    return;
  }

  const payload = await response.json();
  const rows = payload.data.map((d) => ({
    year: d.year,
    amount: isTvLicense ? d.tv_license_fee_sek : d.gasoline_price_sek_per_liter,
    share: isTvLicense ? d.tv_license_share_percent : d.share_percent,
    trend: isTvLicense ? d.tv_license_trend : d.trend,
    feeUnit: isTvLicense ? d.tv_license_fee_unit : null,
    regime: isTvLicense ? d.tv_license_regime : null,
    breakBefore: isTvLicense && d.tv_license_break_before === true
  })).filter((d) => d.amount !== null && d.amount !== undefined)
    .sort((a, b) => a.year - b.year);

  const comparable = rows.filter((d) => d.share !== null && d.share !== undefined);
  if (!comparable.length) {
    root.innerHTML = '<p class="loading">Det finns ännu inga år där pris och lön kan jämföras.</p>';
    return;
  }

  const fmt = (value, digits = 2) => Number(value).toLocaleString('sv-SE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const latest = comparable[comparable.length - 1];
  const first = comparable[0];
  document.getElementById('latest-year').textContent = latest.year;
  document.getElementById('latest-share').textContent = fmt(latest.share, 4);
  document.getElementById('latest-price').textContent = `${fmt(latest.amount, isTvLicense ? 0 : 2)} ${isTvLicense ? 'kr/' + (latest.feeUnit === 'household_year' ? 'hushåll/år' : 'person/år, max') : (page.dataset.priceUnit || '')}`;

  const arrow = latest.trend?.startsWith('dyrare') ? '↑' : latest.trend?.startsWith('billigare') ? '↓' : '';
  const trendEl = document.getElementById('latest-trend');
  trendEl.textContent = arrow;
  trendEl.setAttribute('aria-label', arrow
    ? (arrow === '↑' ? 'Dyrare relativt lön än föregående år' : 'Billigare relativt lön än föregående år')
    : 'Ingen trend jämfört med föregående år');

  document.getElementById('chart-period').textContent = `${first.year}–${latest.year}`;
  renderShareChart(root, comparable, fmt, itemName, isTvLicense);
  renderAnnualPriceChart(document.getElementById('price-chart'), rows, fmt, itemName, isTvLicense);
  renderTable(document.getElementById('table'), rows, fmt, itemName, isTvLicense);

  const takeaway = document.getElementById('chart-takeaway');
  if (isTvLicense) {
    takeaway.textContent = 'Avgiftssystemet byttes 2019 från en avgift per hushåll till en individuell, inkomstbaserad maxavgift. Trendpilen jämför bara år inom samma system.';
  } else {
    const change = latest.share < first.share ? 'minskat' : 'ökat';
    takeaway.textContent = `Andelen har ${change} mellan ${first.year} och ${latest.year}. ↑ betyder dyrare relativt lön och ↓ billigare jämfört med föregående år.`;
  }

  function splitAtRegimeBreak(data) {
    const groups = [];
    for (const d of data) {
      if (d.breakBefore || !groups.length) groups.push([]);
      groups[groups.length - 1].push(d);
    }
    return groups;
  }

  function renderShareChart(el, data, fmt, label, isTv) {
    const w = 900, h = 300, m = { top: 18, right: 24, bottom: 34, left: 70 };
    const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
    const max = Math.ceil(Math.max(...data.map((d) => d.share)) * 200) / 200;
    const x = (i) => m.left + (data.length === 1 ? iw / 2 : i * iw / (data.length - 1));
    const y = (v) => m.top + ih - (v / max) * ih;
    const grid = [];
    for (let i = 0; i <= 5; i++) {
      const value = max * i / 5, yy = y(value);
      grid.push(`<line class="grid-line" x1="${m.left}" x2="${w - m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left - 12}" y="${yy + 3}" text-anchor="end">${fmt(value, 3)}%</text>`);
    }
    const indexed = data.map((d, i) => ({ ...d, index: i }));
    const groups = splitAtRegimeBreak(indexed);
    const areas = groups.filter((g) => g.length > 1).map((g) => {
      const pts = g.map((d) => `${x(d.index)},${y(d.share)}`).join(' ');
      return `<polygon class="line-area" points="${x(g[0].index)},${m.top + ih} ${pts} ${x(g[g.length - 1].index)},${m.top + ih}"/>`;
    }).join('');
    const lines = groups.map((g) => `<polyline class="chart-line" points="${g.map((d) => `${x(d.index)},${y(d.share)}`).join(' ')}"/>`).join('');
    const circles = indexed.map((d, i) => `<circle class="chart-point${i === indexed.length - 1 ? ' latest' : ''}" cx="${x(i)}" cy="${y(d.share)}" r="${i === indexed.length - 1 ? 6 : 4.5}" tabindex="0" aria-label="${d.year}: ${fmt(d.share, 4)} procent av årslönen"><title>${d.year}: ${fmt(d.share, 4)} % · ${fmt(d.amount, isTv ? 0 : 2)} kr</title></circle>`).join('');
    const labels = indexed.map((d, i) => i === 0 || i === indexed.length - 1 || d.year % 5 === 0 ? `<text class="axis-label" x="${x(i)}" y="${h - 8}" text-anchor="middle">${d.year}</text>` : '').join('');
    const title = `${label} som andel av genomsnittlig årslön`;
    const desc = isTv ? 'Andel av årslönen. Linjen bryts vid 2019 eftersom avgiften då ändrade betalningsenhet från hushåll till person.' : 'Årsandel beräknad som literpris delat med genomsnittlig årslön.';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="share-title share-desc" preserveAspectRatio="none"><title id="share-title">${title}</title><desc id="share-desc">${desc}</desc><defs><linearGradient id="shareFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#d45e3f" stop-opacity=".17"/><stop offset="100%" stop-color="#d45e3f" stop-opacity="0"/></linearGradient></defs>${grid.join('')}${areas}${lines}${circles}${labels}</svg>`;
  }

  function renderAnnualPriceChart(el, data, fmt, label, isTv) {
    if (!el || !data.length) return;
    const w = 900, h = 260, m = { top: 16, right: 24, bottom: 34, left: 70 };
    const iw = w - m.left - m.right, ih = h - m.top - m.bottom;
    const maxValue = Math.max(...data.map((d) => d.amount));
    const step = isTv ? 500 : 5;
    const max = Math.ceil(maxValue / step) * step;
    const x = (i) => m.left + (data.length === 1 ? iw / 2 : i * iw / (data.length - 1));
    const y = (v) => m.top + ih - (v / max) * ih;
    const grid = [];
    for (let i = 0; i <= 4; i++) {
      const value = max * i / 4, yy = y(value);
      grid.push(`<line class="grid-line" x1="${m.left}" x2="${w - m.right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${m.left - 12}" y="${yy + 3}" text-anchor="end">${fmt(value, 0)} kr</text>`);
    }
    const indexed = data.map((d, i) => ({ ...d, index: i }));
    const groups = splitAtRegimeBreak(indexed);
    const areas = groups.filter((g) => g.length > 1).map((g) => {
      const pts = g.map((d) => `${x(d.index)},${y(d.amount)}`).join(' ');
      return `<polygon class="line-area" style="fill:url(#priceFill)" points="${x(g[0].index)},${m.top + ih} ${pts} ${x(g[g.length - 1].index)},${m.top + ih}"/>`;
    }).join('');
    const lines = groups.map((g) => `<polyline class="chart-line" points="${g.map((d) => `${x(d.index)},${y(d.amount)}`).join(' ')}"/>`).join('');
    const marks = indexed.map((d, i) => {
      const unit = isTv ? (d.feeUnit === 'household_year' ? 'per hushåll och år' : 'per person och år, max') : 'kr/l';
      return `<circle class="chart-point${i === indexed.length - 1 ? ' latest' : ''}" cx="${x(i)}" cy="${y(d.amount)}" r="${i === indexed.length - 1 ? 5.5 : 2.8}" tabindex="0" aria-label="${d.year}: ${fmt(d.amount, 0)} kronor ${unit}"><title>${d.year}: ${fmt(d.amount, isTv ? 0 : 2)} kr · ${unit}</title></circle>`;
    }).join('');
    const labels = indexed.map((d, i) => i === 0 || i === indexed.length - 1 || d.year % 5 === 0 ? `<text class="axis-label" x="${x(i)}" y="${h - 8}" text-anchor="middle">${d.year}</text>` : '').join('');
    const title = `${label} per år`;
    const desc = isTv ? 'Årlig avgift i den nivå som gällde den 31 december. Ett linjebrott markerar övergången från hushållsavgift till individuell avgift 2019.' : 'Årsmedel för bensinpriset i kronor per liter.';
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="price-title price-desc" preserveAspectRatio="none"><title id="price-title">${title}</title><desc id="price-desc">${desc}</desc><defs><linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#d45e3f" stop-opacity=".15"/><stop offset="100%" stop-color="#d45e3f" stop-opacity="0"/></linearGradient></defs>${grid.join('')}${areas}${lines}${marks}${labels}</svg>`;
  }

  function renderTable(el, data, fmt, label, isTv) {
    const body = data.map((d) => {
      const arrow = d.trend?.startsWith('dyrare') ? '↑' : d.trend?.startsWith('billigare') ? '↓' : '';
      const trendLabel = arrow ? (arrow === '↑' ? 'Dyrare relativt lön än föregående år' : 'Billigare relativt lön än föregående år') : 'Ingen jämförbar trend';
      const unit = isTv ? (d.feeUnit === 'household_year' ? 'Per hushåll/år' : 'Per person/år · max') : '';
      const amount = fmt(d.amount, isTv ? 0 : 2);
      const share = d.share == null ? '—' : `${fmt(d.share, 4)} %`;
      return `<tr><td>${d.year}</td><td>${amount} kr${isTv ? '' : ' / liter'}</td>${isTv ? `<td>${unit}</td>` : ''}<td class="share">${share}</td><td class="${arrow === '↑' ? 'trend-up' : arrow === '↓' ? 'trend-down' : ''}" aria-label="${trendLabel}" title="${trendLabel}">${arrow}</td></tr>`;
    }).join('');
    const headers = isTv ? '<th>År</th><th>Avgift</th><th>Betalningsenhet</th><th>Andel av årslön</th><th>Trend</th>' : '<th>År</th><th>Bensin per liter</th><th>Andel av årslön</th><th>Trend</th>';
    const note = isTv
      ? '<p class="table-note">Före 2019: avgift per hushåll med TV-mottagare. Från 2019: individuell maxavgift. ↑/↓ visas inte över systembytet.</p>'
      : '<p class="table-note">↑ dyrare relativt lön · ↓ billigare relativt lön. Andel och trend visas endast när jämförbar lönedata finns.</p>';
    el.innerHTML = `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>${note}`;
  }
})();
