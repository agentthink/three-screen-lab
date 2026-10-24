const F = (s) => document.querySelector(s);
const FA = (s) => [...document.querySelectorAll(s)];
const fIcon = (n) => `<svg class="icon" aria-hidden="true"><use href="#f-${n}"/></svg>`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const factoryScreen = F('#factory-screen');
let factoryScale = 1,
  materialMode = 'purchase',
  chosenShift = -1,
  toastTimeout;
let lastFactoryFocus = null,
  dialogCleanup = null,
  sceneZoom = 1;
const visibleSeries = { 'shift-a': true, 'shift-b': true, domestic: true, export: true };
const materials = [
  {
    name: '石灰石',
    purchase: 156.5,
    consume: 75.3,
    icon: 'stone',
    color: '#51baed',
    share: 39.56,
    stock: 186.3,
  },
  {
    name: '砂岩',
    purchase: 234.7,
    consume: 161.4,
    icon: 'sand',
    color: '#bed9ed',
    share: 30.08,
    stock: 248.9,
  },
  {
    name: '铝矾土',
    purchase: 89.8,
    consume: 76.2,
    icon: 'ore',
    color: '#ffcf8a',
    share: 15.87,
    stock: 126.5,
  },
  {
    name: '钢粉',
    purchase: 228.7,
    consume: 169.4,
    icon: 'steel',
    color: '#ff8c45',
    share: 14.48,
    stock: 93.4,
  },
];
const shifts = [
  { name: '甲班一线', value: 1659 },
  { name: '甲班二线', value: 1168 },
  { name: '乙班一线', value: 364 },
  { name: '乙班二线', value: 2830 },
];
const transports = [
  { name: '管道', value: 4.25, icon: 'pipe', routes: 8, load: 92.6 },
  { name: '铁路', value: 22.8, icon: 'train', routes: 12, load: 86.4 },
  { name: '公路', value: 38.5, icon: 'road', routes: 36, load: 94.1 },
  { name: '水路', value: 120.7, icon: 'ship', routes: 6, load: 89.7 },
];
const warehouses = [40, 150, 90, 70, 110, 60, 70].map((v, i) => ({
  name: `${'ABCDEFG'[i]}区`,
  value: v,
  capacity: 180,
  material: materials[i % 4].name,
}));
const sales = { domestic: [180, 150, 150, 200, 220, 180], export: [300, 150, 170, 200, 300, 200] };
const orders = [
  {
    id: 'SO-20261019-001',
    region: '四川省',
    customer: '焕彩涂装工业',
    amount: 300,
    status: '已发货',
    transport: '公路',
    material: '石灰石',
    time: '09:32',
    quantity: 1680,
  },
  {
    id: 'SO-20261019-002',
    region: '安徽省',
    customer: '宏力化工有限公司',
    amount: 6.9,
    status: '已发货',
    transport: '铁路',
    material: '砂岩',
    time: '10:18',
    quantity: 425,
  },
  {
    id: 'SO-20261019-003',
    region: '山东省',
    customer: '锐新智造科技',
    amount: 200,
    status: '已确认',
    transport: '水路',
    material: '钢粉',
    time: '11:06',
    quantity: 1250,
  },
  {
    id: 'SO-20261019-004',
    region: '广东省',
    customer: '精铸领航工业集团',
    amount: 100,
    status: '已发货',
    transport: '管道',
    material: '铝矾土',
    time: '11:42',
    quantity: 860,
  },
  {
    id: 'SO-20261019-005',
    region: '浙江省',
    customer: '华东新材料有限公司',
    amount: 86.5,
    status: '生产中',
    transport: '公路',
    material: '砂岩',
    time: '13:15',
    quantity: 640,
  },
  {
    id: 'SO-20261019-006',
    region: '江苏省',
    customer: '远航精密制造集团',
    amount: 158.2,
    status: '已确认',
    transport: '铁路',
    material: '石灰石',
    time: '14:28',
    quantity: 980,
  },
];
const equipmentTypes = [
  { name: '设备类型一', on: 156, off: 89, fault: 16 },
  { name: '设备类型二', on: 156, off: 72, fault: 17 },
  { name: '设备类型三', on: 345, off: 128, fault: 52 },
];
const zones = {
  cooling: {
    name: '一号冷却塔',
    code: 'CT-01',
    category: '循环冷却系统',
    temperature: 32.6,
    power: 186,
    efficiency: 96.8,
    running: true,
    position: '西侧冷却岛',
    lastService: '2026-10-12',
  },
  production: {
    name: '主生产车间',
    code: 'PL-02',
    category: '主工艺生产系统',
    temperature: 48.2,
    power: 426,
    efficiency: 92.5,
    running: true,
    position: '东侧生产区',
    lastService: '2026-10-15',
  },
  storage: {
    name: '储运中心',
    code: 'WH-03',
    category: '仓储与自动输送系统',
    temperature: 24.8,
    power: 92,
    efficiency: 98.1,
    running: true,
    position: '南侧储运区',
    lastService: '2026-10-09',
  },
};
function fitFactory() {
  factoryScale = Math.min(innerWidth / 2048, innerHeight / 1020);
  factoryScreen.style.transform = `scale(${factoryScale})`;
}
addEventListener('resize', fitFactory);
fitFactory();
function fTip(event, html) {
  const tip = F('#factory-tooltip');
  tip.innerHTML = html;
  tip.style.display = 'block';
  const b = factoryScreen.getBoundingClientRect();
  let x = (event.clientX - b.left) / factoryScale + 17,
    y = (event.clientY - b.top) / factoryScale + 13;
  tip.style.left = Math.min(Math.max(12, x), 2048 - tip.offsetWidth - 16) + 'px';
  tip.style.top = Math.min(Math.max(12, y), 1020 - tip.offsetHeight - 15) + 'px';
}
function hideFTip() {
  F('#factory-tooltip').style.display = 'none';
}
function fToast(message) {
  F('#factory-toast').textContent = message;
  F('#factory-toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => F('#factory-toast').classList.remove('visible'), 3200);
}
function renderMaterials() {
  F('#materials-grid').innerHTML = materials
    .map(
      (m, i) =>
        `<button class="material-card" data-material="${i}" aria-label="查看${m.name}采购和消耗"><span class="material-name">${m.name}</span><span class="material-values"><span class="material-icon">${fIcon(m.icon)}</span><span class="material-data"><label>日购</label><strong>${m.purchase.toFixed(1)}<small>t</small></strong></span><span class="material-data"><label>日消耗</label><strong>${m.consume.toFixed(1)}<small>t</small></strong></span></span></button>`,
    )
    .join('');
}
renderMaterials();
F('#shift-totals').innerHTML = shifts
  .map(
    (s, i) =>
      `<button class="shift-total" data-shift="${i}" aria-pressed="false"><label>${s.name}</label><strong>${s.value}</strong></button>`,
  )
  .join('');
F('#transport-grid').innerHTML = transports
  .map(
    (t, i) =>
      `<button class="transport-card" data-transport="${i}"><span class="transport-orb">${fIcon(t.icon)}</span><span class="transport-copy"><label>${t.name}</label><strong>${t.value}<small>万吨</small></strong></span></button>`,
  )
  .join('');
function renderOrders() {
  F('#order-rows').innerHTML = orders
    .slice(0, 4)
    .map(
      (o, i) =>
        `<tr data-order="${i}" tabindex="0" aria-label="查看${o.customer}订单"><td>${o.region}</td><td>${o.customer}</td><td>${o.amount}</td><td class="${o.status === '已发货' ? 'shipped' : 'confirmed'}">${o.status}</td></tr>`,
    )
    .join('');
}
renderOrders();
F('#equipment-rows').innerHTML = equipmentTypes
  .map(
    (e, i) =>
      `<tr data-equipment-type="${i}" tabindex="0" aria-label="查看${e.name}"><td>${e.name}</td><td>${e.on}</td><td>${e.off}</td><td>${e.fault}</td></tr>`,
  )
  .join('');
function chartBase(id) {
  const svg = d3.select(id);
  svg.selectAll('*').remove();
  return svg;
}
function chartGradient(svg, id, top, bottom, opacity = 1) {
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
  const g = defs
    .append('linearGradient')
    .attr('id', id)
    .attr('x1', '0')
    .attr('y1', '0')
    .attr('x2', '0')
    .attr('y2', '1');
  g.append('stop').attr('stop-color', top).attr('stop-opacity', opacity);
  g.append('stop').attr('offset', '1').attr('stop-color', bottom).attr('stop-opacity', 0.15);
  return `url(#${id})`;
}
function drawMaterialChart() {
  const svg = chartBase('#material-chart'),
    cx = 175,
    cy = 94,
    r = 61;
  const data = materials.map((m) => ({
    ...m,
    part:
      materialMode === 'purchase'
        ? m.share
        : (m.consume / d3.sum(materials, (m) => m.consume)) * 100,
  }));
  const pie = d3
      .pie()
      .sort(null)
      .value((d) => d.part)
      .startAngle(0)
      .endAngle(Math.PI * 2),
    arc = d3.arc().innerRadius(46).outerRadius(r);
  const g = svg.append('g').attr('transform', `translate(${cx} ${cy})`);
  const segments = g
    .selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc)
    .attr('fill', (d) => d.data.color)
    .style('cursor', 'pointer')
    .on('pointermove', (e, d) =>
      fTip(
        e,
        `<strong>${d.data.name}</strong><div class="tip-row"><span>${materialMode === 'purchase' ? '日购进' : '日消耗'}</span><b>${d.data[materialMode].toFixed(1)} t</b></div><div class="tip-row"><span>统计占比</span><b>${d.data.part.toFixed(2)}%</b></div>`,
      ),
    )
    .on('pointerleave', hideFTip)
    .on('click', (e, d) => showMaterial(materials.findIndex((m) => m.name === d.data.name)));
  segments.append('title').text((d) => `${d.data.name} ${d.data.part.toFixed(2)}%`);
  pie(data).forEach((d) => {
    const mid = (d.startAngle + d.endAngle) / 2,
      right = Math.sin(mid) >= 0;
    const start = [Math.sin(mid) * r, -Math.cos(mid) * r],
      elbow = [Math.sin(mid) * (r + 8), -Math.cos(mid) * (r + 8)],
      end = [right ? 66 : -66, elbow[1]];
    g.append('path')
      .attr('d', d3.line()([start, elbow, end]))
      .attr('fill', 'none')
      .attr('stroke', d.data.color)
      .attr('stroke-width', 1);
    g.append('text')
      .attr('x', end[0] + (right ? 5 : -5))
      .attr('y', end[1] + 4)
      .attr('text-anchor', right ? 'start' : 'end')
      .attr('font-size', 13)
      .text(`${d.data.part.toFixed(2)}%`);
  });
  data.forEach((d, i) => {
    const row = svg
      .append('g')
      .attr('transform', `translate(330 ${52 + i * 33})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .style('cursor', 'pointer')
      .attr('aria-label', `查看${d.name}`);
    row.append('circle').attr('r', 4.6).attr('fill', d.color);
    row.append('text').attr('x', 14).attr('y', 4).attr('font-size', 13).text(d.name);
    row
      .on('click', () => showMaterial(i))
      .on('keydown', (e) => {
        if (e.key === 'Enter') showMaterial(i);
      });
  });
  F('#material-chart').setAttribute(
    'aria-label',
    `原材料${materialMode === 'purchase' ? '日购进' : '日消耗'}占比`,
  );
}
drawMaterialChart();
const productionBase = {
  a: [18, 25, 16, 16, 22, 15, 19, 20, 14, 24, 20, 12, 16, 22, 16],
  b: [9, 12, 8, 7, 10, 7, 12, 10, 7, 12, 10, 6, 8, 11, 10],
};
function drawProduction() {
  const svg = chartBase('#production-chart'),
    x = d3.scaleLinear().domain([0, 14]).range([55, 420]),
    y = d3.scaleLinear().domain([0, 30]).range([166, 12]);
  const factor = chosenShift < 0 ? 1 : [1, 0.83, 0.65, 1.12][chosenShift];
  const a = productionBase.a.map((v) => +(v * factor).toFixed(1)),
    b = productionBase.b.map((v) => +(v * factor).toFixed(1));
  [0, 15, 30].forEach((v) => {
    svg
      .append('line')
      .attr('class', 'chart-grid')
      .attr('x1', 42)
      .attr('x2', 420)
      .attr('y1', y(v))
      .attr('y2', y(v));
    svg
      .append('text')
      .attr('x', 34)
      .attr('y', y(v) + 4)
      .attr('text-anchor', 'end')
      .text(v);
  });
  svg.append('path').attr('d', 'M43 166H420').attr('class', 'axis-line');
  [
    [0, '2015−04−01'],
    [4, '2015−04−05'],
    [8, '2015−04−09'],
    [12, '2015−04−13'],
  ].forEach(([i, label]) => {
    svg
      .append('line')
      .attr('x1', x(i))
      .attr('x2', x(i))
      .attr('y1', 166)
      .attr('y2', 171)
      .attr('class', 'axis-line');
    svg
      .append('text')
      .attr('x', x(i))
      .attr('y', 186)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .text(label);
  });
  const line = d3
      .line()
      .x((v, i) => x(i))
      .y(y)
      .curve(d3.curveMonotoneX),
    area = d3
      .area()
      .x((v, i) => x(i))
      .y0(166)
      .y1(y)
      .curve(d3.curveMonotoneX);
  [
    [a, 'shift-a', '#51baf0', 'prod-blue'],
    [b, 'shift-b', '#c7dfef', 'prod-pale'],
  ].forEach(([data, key, color, grad]) => {
    if (!visibleSeries[key]) return;
    svg
      .append('path')
      .attr('d', area(data))
      .attr('fill', chartGradient(svg, grad, color, color, 0.32));
    svg
      .append('path')
      .attr('d', line(data))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.15);
    svg
      .append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (v, i) => x(i))
      .attr('cy', y)
      .attr('r', 2.3)
      .attr('fill', color)
      .attr('stroke', '#e5f2fa')
      .attr('stroke-width', 0.7);
  });
  const guide = svg
    .append('line')
    .attr('y1', 6)
    .attr('y2', 167)
    .attr('stroke', '#b2dded')
    .attr('stroke-width', 0.8)
    .attr('stroke-dasharray', '3 4')
    .attr('opacity', 0);
  svg
    .append('rect')
    .attr('class', 'chart-hit')
    .attr('x', 43)
    .attr('y', 3)
    .attr('width', 382)
    .attr('height', 165)
    .on('pointermove', (event) => {
      const [mx] = d3.pointer(event),
        i = Math.max(0, Math.min(14, Math.round(x.invert(mx))));
      guide.attr('x1', x(i)).attr('x2', x(i)).attr('opacity', 0.75);
      fTip(
        event,
        `<strong>2015-04-${String(i + 1).padStart(2, '0')} ${chosenShift < 0 ? '产量统计' : shifts[chosenShift].name}</strong>${visibleSeries['shift-a'] ? `<div class="tip-row"><span>甲班产量</span><b>${a[i]} 吨</b></div>` : ''}${visibleSeries['shift-b'] ? `<div class="tip-row"><span>乙班产量</span><b>${b[i]} 吨</b></div>` : ''}`,
      );
    })
    .on('pointerleave', () => {
      guide.attr('opacity', 0);
      hideFTip();
    });
}
drawProduction();
function drawStorage() {
  const svg = chartBase('#storage-chart'),
    x = d3
      .scaleBand()
      .domain(warehouses.map((w) => w.name))
      .range([35, 279])
      .padding(0.6),
    y = d3.scaleLinear().domain([0, 160]).range([178, 9]);
  const gradient = chartGradient(svg, 'warehouse-bars', '#55baf0', '#3d91b0', 1);
  [0, 50, 100, 150].forEach((v) => {
    svg
      .append('line')
      .attr('class', 'chart-grid')
      .attr('x1', 32)
      .attr('x2', 280)
      .attr('y1', y(v))
      .attr('y2', y(v));
    svg
      .append('text')
      .attr('x', 23)
      .attr('y', y(v) + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .text(v);
  });
  svg
    .append('line')
    .attr('class', 'axis-line')
    .attr('x1', 32)
    .attr('x2', 280)
    .attr('y1', 178)
    .attr('y2', 178);
  svg
    .selectAll('.storage-bar')
    .data(warehouses)
    .join('rect')
    .attr('class', 'storage-bar')
    .attr('x', (d) => x(d.name))
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => 178 - y(d.value))
    .attr('fill', gradient);
  warehouses.forEach((d, i) => {
    svg
      .append('text')
      .attr('x', x(d.name) + x.bandwidth() / 2)
      .attr('y', 197)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .text(d.name);
    svg
      .append('rect')
      .attr('class', 'chart-hit')
      .attr('x', x(d.name) - 8)
      .attr('y', 8)
      .attr('width', x.bandwidth() + 16)
      .attr('height', 171)
      .on('pointermove', (e) =>
        fTip(
          e,
          `<strong>${d.name} · ${d.material}仓</strong><div class="tip-row"><span>当前库存</span><b>${d.value} 千吨</b></div><div class="tip-row"><span>空间利用率</span><b>${((d.value / d.capacity) * 100).toFixed(1)}%</b></div><div class="tip-muted">点击查看库区详情</div>`,
        ),
      )
      .on('pointerleave', hideFTip)
      .on('click', () => showStorage(i));
  });
}
drawStorage();
function drawSales() {
  const svg = chartBase('#sales-chart'),
    x = d3.scaleBand().domain([0, 1, 2, 3, 4, 5]).range([45, 422]).padding(0.48),
    y = d3.scaleLinear().domain([0, 330]).range([180, 8]);
  const blue = chartGradient(svg, 'sales-blue', '#55bdf0', '#67b5d7', 1),
    orange = chartGradient(svg, 'sales-orange', '#ffa553', '#d99552', 1);
  [0, 100, 200, 300].forEach((v) => {
    svg
      .append('line')
      .attr('class', 'chart-grid')
      .attr('x1', 43)
      .attr('x2', 423)
      .attr('y1', y(v))
      .attr('y2', y(v));
    svg
      .append('text')
      .attr('x', 34)
      .attr('y', y(v) + 4)
      .attr('text-anchor', 'end')
      .text(v);
  });
  svg
    .append('line')
    .attr('class', 'axis-line')
    .attr('x1', 43)
    .attr('x2', 423)
    .attr('y1', 180)
    .attr('y2', 180);
  for (let i = 0; i < 6; i++) {
    const mid = x(i) + x.bandwidth() / 2;
    for (const [key, gradient, offset] of [
      ['domestic', blue, -11],
      ['export', orange, 0],
    ]) {
      if (!visibleSeries[key]) continue;
      svg
        .append('rect')
        .attr('x', mid + offset)
        .attr('y', y(sales[key][i]))
        .attr('width', 11)
        .attr('height', 180 - y(sales[key][i]))
        .attr('fill', gradient);
    }
    svg
      .append('text')
      .attr('x', mid)
      .attr('y', 201)
      .attr('text-anchor', 'middle')
      .text(`${String(i + 1).padStart(2, '0')}月`);
    svg
      .append('rect')
      .attr('class', 'chart-hit')
      .attr('x', mid - 22)
      .attr('y', 5)
      .attr('width', 44)
      .attr('height', 177)
      .on('pointermove', (e) =>
        fTip(
          e,
          `<strong>${String(i + 1).padStart(2, '0')}月销售额</strong>${visibleSeries.domestic ? `<div class="tip-row"><span>国内份额</span><b>${sales.domestic[i]} 万元</b></div>` : ''}${visibleSeries.export ? `<div class="tip-row"><span>出口份额</span><b>${sales.export[i]} 万元</b></div>` : ''}<div class="tip-muted">点击查看月度明细</div>`,
        ),
      )
      .on('pointerleave', hideFTip)
      .on('click', () => showSales(i));
  }
}
drawSales();
function drawGauge() {
  const svg = d3.select('#gauge-chart');
  const defs = svg.append('defs');
  const gradient = defs
    .append('linearGradient')
    .attr('id', 'gauge-running')
    .attr('x2', '1')
    .attr('y2', '.6');
  [
    ['0', '#f6a955'],
    ['.19', '#78cae8'],
    ['1', '#3fb5e9'],
  ].forEach(([o, c]) => gradient.append('stop').attr('offset', o).attr('stop-color', c));
  const rg = defs.append('radialGradient').attr('id', 'gauge-depth');
  [
    ['0', '#0a202f'],
    ['.67', '#1b3949'],
    ['.8', '#3f7189'],
    ['.9', '#5d9bb4'],
    ['1', '#193c53'],
  ].forEach(([o, c]) => rg.append('stop').attr('offset', o).attr('stop-color', c));
  defs.append('filter').attr('id', 'gauge-glow').append('feGaussianBlur').attr('stdDeviation', 3);
  const g = svg.append('g').attr('transform', 'translate(120 120)');
  g.append('circle')
    .attr('r', 104)
    .attr('fill', '#11283655')
    .attr('stroke', '#8ac7e1')
    .attr('stroke-opacity', 0.4);
  g.append('circle')
    .attr('r', 98)
    .attr('fill', 'none')
    .attr('stroke', '#7dafc9')
    .attr('stroke-width', 6)
    .attr('stroke-opacity', 0.12);
  g.append('circle')
    .attr('r', 84)
    .attr('fill', 'url(#gauge-depth)')
    .attr('stroke', '#5da6c1')
    .attr('stroke-width', 0.6);
  g.append('circle')
    .attr('r', 66)
    .attr('fill', '#162d3b')
    .attr('stroke', '#0e2432')
    .attr('stroke-width', 3);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2,
      l = i % 6 === 0 ? 8 : 4,
      r = i % 6 === 0 ? 107 : 104;
    g.append('line')
      .attr('x1', Math.cos(a) * (r - l))
      .attr('y1', Math.sin(a) * (r - l))
      .attr('x2', Math.cos(a) * r)
      .attr('y2', Math.sin(a) * r)
      .attr('stroke', '#b8daec')
      .attr('stroke-width', i % 6 === 0 ? 1.3 : 0.8)
      .attr('opacity', i % 6 === 0 ? 0.68 : 0.48);
  }
  g.append('path')
    .attr('d', d3.arc().innerRadius(112).outerRadius(114).startAngle(-0.55).endAngle(2.92))
    .attr('fill', '#9ddbf6')
    .attr('opacity', 0.55);
  g.append('path')
    .attr('d', d3.arc().innerRadius(112).outerRadius(114).startAngle(3.2).endAngle(5.5))
    .attr('fill', '#4ba7c9')
    .attr('opacity', 0.4);
  g.append('path')
    .attr('d', d3.arc().innerRadius(67).outerRadius(76).startAngle(-2.35).endAngle(2.35))
    .attr('fill', '#254b61');
  g.append('path')
    .attr('d', d3.arc().innerRadius(67).outerRadius(76).startAngle(-2.35).endAngle(2.35))
    .attr('fill', 'url(#gauge-running)');
  g.append('path')
    .attr('d', d3.arc().innerRadius(67).outerRadius(76).startAngle(-2.2).endAngle(-1.64))
    .attr('fill', '#f6b264')
    .attr('opacity', 0.9);
  const orbit = svg.append('g').attr('class', 'gauge-orbit');
  orbit
    .append('circle')
    .attr('cx', 120)
    .attr('cy', 120)
    .attr('r', 92)
    .attr('fill', 'none')
    .attr('stroke', '#8dc4e5')
    .attr('stroke-width', 0.8)
    .attr('stroke-dasharray', '26 8 1 8 1 35')
    .attr('opacity', 0.4);
}
drawGauge();
function startAtmosphere() {
  if (reducedMotion) return;
  const c = F('#ambient-particles'),
    ctx = c.getContext('2d');
  c.width = 2048;
  c.height = 1020;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: 510 + ((i * 61) % 1030),
    y: 240 + ((i * 43) % 650),
    r: i % 3 === 0 ? 1.3 : 0.6,
    v: 0.08 + (i % 5) * 0.025,
  }));
  let last = 0;
  function frame(t) {
    if (t - last > 48) {
      ctx.clearRect(0, 0, 2048, 1020);
      particles.forEach((p) => {
        p.y -= p.v * 3;
        if (p.y < 220) p.y = 900;
        ctx.fillStyle = `rgba(127,201,233,${p.r > 1 ? 0.12 : 0.06})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      last = t;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
startAtmosphere();
let factoryTwin = null;
try {
  factoryTwin = FactoryDigitalTwin.create(F('#factory-model-host'), {
    onSelect: (key) => showZone(key),
    onHover: (key, event) => {
      const z = zones[key];
      fTip(
        event,
        `<strong>${z.name} · ${z.code}</strong><div class="tip-row"><span>运行状态</span><b>${z.running ? '正常运行' : '已停机'}</b></div><div class="tip-row"><span>运行效率</span><b>${z.running ? z.efficiency : 0}%</b></div><div class="tip-muted">点击查看设备运行参数</div>`,
      );
    },
    onLeave: hideFTip,
    onTheme: ({ night, busy }) => {
      factoryScreen.dataset.theme = night ? 'night' : 'day';
      factoryScreen.classList.toggle('theme-changing', busy);
      document.body.classList.toggle('night-mode', night);
      FA('[data-theme-switch]').forEach((b) => {
        b.setAttribute('aria-pressed', String(night));
        b.setAttribute('aria-label', night ? '切换日景模式' : '切换夜色模式');
        b.disabled = busy;
        b.innerHTML = `<span class="theme-mode-icon" aria-hidden="true">${night ? '☀' : '☾'}</span><span>${night ? '日景模式' : '夜色模式'}</span><i></i>`;
      });
    },
    onChange: (rotating) => {
      F('#model-orbit')?.setAttribute('aria-pressed', String(rotating));
      F('#scene-orbit')?.setAttribute('aria-pressed', String(rotating));
    },
    getState: (key) => zones[key]?.running,
  });
  F('#factory-scene').classList.add('has-3d');
} catch (error) {
  console.error('Factory 3D initialization:', error);
  F('.twin-status span').textContent = '厂区预览';
}
F('#factory-theme-toggle').onclick = () => factoryTwin?.setNight(!factoryTwin.isNight());
F('#model-zoom-in').onclick = () => factoryTwin?.zoom(1.13);
F('#model-zoom-out').onclick = () => factoryTwin?.zoom(1 / 1.13);
F('#model-reset').onclick = () => {
  factoryTwin?.reset();
  F('#model-orbit').setAttribute('aria-pressed', 'false');
};
F('#model-orbit').onclick = () =>
  F('#model-orbit').setAttribute('aria-pressed', String(factoryTwin?.setAutoRotate()));
F('#model-expand').onclick = showFactoryScene;
async function exportFactoryModel() {
  if (!factoryTwin) {
    fToast('当前浏览器无法导出三维模型');
    return;
  }
  fToast('正在生成三维模型文件…');
  await new Promise(requestAnimationFrame);
  const url = URL.createObjectURL(factoryTwin.exportGLB());
  const a = document.createElement('a');
  a.href = url;
  a.download = '智慧工厂-立体厂区.glb';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  fToast('厂区 GLB 模型已导出');
}

function showFDialog(title, html) {
  hideFTip();
  F('.factory-dialog').classList.remove('model-dialog');
  if (dialogCleanup) {
    dialogCleanup();
    dialogCleanup = null;
  }
  if (!F('#dialog-backdrop').classList.contains('open')) lastFactoryFocus = document.activeElement;
  F('#dialog-title').textContent = title;
  F('#dialog-body').innerHTML = html;
  F('#dialog-backdrop').classList.add('open');
  F('#dialog-close').focus();
  F('#control-menu').classList.remove('open');
}
function closeFDialog() {
  if (dialogCleanup) {
    dialogCleanup();
    dialogCleanup = null;
  }
  F('#dialog-backdrop').classList.remove('open');
  lastFactoryFocus?.focus?.();
}
const statsHTML = (stats) =>
  `<div class="dialog-stats">${stats.map((s) => `<div class="dialog-stat"><label>${s[0]}</label><strong>${s[1]}<small>${s[2]}</small></strong></div>`).join('')}</div>`;
const noteHTML = '<p class="dialog-note">本地交互演示 · 数据与操作仅作用于当前页面会话</p>';
function showMaterial(index) {
  const m = materials[index];
  showFDialog(
    m.name + ' · 原材料运行统计',
    statsHTML([
      ['日购进', m.purchase.toFixed(1), '吨'],
      ['日消耗', m.consume.toFixed(1), '吨'],
      ['当前库存', m.stock, '吨'],
    ]) +
      `<div class="device-detail"><div><label>原料编号</label><strong>RM-${String(index + 1).padStart(3, '0')}</strong></div><div><label>采购与供应状态</label><strong class="status-running">供应正常</strong></div></div><form id="material-form"><div class="form-row"><div class="form-field"><label for="material-plan">调整日采购计划（吨）</label><input id="material-plan" type="number" min="0.1" max="9999" step="0.1" required value="${m.purchase.toFixed(1)}"></div><div class="form-field"><label for="material-consume">调整日消耗量（吨）</label><input id="material-consume" type="number" min="0.1" max="9999" step="0.1" required value="${m.consume.toFixed(1)}"></div></div><div class="dialog-actions"><button type="button" class="factory-button" id="all-materials">全部原材料</button><button class="factory-button primary" type="submit">更新演示计划</button></div></form>` +
      noteHTML,
  );
  F('#all-materials').onclick = showAllMaterials;
  F('#material-form').onsubmit = (e) => {
    e.preventDefault();
    const purchase = +F('#material-plan').value,
      consume = +F('#material-consume').value;
    if (!Number.isFinite(purchase) || !Number.isFinite(consume) || purchase <= 0 || consume <= 0)
      return;
    m.purchase = purchase;
    m.consume = consume;
    renderMaterials();
    drawMaterialChart();
    closeFDialog();
    fToast(`${m.name}采购与消耗计划已更新`);
  };
}
function showAllMaterials() {
  showFDialog(
    '原材料日购进＆日消耗',
    statsHTML([
      ['日采购总量', d3.sum(materials, (m) => m.purchase).toFixed(1), '吨'],
      ['日消耗总量', d3.sum(materials, (m) => m.consume).toFixed(1), '吨'],
      ['库存总量', d3.sum(materials, (m) => m.stock).toFixed(1), '吨'],
    ]) +
      `<table class="dialog-table"><thead><tr><th>原料</th><th>日购进</th><th>日消耗</th><th>库存</th><th>操作</th></tr></thead><tbody>${materials.map((m, i) => `<tr><td>${m.name}</td><td>${m.purchase} 吨</td><td>${m.consume} 吨</td><td>${m.stock} 吨</td><td><button data-edit-material="${i}">调整计划</button></td></tr>`).join('')}</tbody></table>` +
      noteHTML,
  );
  FA('[data-edit-material]').forEach(
    (b) => (b.onclick = () => showMaterial(+b.dataset.editMaterial)),
  );
}
function showOrders() {
  showFDialog(
    '实时订单数据',
    `<div class="dialog-toolbar"><input id="order-search" type="search" placeholder="搜索客户、地区或订单号" aria-label="搜索订单"><select id="order-filter" aria-label="筛选订单状态"><option>全部状态</option><option>已确认</option><option>生产中</option><option>已发货</option></select><button class="factory-button" id="orders-export">导出 CSV</button></div><div id="order-results"></div>` +
      noteHTML,
  );
  const paint = () => {
    const q = F('#order-search').value.trim(),
      state = F('#order-filter').value;
    const rows = orders
      .map((o, i) => ({ ...o, index: i }))
      .filter(
        (o) =>
          (state === '全部状态' || o.status === state) &&
          [o.customer, o.region, o.id, o.material].join(' ').includes(q),
      );
    F('#order-results').innerHTML =
      `<table class="dialog-table"><thead><tr><th>地区</th><th>客户</th><th>金额(万元)</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map((o) => `<tr><td>${o.region}</td><td>${o.customer}</td><td>${o.amount}</td><td class="${o.status === '已发货' ? 'status-shipped' : 'status-confirmed'}">${o.status}</td><td><button data-view-order="${o.index}">查看详情</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center">暂无符合条件的订单</td></tr>'}</tbody></table><p class="dialog-note">共 ${rows.length} 条订单</p>`;
    FA('[data-view-order]').forEach((b) => (b.onclick = () => showOrder(+b.dataset.viewOrder)));
    F('#orders-export').onclick = () => exportFactoryCSV(rows);
  };
  F('#order-search').oninput = paint;
  F('#order-filter').onchange = paint;
  paint();
}
function showOrder(index) {
  const o = orders[index];
  showFDialog(
    '订单详情 · ' + o.id,
    statsHTML([
      ['订单金额', o.amount, '万元'],
      ['计划发货量', o.quantity, '吨'],
      ['运输方式', o.transport, ''],
    ]) +
      `<div class="device-detail"><div><label>客户名称</label><strong>${o.customer}</strong></div><div><label>收货地区</label><strong>${o.region}</strong></div><div><label>产品类型</label><strong>${o.material}</strong></div><div><label>当前状态</label><strong class="${o.status === '已发货' ? 'status-shipped' : 'status-confirmed'}">${o.status}</strong></div></div><div class="dialog-actions"><button class="factory-button" id="back-orders">返回列表</button>${o.status !== '已发货' ? '<button class="factory-button primary" id="ship-order">标记为已发货</button>' : ''}</div>` +
      noteHTML,
  );
  F('#back-orders').onclick = showOrders;
  if (F('#ship-order'))
    F('#ship-order').onclick = () => {
      o.status = '已发货';
      renderOrders();
      showOrder(index);
      fToast('订单已更新为已发货');
    };
}
function showZone(key, tab = 'parameters') {
  const z = zones[key];
  showFDialog(
    z.name + ' · ' + z.code,
    `<div class="dialog-subtabs"><button data-device-tab="parameters" class="${tab === 'parameters' ? 'active' : ''}">运行参数</button><button data-device-tab="maintenance" class="${tab === 'maintenance' ? 'active' : ''}">维护记录</button></div>` +
      (tab === 'parameters'
        ? statsHTML([
            ['运行温度', z.temperature, '°C'],
            ['实时功率', z.running ? z.power : 0, 'kW'],
            ['设备效率', z.running ? z.efficiency : 0, '%'],
          ]) +
          `<div class="device-detail"><div><label>系统类型</label><strong>${z.category}</strong></div><div><label>所属位置</label><strong>${z.position}</strong></div><div><label>当前状态</label><strong class="${z.running ? 'status-running' : 'status-closed'}">${z.running ? '正常运行' : '已停机'}</strong></div><div><label>最近维护</label><strong>${z.lastService}</strong></div></div>`
        : `<table class="dialog-table"><thead><tr><th>维护日期</th><th>维护项目</th><th>执行班组</th><th>结果</th></tr></thead><tbody><tr><td>${z.lastService}</td><td>例行检查与传感器校准</td><td>设备保障一组</td><td class="status-running">已完成</td></tr><tr><td>2026-10-05</td><td>润滑系统及电气安全检查</td><td>设备保障二组</td><td class="status-running">已完成</td></tr><tr><td>2026-09-26</td><td>运行参数巡检</td><td>设备保障一组</td><td class="status-running">已完成</td></tr></tbody></table>`) +
      `<div class="dialog-actions"><button class="factory-button" id="whole-factory">查看厂区全景</button><button class="factory-button primary" id="device-toggle">${z.running ? '暂停设备' : '恢复运行'}</button></div>` +
      noteHTML,
  );
  FA('[data-device-tab]').forEach((b) => (b.onclick = () => showZone(key, b.dataset.deviceTab)));
  F('#device-toggle').onclick = () => {
    z.running = !z.running;
    showZone(key, tab);
    fToast(z.name + (z.running ? '已恢复运行' : '已暂停运行'));
  };
  F('#whole-factory').onclick = showFactoryScene;
}
function showFactoryScene() {
  showFDialog(
    '智慧工厂 · 三维厂区全景',
    `<div class="scene-modal scene-modal-3d" id="scene-modal">${factoryTwin ? '' : `<img src="${F('#factory-model').src}" alt="厂区预览">`}</div><div class="scene-modal-controls"><button class="factory-button" id="scene-minus">− 缩小</button><button class="factory-button" id="scene-reset">参考视角</button><button class="factory-button" id="scene-plus">＋ 放大</button><button class="factory-button" id="scene-orbit" aria-pressed="false">自动环绕</button><button class="factory-button scene-theme-switch" id="scene-theme-toggle" data-theme-switch aria-pressed="${factoryTwin?.isNight() ? 'true' : 'false'}">${factoryTwin?.isNight() ? '日景模式' : '夜色模式'}</button><button class="factory-button" id="scene-export">导出 GLB 模型</button></div><p class="dialog-note">拖动旋转 · 滚轮缩放 · 点击建筑查看设备详情 · R 键复位</p>`,
  );
  F('.factory-dialog').classList.add('model-dialog');
  if (factoryTwin) {
    const saved = factoryTwin.getView();
    factoryTwin.mount(F('#scene-modal'));
    factoryTwin.reset();
    dialogCleanup = () => {
      factoryTwin.mount(F('#factory-model-host'));
      factoryTwin.setView(saved);
      F('.factory-dialog').classList.remove('model-dialog');
    };
  }
  F('#scene-minus').onclick = () => factoryTwin?.zoom(1 / 1.13);
  F('#scene-plus').onclick = () => factoryTwin?.zoom(1.13);
  F('#scene-reset').onclick = () => {
    factoryTwin?.reset();
    F('#scene-orbit').setAttribute('aria-pressed', 'false');
  };
  F('#scene-orbit').onclick = () =>
    F('#scene-orbit').setAttribute('aria-pressed', String(factoryTwin?.setAutoRotate()));
  F('#scene-export').onclick = exportFactoryModel;
  F('#scene-theme-toggle').onclick = () => factoryTwin?.setNight(!factoryTwin.isNight());
}

function showEquipment(filter = '全部', typeIndex = -1) {
  const data = typeIndex < 0 ? equipmentTypes : [equipmentTypes[typeIndex]];
  showFDialog(
    typeIndex < 0 ? '设备运行统计' : '设备运行统计 · ' + equipmentTypes[typeIndex].name,
    statsHTML([
      ['设备总数', '142,398', '台'],
      ['全流程运行指数', '89.4', '分'],
      ['运行设备类型', equipmentTypes.length, '类'],
    ]) +
      `<div class="dialog-toolbar"><select id="equipment-filter" aria-label="设备状态筛选">${['全部', '开启', '关闭', '故障'].map((x) => `<option ${filter === x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="factory-button" id="view-factory">查看厂区</button></div><table class="dialog-table"><thead><tr><th>设备类型</th>${filter === '全部' || filter === '开启' ? '<th>开启设备</th>' : ''}${filter === '全部' || filter === '关闭' ? '<th>关闭设备</th>' : ''}${filter === '全部' || filter === '故障' ? '<th>故障设备</th>' : ''}<th>操作</th></tr></thead><tbody>${data.map((e, i) => `<tr><td>${e.name}</td>${filter === '全部' || filter === '开启' ? `<td class="status-running">${e.on}</td>` : ''}${filter === '全部' || filter === '关闭' ? `<td class="status-closed">${e.off}</td>` : ''}${filter === '全部' || filter === '故障' ? `<td class="status-fault">${e.fault}</td>` : ''}<td><button data-equipment-zone="${['cooling', 'production', 'storage'][typeIndex < 0 ? i : typeIndex]}">查看系统</button></td></tr>`).join('')}</tbody></table>` +
      noteHTML,
  );
  F('#equipment-filter').onchange = (e) => showEquipment(e.target.value, typeIndex);
  F('#view-factory').onclick = showFactoryScene;
  FA('[data-equipment-zone]').forEach((b) => (b.onclick = () => showZone(b.dataset.equipmentZone)));
}
function showTransport(index = -1) {
  const selected = index < 0 ? transports : [transports[index]];
  showFDialog(
    index < 0 ? '本月各路运输出厂量统计' : transports[index].name + ' · 出厂运输统计',
    statsHTML([
      ['出厂总量', d3.sum(selected, (t) => t.value).toFixed(2), '万吨'],
      ['有效运输线路', d3.sum(selected, (t) => t.routes), '条'],
      ['平均装载率', d3.mean(selected, (t) => t.load).toFixed(1), '%'],
    ]) +
      `<table class="dialog-table"><thead><tr><th>运输方式</th><th>本月出厂量</th><th>线路数量</th><th>平均装载率</th><th>运行状态</th></tr></thead><tbody>${selected.map((t) => `<tr><td>${t.name}</td><td>${t.value} 万吨</td><td>${t.routes}</td><td>${t.load}%</td><td class="status-running">运行正常</td></tr>`).join('')}</tbody></table><div class="dialog-actions"><button class="factory-button" id="transport-orders">查看关联订单</button></div>` +
      noteHTML,
  );
  F('#transport-orders').onclick = showOrders;
}
function showStorage(index = -1) {
  const selected = index < 0 ? warehouses : [warehouses[index]];
  showFDialog(
    index < 0 ? '当前仓储分配情况' : warehouses[index].name + ' · 库区详情',
    statsHTML([
      ['当前仓储总量', '96.7', '万吨'],
      ['库区数量', selected.length, '个'],
      [
        '平均利用率',
        ((d3.sum(selected, (w) => w.value) / d3.sum(selected, (w) => w.capacity)) * 100).toFixed(1),
        '%',
      ],
    ]) +
      `<table class="dialog-table"><thead><tr><th>仓储区域</th><th>主要原料</th><th>当前库存(千吨)</th><th>总容量(千吨)</th><th>空间利用率</th></tr></thead><tbody>${selected.map((w) => `<tr><td>${w.name}</td><td>${w.material}</td><td>${w.value}</td><td>${w.capacity}</td><td>${((w.value / w.capacity) * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table><div class="dialog-actions"><button class="factory-button" id="storage-device">查看储运设备</button></div>` +
      noteHTML,
  );
  F('#storage-device').onclick = () => showZone('storage');
}
function showSales(month = -1) {
  const rows = month < 0 ? [0, 1, 2, 3, 4, 5] : [month];
  showFDialog(
    month < 0 ? '月销售额统计' : `${String(month + 1).padStart(2, '0')}月 · 销售明细`,
    statsHTML([
      ['国内销售额', d3.sum(rows, (i) => sales.domestic[i]), '万元'],
      ['出口销售额', d3.sum(rows, (i) => sales.export[i]), '万元'],
      ['销售总额', d3.sum(rows, (i) => sales.domestic[i] + sales.export[i]), '万元'],
    ]) +
      `<table class="dialog-table"><thead><tr><th>月份</th><th>国内份额(万元)</th><th>出口份额(万元)</th><th>合计(万元)</th><th>出口占比</th></tr></thead><tbody>${rows.map((i) => `<tr><td>${String(i + 1).padStart(2, '0')}月</td><td>${sales.domestic[i]}</td><td>${sales.export[i]}</td><td>${sales.domestic[i] + sales.export[i]}</td><td>${((sales.export[i] / (sales.domestic[i] + sales.export[i])) * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>` +
      noteHTML,
  );
}
function showProduction() {
  showFDialog(
    '班次产量统计',
    statsHTML([
      ['累计班次产量', d3.sum(shifts, (s) => s.value), '吨'],
      ['生产线数量', 4, '条'],
      ['运行班次', 2, '班'],
    ]) +
      `<div class="dialog-chart">${F('#production-chart').outerHTML.replace('id="production-chart"', 'id="production-detail-chart"')}</div><table class="dialog-table"><thead><tr><th>班次生产线</th><th>累计产量</th><th>运行状态</th></tr></thead><tbody>${shifts.map((s) => `<tr><td>${s.name}</td><td>${s.value} 吨</td><td class="status-running">正常生产</td></tr>`).join('')}</tbody></table>` +
      noteHTML,
  );
}
function showKpi(key) {
  const title = key === 'area' ? '厂区总面积' : key === 'target' ? '目标出货进度' : '当前出货统计';
  showFDialog(
    title,
    statsHTML([
      ['厂区总面积', '15,700', 'm²'],
      ['目标出货数', '2,316', '万吨'],
      ['当前出货数', '1,781', '万吨'],
    ]) +
      `<div class="device-detail"><div><label>目标完成率</label><strong>76.9%</strong></div><div><label>距离出货目标</label><strong>535 万吨</strong></div><div><label>运营系统</label><strong>生产 · 仓储 · 物流一体化</strong></div><div><label>工厂状态</label><strong class="status-running">平稳运行</strong></div></div><div class="dialog-actions"><button class="factory-button primary" id="kpi-factory">查看厂区全景</button></div>` +
      noteHTML,
  );
  F('#kpi-factory').onclick = showFactoryScene;
}
function exportFactoryCSV(rows = orders) {
  const head = ['订单编号', '地区', '客户', '金额(万元)', '订单状态', '运输方式', '原料'];
  const content =
    '\uFEFF' +
    [
      head,
      ...rows.map((o) => [o.id, o.region, o.customer, o.amount, o.status, o.transport, o.material]),
    ]
      .map((row) => row.map((c) => '"' + String(c).replaceAll('"', '""') + '"').join(','))
      .join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = '智慧工厂-订单数据.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  fToast('订单数据已导出');
}
async function factoryFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fToast('可使用浏览器全屏功能观看大屏');
  }
}
document.addEventListener('click', (event) => {
  const b = event.target.closest('button');
  if (b) {
    if (b.dataset.material !== undefined) showMaterial(+b.dataset.material);
    if (b.dataset.materialMode) {
      materialMode = b.dataset.materialMode;
      FA('[data-material-mode]').forEach((x) => {
        const active = x === b;
        x.classList.toggle('active', active);
        x.setAttribute('aria-pressed', active);
      });
      drawMaterialChart();
    }
    if (b.dataset.shift !== undefined) {
      chosenShift = chosenShift === +b.dataset.shift ? -1 : +b.dataset.shift;
      FA('[data-shift]').forEach((x) => {
        const active = +x.dataset.shift === chosenShift;
        x.classList.toggle('active', active);
        x.setAttribute('aria-pressed', active);
      });
      drawProduction();
    }
    if (b.dataset.series) {
      const key = b.dataset.series;
      const group = key.startsWith('shift') ? ['shift-a', 'shift-b'] : ['domestic', 'export'];
      if (visibleSeries[key] && group.filter((k) => visibleSeries[k]).length === 1) {
        fToast('至少保留一组数据系列');
        return;
      }
      visibleSeries[key] = !visibleSeries[key];
      b.setAttribute('aria-pressed', visibleSeries[key]);
      if (key.startsWith('shift')) drawProduction();
      else drawSales();
    }
    if (b.dataset.transport !== undefined) showTransport(+b.dataset.transport);
    if (b.dataset.zone) showZone(b.dataset.zone);
    if (b.dataset.equipmentFilter) showEquipment(b.dataset.equipmentFilter);
    if (b.dataset.kpi) showKpi(b.dataset.kpi);
    if (b.dataset.expand)
      ({
        materials: showAllMaterials,
        production: showProduction,
        orders: showOrders,
        equipment: showEquipment,
        transport: showTransport,
        storage: showStorage,
        sales: showSales,
      })[b.dataset.expand]();
  }
  const row = event.target.closest('[data-order],[data-equipment-type]');
  if (row) {
    if (row.dataset.order !== undefined) showOrder(+row.dataset.order);
    if (row.dataset.equipmentType !== undefined) showEquipment('全部', +row.dataset.equipmentType);
  }
  if (!event.target.closest('#control-menu,#screen-title'))
    F('#control-menu').classList.remove('open');
});
F('#dialog-close').onclick = closeFDialog;
F('#dialog-backdrop').onclick = (e) => {
  if (e.target === F('#dialog-backdrop')) closeFDialog();
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFDialog();
    F('#control-menu').classList.remove('open');
    hideFTip();
  }
  if (
    (e.key === 'Enter' || e.key === ' ') &&
    e.target.matches('[data-order],[data-equipment-type]')
  ) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === 'Tab' && F('#dialog-backdrop').classList.contains('open')) {
    const list = FA(
        '#dialog-backdrop button,#dialog-backdrop input,#dialog-backdrop select',
      ).filter((x) => x.offsetParent !== null && !x.disabled),
      a = list[0],
      b = list[list.length - 1];
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      b.focus();
    } else if (!e.shiftKey && document.activeElement === b) {
      e.preventDefault();
      a.focus();
    }
  }
});
F('#screen-title').onclick = () => F('#control-menu').classList.toggle('open');
F('#fullscreen-button').onclick = factoryFullscreen;
F('#menu-fullscreen').onclick = factoryFullscreen;
F('#menu-export').onclick = () => exportFactoryCSV();
F('#menu-refresh').onclick = () => {
  renderOrders();
  drawProduction();
  drawStorage();
  drawSales();
  fToast('运营数据已刷新 · ' + new Date().toLocaleTimeString('zh-CN'));
};
F('#menu-about').onclick = () =>
  showFDialog(
    '智慧工厂可视化大屏',
    `<p>通过厂区数字孪生、原料与产量统计、实时订单、出厂物流、仓储及销售数据，集中展示智慧工厂运营全貌。</p><div class="device-detail"><div><label>展示模式</label><strong>离线可交互数字大屏</strong></div><div><label>厂区视图</label><strong>实时三维模型 · 建筑点选与视角控制</strong></div></div><p>将鼠标移至图表可查看数据；点击厂区、原材料、订单或仓储柱形可打开对应详情。点击面板右上角可展开，按 Esc 关闭。</p>` +
      noteHTML,
  );
F('#running-gauge').onclick = () => showEquipment();
F('#equipment-total').onclick = () => showEquipment();
F('#storage-summary').onclick = () => showStorage();
window.factoryDashboard = {
  factoryTwin,
  materials,
  orders,
  zones,
  warehouses,
  sales,
  get materialMode() {
    return materialMode;
  },
  get chosenShift() {
    return chosenShift;
  },
  visibleSeries,
  showFactoryScene,
  showOrders,
};
