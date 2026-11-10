// Presentation-only summaries of the orders already loaded by the account page.
export function orderChartData(orders, months = 6, now = new Date()) {
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1);
    return { year: date.getFullYear(), month: date.getMonth(), label: date.toLocaleDateString('en-US', { month: 'short' }), count: 0 };
  });
  const statuses = { posted: 0, active: 0, other: 0 };
  for (const order of orders) {
    const date = new Date(order.created_at);
    const bucket = buckets.find(item => item.year === date.getFullYear() && item.month === date.getMonth());
    if (bucket) bucket.count += 1;
    const status = String(order.status || '').toLowerCase();
    if (status === 'posted') statuses.posted += 1;
    else if (['pending', 'paid', 'verified'].includes(status)) statuses.active += 1;
    else statuses.other += 1;
  }
  return { buckets, statuses };
}

export function renderDashboardCharts(orders, months = 6) {
  const activity = document.getElementById('orderActivityChart');
  const breakdown = document.getElementById('orderStatusChart');
  if (!activity || !breakdown) return;
  const { buckets, statuses } = orderChartData(orders, months);
  const max = Math.max(2, ...buckets.map(item => item.count));
  const points = buckets.map((item, i) => [42 + i * (476 / (months - 1)), 170 - item.count / max * 140]);
  let path = `M ${points[0].join(' ')}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i];
    const [px, py] = points[i - 1];
    const mid = (px + x) / 2;
    path += ` C ${mid} ${py} ${mid} ${y} ${x} ${y}`;
  }
  activity.innerHTML = `<svg viewBox="0 0 550 214" role="img" aria-label="Monthly orders: ${buckets.map(item => `${item.label} ${item.count}`).join(', ')}">
    ${[0, 1, 2].map(i => `<line class="chart-grid" x1="42" x2="518" y1="${30 + i * 70}" y2="${30 + i * 70}"/><text class="chart-axis" x="18" y="${34 + i * 70}">${Math.round(max * (1 - i / 2))}</text>`).join('')}
    <path class="chart-area" d="${path} L 518 170 L 42 170 Z"/>
    <path class="chart-line" d="${path}"/>
    ${points.map(([x,y], i) => `<circle class="chart-point" cx="${x}" cy="${y}" r="4"><title>${buckets[i].label}: ${buckets[i].count} orders</title></circle><text class="chart-axis" text-anchor="middle" x="${x}" y="204">${buckets[i].label}</text>`).join('')}
  </svg>`;
  const total = orders.length;
  let offset = 0;
  const arcs = Object.entries(statuses).map(([key, count]) => {
    const length = total ? count / total * 100 : 0;
    const arc = `<circle class="chart-ring chart-${key}" cx="80" cy="80" r="62" pathLength="100" stroke-dasharray="${length} ${100 - length}" stroke-dashoffset="${-offset}"/>`;
    offset += length;
    return arc;
  }).join('');
  breakdown.innerHTML = `<div class="status-donut"><svg viewBox="0 0 160 160" role="img" aria-label="${total} orders: ${statuses.posted} posted, ${statuses.active} in progress, ${statuses.other} other"><circle class="chart-ring chart-track" cx="80" cy="80" r="62"/>${arcs}</svg><div class="donut-total"><strong>${total}</strong><span>orders</span></div></div><dl class="chart-legend">${[['posted','Posted'],['active','In progress'],['other','Other']].map(([key,label]) => `<div><dt><i class="legend-dot chart-${key}"></i>${label}</dt><dd>${statuses[key]}</dd></div>`).join('')}</dl>`;
  document.getElementById('chartPeriodLabel').textContent = `Last ${months} months`;
}