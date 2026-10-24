const CHINA = null; /*__CHINA__*/
const CHINA_OUTLINE = null; /*__CHINA_OUTLINE__*/
const COUNTRIES = null; /*__COUNTRIES__*/
const RELIEF = '/*__RELIEF__*/';
const MAP_TEXTURE = '/*__MAP_TEXTURE__*/';
const RELIEF_EXTENT = null; /*__RELIEF_EXTENT__*/
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const screen = $('#screen');
let scale = 1,
  period = 7,
  refreshCount = 0,
  selectedProvince = null,
  lastFocus = null,
  modalCleanup = null;
function resize() {
  scale = Math.min(innerWidth / 1920, innerHeight / 1040);
  screen.style.transform = `scale(${scale})`;
}
addEventListener('resize', resize);
resize();
const pad = (n) => String(n).padStart(2, '0');
function tick() {
  const d = new Date();
  $('#clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  $('#date').textContent = `${d.getFullYear()} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}`;
}
tick();
setInterval(tick, 1000);
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();
const categories = [
  { name: '道路异常', value: 6202, pct: 43, color: '#1376ff' },
  { name: '设施异常', value: 1990, pct: 14, color: '#00ccf7' },
  { name: '环境异常', value: 1485, pct: 12, color: '#5c37ff' },
  { name: '安全隐患', value: 1020, pct: 7, color: '#5ce6b4' },
  { name: '其他事件', value: 1200, pct: 7, color: '#ffd028' },
];
const fleet = [
  { name: '无人车', count: 95, unit: '辆', icon: 'bot', color: '#18aaff' },
  { name: '有人车', count: 97, unit: '辆', icon: 'car', color: '#2575ff' },
  { name: '工程车', count: 79, unit: '辆', icon: 'crane', color: '#e48c39' },
  { name: '机器狗', count: 56, unit: '个', icon: 'dog', color: '#00b7bb' },
  { name: '无人船', count: 324, unit: '艘', icon: 'boat', color: '#0caddf' },
  { name: '无人机', count: 3432, unit: '架', icon: 'drone', color: '#7951f4' },
];
const vehicles = [
  {
    id: '京ACE6503',
    type: '无人车',
    battery: 20,
    mileage: 193.67,
    total: 269,
    region: '北京市',
    site: '北京亦庄示范区',
    speed: 18.6,
    running: true,
  },
  {
    id: '京ACE6505',
    type: '无人车',
    battery: 20,
    mileage: 193.67,
    total: 260,
    region: '广西壮族自治区',
    site: '南宁青秀试点区',
    speed: 16.8,
    running: true,
  },
];
const events = [
  {
    id: 'EV20261019001',
    type: '摄像头',
    name: '设备离线',
    time: '12:00:00',
    status: '已处理',
    location: '北京亦庄 · 科创路',
    level: '一般',
    description: '巡检设备检测到路侧摄像头连接中断，已完成链路重连与设备复核。',
  },
  {
    id: 'EV20261019002',
    type: '摄像头',
    name: '设备告警',
    time: '12:00:00',
    status: '已处理',
    location: '广西南宁 · 青秀路',
    level: '一般',
    description: '设备上报画面遮挡，巡检人员已清理遮挡并确认恢复。',
  },
  {
    id: 'EV20261019003',
    type: '摄像头',
    name: '设备离线',
    time: '12:00:00',
    status: '已处理',
    location: '北京亦庄 · 荣华路',
    level: '一般',
    description: '边缘设备通信短时异常，系统已完成自动重连。',
  },
  {
    id: 'EV20261019004',
    type: '道路异常',
    name: '路面障碍',
    time: '13:24:18',
    status: '待处理',
    location: '北京亦庄 · 科创五街',
    level: '重要',
    description: '无人巡检车发现路面障碍物，识别置信度为 98.6%，已生成处置任务。',
  },
  {
    id: 'EV20261019005',
    type: '环境异常',
    name: '垃圾堆放',
    time: '14:08:32',
    status: '处理中',
    location: '广西南宁 · 民族大道',
    level: '一般',
    description: '道路两侧存在垃圾堆放，待保洁人员处理并上传现场结果。',
  },
  {
    id: 'EV20261019006',
    type: '设施异常',
    name: '井盖异常',
    time: '15:12:06',
    status: '待处理',
    location: '北京亦庄 · 宏达路',
    level: '重要',
    description: 'AI识别到井盖位置偏移，已发送现场核查任务。',
  },
];
const alerts = [
  {
    id: 'AL20261019001',
    type: '无人车',
    plate: '京ACE6503',
    name: '离线',
    status: '已处理',
    time: '11:42:16',
    description: '车辆通信短时中断，网络已恢复，车辆处于正常巡检状态。',
  },
  {
    id: 'AL20261019002',
    type: '无人车',
    plate: '京ACE6505',
    name: '离线',
    status: '已处理',
    time: '11:50:28',
    description: '已完成车辆链路检测与通信恢复。',
  },
  {
    id: 'AL20261019003',
    type: '无人车',
    plate: '京ACE6503',
    name: '离线',
    status: '已处理',
    time: '12:01:03',
    description: '车辆在隧道中短时离线，当前在线。',
  },
  {
    id: 'AL20261019004',
    type: '无人车',
    plate: '京ACE6503',
    name: '电量过低',
    status: '待处理',
    time: '15:10:35',
    description: '剩余电量 20%，建议安排返航充电。',
  },
  {
    id: 'AL20261019005',
    type: '无人船',
    plate: '桂巡0632',
    name: '定位异常',
    status: '处理中',
    time: '14:28:42',
    description: 'GNSS定位精度降低，正在重新校准。',
  },
];
const statusClass = (s) =>
  s === '待处理' ? 'status-wait' : s === '处理中' ? 'status-working' : 'status-done';
function tableRows() {
  $('#event-rows').innerHTML = events
    .slice(0, 3)
    .map(
      (e, i) =>
        `<tr data-event="${i}" tabindex="0" aria-label="查看${e.name}详情"><td>${e.type}</td><td>${e.name}</td><td>${today} ${e.time}</td><td class="${statusClass(e.status)}">${e.status}</td></tr>`,
    )
    .join('');
  $('#alert-rows').innerHTML = alerts
    .slice(0, 3)
    .map(
      (e, i) =>
        `<tr data-alert="${i}" tabindex="0" aria-label="查看${e.plate}${e.name}详情"><td>${e.type}</td><td>${e.plate}</td><td>${e.name}</td><td class="${statusClass(e.status)}">${e.status}</td></tr>`,
    )
    .join('');
}
tableRows();
function drawDonut() {
  const svg = d3.select('#donut');
  svg.selectAll('*').remove();
  const g = svg.append('g').attr('transform', 'translate(92,86)');
  g.append('circle')
    .attr('r', 60)
    .attr('fill', 'none')
    .attr('stroke', '#07326a')
    .attr('stroke-width', 2);
  const pie = d3
    .pie()
    .sort(null)
    .value((d) => d.pct)
    .padAngle(0.15)
    .startAngle(0.12)
    .endAngle(Math.PI * 2 + 0.12);
  g.selectAll('path')
    .data(pie(categories))
    .join('path')
    .attr('d', d3.arc().innerRadius(68).outerRadius(73).cornerRadius(2))
    .attr('fill', (d) => d.data.color)
    .attr('filter', 'drop-shadow(0 0 4px currentColor)')
    .style('color', (d) => d.data.color)
    .on('pointermove', (event, d) =>
      showTip(
        event,
        `<strong>${d.data.name}</strong><br>累计事件：${d.data.value.toLocaleString()} 件<br>统计占比：${d.data.pct}%`,
      ),
    )
    .on('pointerleave', hideTip)
    .on('click', (event, d) => openCategory(d.data.name));
  g.append('path')
    .attr('d', d3.arc().innerRadius(59).outerRadius(61).startAngle(0.4).endAngle(4.9))
    .attr('fill', '#0874fc')
    .attr('opacity', 0.8);
  g.append('text')
    .attr('y', 5)
    .attr('text-anchor', 'middle')
    .attr('fill', '#04ebef')
    .attr('font-size', 27)
    .attr('letter-spacing', -2)
    .attr('style', 'text-shadow:0 0 7px #00c4ed')
    .text('47625');
  g.append('text')
    .attr('y', 24)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9bbdd2')
    .attr('font-size', 10)
    .attr('letter-spacing', 2)
    .text('事件总量');
  $('#categories').innerHTML = categories
    .map(
      (c) =>
        `<button class="category-row" data-category="${c.name}"><span class="swatch" style="color:${c.color}"></span><span>${c.name}</span><span>${c.value}</span><span>${c.pct}%</span></button>`,
    )
    .join('');
}
drawDonut();
function drawComparison() {
  const svg = d3.select('#comparison-chart');
  svg.selectAll('*').remove();
  const defs = svg.append('defs');
  let grad = defs
    .append('linearGradient')
    .attr('id', 'bars-blue')
    .attr('x1', '0')
    .attr('y1', '0')
    .attr('x2', '0')
    .attr('y2', '1');
  grad.append('stop').attr('stop-color', '#409aff');
  grad.append('stop').attr('offset', '1').attr('stop-color', '#1243b7').attr('stop-opacity', 0.5);
  let areaGrad = defs
    .append('linearGradient')
    .attr('id', 'line-area')
    .attr('x2', '0')
    .attr('y2', '1');
  areaGrad.append('stop').attr('stop-color', '#1ebac7').attr('stop-opacity', 0.22);
  areaGrad.append('stop').attr('offset', '1').attr('stop-color', '#1ebac7').attr('stop-opacity', 0);
  const base =
    period === 7
      ? [28, 34, 38, 30, 34, 17]
      : period === 30
        ? [30, 43, 36, 48, 40, 29]
        : [32, 40, 35, 52, 47, 40];
  const values = base.map((v, i) => v + (refreshCount ? (i + refreshCount) % 4 : 0));
  const line =
    period === 7
      ? [4.5, 5.2, 6.6, 5.1, 6.1, 2.6]
      : period === 30
        ? [5, 6, 5.2, 7.3, 6.2, 4.4]
        : [4.8, 6.3, 5.4, 7.7, 7, 5.2];
  const labels =
    period === 7
      ? ['7/15', '7/16', '7/17', '7/18', '7/19', '7/20']
      : period === 30
        ? ['09/24', '09/29', '10/04', '10/09', '10/14', '10/19']
        : ['5月', '6月', '7月', '8月', '9月', '10月'];
  const x = d3.scalePoint().domain(labels).range([53, 364]),
    y = d3.scaleLinear().domain([0, 60]).range([161, 37]),
    yl = d3.scaleLinear().domain([0, 10]).range([161, 37]);
  [0, 10, 20, 30, 40, 50].forEach((v) => {
    svg
      .append('line')
      .attr('x1', 34)
      .attr('x2', 389)
      .attr('y1', y(v))
      .attr('y2', y(v))
      .attr('stroke', '#125074')
      .attr('opacity', 0.2);
    svg
      .append('text')
      .attr('x', 20)
      .attr('y', y(v) + 3)
      .text(v);
    svg
      .append('text')
      .attr('x', 397)
      .attr('y', y(v) + 3)
      .text(Math.round(v / 6));
  });
  svg.append('text').attr('class', 'axis-title').attr('x', 15).attr('y', 19).text('里程(公里)');
  svg.append('text').attr('class', 'axis-title').attr('x', 344).attr('y', 19).text('事件(件)');
  svg
    .selectAll('rect.bar')
    .data(values)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (v, i) => x(labels[i]) - 7)
    .attr('y', y)
    .attr('width', 14)
    .attr('height', (v) => 161 - y(v))
    .attr('fill', 'url(#bars-blue)')
    .attr('stroke', '#477bff')
    .attr('stroke-opacity', 0.7);
  const points = line.map((v, i) => [x(labels[i]), yl(v)]);
  svg
    .append('path')
    .attr(
      'd',
      d3
        .area()
        .x((d) => d[0])
        .y0(161)
        .y1((d) => d[1])(points),
    )
    .attr('fill', 'url(#line-area)');
  svg
    .append('path')
    .attr('d', d3.line()(points))
    .attr('fill', 'none')
    .attr('stroke', '#11a9b1')
    .attr('stroke-width', 1.8);
  svg
    .selectAll('circle')
    .data(points)
    .join('circle')
    .attr('cx', (d) => d[0])
    .attr('cy', (d) => d[1])
    .attr('r', 2.5)
    .attr('fill', '#21e2e1');
  labels.forEach((label) =>
    svg.append('text').attr('x', x(label)).attr('y', 180).attr('text-anchor', 'middle').text(label),
  );
  const guide = svg
    .append('line')
    .attr('y1', 33)
    .attr('y2', 162)
    .attr('stroke', '#48c9ee')
    .attr('stroke-dasharray', '3 3')
    .attr('opacity', 0);
  svg
    .append('rect')
    .attr('class', 'chart-hit')
    .attr('x', 34)
    .attr('y', 30)
    .attr('width', 355)
    .attr('height', 133)
    .on('pointermove', (event) => {
      const [mx] = d3.pointer(event);
      const i = Math.max(0, Math.min(5, Math.round((mx - 53) / (311 / 5))));
      guide.attr('x1', x(labels[i])).attr('x2', x(labels[i])).attr('opacity', 0.7);
      showTip(
        event,
        `<strong>${labels[i]} 巡检数据</strong><div class="tip-row"><span><i class="tip-dot" style="background:#408aff"></i>巡检里程</span><b>${values[i]} 公里</b></div><div class="tip-row"><span><i class="tip-dot" style="background:#15d8d2"></i>巡检事件</span><b>${Math.round(line[i])} 件</b></div>`,
      );
    })
    .on('pointerleave', () => {
      hideTip();
      guide.attr('opacity', 0);
    });
  $('#comparison-chart').setAttribute(
    'aria-label',
    `最近${period === 365 ? '一年' : period === 30 ? '一月' : '七日'}巡检里程与事件对比图`,
  );
}
drawComparison();
function drawTypeChart() {
  const svg = d3.select('#type-chart');
  svg.selectAll('*').remove();
  const defs = svg.append('defs');
  for (const [id, a, b] of [
    ['type-blue', '#3d83ff', '#142c7d'],
    ['type-cyan', '#06dedf', '#006988'],
  ]) {
    const g = defs.append('linearGradient').attr('id', id).attr('x2', '0').attr('y2', '1');
    g.append('stop').attr('stop-color', a);
    g.append('stop').attr('offset', '1').attr('stop-color', b);
  }
  const values = [29, 35, 39, 33, 39, 39],
    second = [20, 24, 27, 22, 25, 12],
    labels = ['无人车', '有人车', '工程车', '机器狗', '无人船', '无人机'];
  const y = d3.scaleLinear().domain([0, 50]).range([157, 26]);
  svg.append('text').attr('class', 'axis-title').attr('x', 5).attr('y', 15).text('车辆(辆)');
  svg.append('text').attr('class', 'axis-title').attr('x', 336).attr('y', 15).text('里程(公里)');
  [0, 10, 20, 30, 40].forEach((v) => {
    svg
      .append('text')
      .attr('x', 13)
      .attr('y', y(v) + 3)
      .text(v);
    svg
      .append('text')
      .attr('x', 379)
      .attr('y', y(v) + 3)
      .text(v * 4);
    svg
      .append('line')
      .attr('x1', 35)
      .attr('x2', 370)
      .attr('y1', y(v))
      .attr('y2', y(v))
      .attr('stroke', '#175a7e')
      .attr('opacity', 0.16);
  });
  labels.forEach((l, i) => {
    const x = 45 + i * 56;
    svg
      .append('rect')
      .attr('x', x)
      .attr('y', y(values[i]))
      .attr('width', 13)
      .attr('height', 157 - y(values[i]))
      .attr('fill', 'url(#type-blue)')
      .attr('stroke', '#709aff')
      .attr('stroke-width', 0.5);
    svg
      .append('rect')
      .attr('x', x + 16)
      .attr('y', y(second[i]))
      .attr('width', 13)
      .attr('height', 157 - y(second[i]))
      .attr('fill', 'url(#type-cyan)');
    svg
      .append('text')
      .attr('x', x + 14)
      .attr('y', 176)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .text(l);
    svg
      .append('rect')
      .attr('class', 'chart-hit')
      .attr('x', x - 8)
      .attr('y', 23)
      .attr('width', 50)
      .attr('height', 139)
      .on('pointermove', (e) =>
        showTip(
          e,
          `<strong>${l}</strong><div class="tip-row"><span>出勤车辆</span><b>${values[i]} 辆</b></div><div class="tip-row"><span>巡检里程</span><b>${second[i] * 4} 公里</b></div>`,
        ),
      )
      .on('pointerleave', hideTip)
      .on('click', () => openFleet(l));
  });
}
drawTypeChart();
$('#fleet-grid').innerHTML = fleet
  .map(
    (f) =>
      `<button class="fleet-item" data-fleet="${f.name}" style="--fleet-color:${f.color}"><span class="icon-box">${icon(f.icon)}</span><span><span class="label">${f.name}</span><strong>${f.count}</strong><small>${f.unit}</small></span></button>`,
  )
  .join('');
function renderVehicles() {
  vehicles.forEach((v, i) => {
    $(`#vehicle-${i + 1}`).innerHTML =
      `<div class="vehicle-content"><div class="car-summary"><svg class="mini-car" role="img" aria-label="无人巡检车"><use href="#car-model"/></svg><span class="car-pedestal"></span><span class="car-id">${v.id}</span><span class="car-type">巡检车辆</span><span class="car-status ${v.running ? '' : 'paused'}">${v.running ? '巡检中' : '已暂停'}</span></div><div class="car-tiles"><button class="car-tile info" data-action="detail" data-vehicle="${i}">${icon('list')}<span class="tile-label">${v.type}巡检车</span><span class="tile-sub">${v.site}</span><span class="tile-sub">运行状态：${v.running ? '自动驾驶中' : '已暂停'}</span></button><button class="car-tile battery" data-action="battery" data-vehicle="${i}"><span class="tile-label">电量</span><span class="tile-value orange">${v.battery}%</span>${icon('battery')}</button><button class="car-tile" data-action="mileage" data-vehicle="${i}">${icon('pin')}<span class="tile-label">巡检总里程</span><span class="tile-value">${v.mileage.toFixed(2)}<small>公里</small></span></button><button class="car-tile" data-action="events" data-vehicle="${i}">${icon('list')}<span class="tile-label">累计巡检事件</span><span class="tile-value orange">${v.total}<small>件</small></span></button><div class="car-controls"><button data-action="video" data-vehicle="${i}">视频巡检</button><button data-action="dispatch" data-vehicle="${i}">远程调度</button><button data-action="takeover" data-vehicle="${i}">${v.running ? '暂停巡检' : '恢复巡检'}</button><button data-action="route" data-vehicle="${i}">轨迹回放</button></div></div></div>`;
  });
}
renderVehicles();
function showTip(event, html) {
  const tip = $('#tooltip');
  tip.innerHTML = html;
  tip.style.display = 'block';
  const b = screen.getBoundingClientRect();
  let x = (event.clientX - b.left) / scale + 17,
    y = (event.clientY - b.top) / scale + 15;
  x = Math.min(x, 1920 - tip.offsetWidth - 15);
  y = Math.min(y, 1040 - tip.offsetHeight - 15);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}
function hideTip() {
  $('#tooltip').style.display = 'none';
}
let toastTimer;
function toast(t) {
  $('#toast').textContent = t;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
}
const projection = d3.geoMercator().center([104, 35]).scale(680).translate([950, 590]);
const path = d3.geoPath(projection);
function normalizePolygons(collection) {
  collection.features.forEach((f) => {
    const g = f.geometry;
    if (g.type === 'Polygon') {
      if (d3.geoArea(g) > Math.PI * 2) g.coordinates.forEach((r) => r.reverse());
    } else if (g.type === 'MultiPolygon') {
      g.coordinates.forEach((p) => {
        if (d3.geoArea({ type: 'Polygon', coordinates: p }) > Math.PI * 2)
          p.forEach((r) => r.reverse());
      });
    }
  });
}
normalizePolygons(CHINA);
normalizePolygons(COUNTRIES);
normalizePolygons(CHINA_OUTLINE);
const realFeatures = CHINA.features
  .filter((f) => f.properties.name)
  .map((f) => ({
    ...f,
    geometry:
      f.geometry.type === 'MultiPolygon'
        ? {
            ...f.geometry,
            coordinates: f.geometry.coordinates.filter((p) => p[0].some((c) => c[1] > 17.5)),
          }
        : f.geometry,
  }));
const chinaOutline = {
  ...CHINA_OUTLINE.features[0],
  geometry: {
    ...CHINA_OUTLINE.features[0].geometry,
    coordinates: CHINA_OUTLINE.features[0].geometry.coordinates.filter(
      (p) => p[0].some((c) => c[1] > 17.5) && path.area({ type: 'Polygon', coordinates: p }) > 30,
    ),
  },
};
let mapSelection;
function drawMap() {
  const svg = d3.select('#map');
  const defs = svg.append('defs');
  defs.html(
    `<linearGradient id="provinceFill" x1="0" y1="0" x2="0.7" y2="1"><stop stop-color="#76ceff" stop-opacity=".35"/><stop offset=".48" stop-color="#378fce" stop-opacity=".3"/><stop offset="1" stop-color="#0c5289" stop-opacity=".44"/></linearGradient><filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter><filter id="pin-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter><radialGradient id="terrain-fade-grad" cx="52%" cy="48%" r="63%"><stop offset="0" stop-color="white"/><stop offset=".55" stop-color="#c6c6c6"/><stop offset="1" stop-color="#171717"/></radialGradient><mask id="terrain-mask" maskUnits="userSpaceOnUse" x="0" y="-100" width="1920" height="1350"><rect x="0" y="-100" width="1920" height="1350" fill="url(#terrain-fade-grad)"/></mask><radialGradient id="cyan-pool"><stop stop-color="#6effff"/><stop offset=".35" stop-color="#00e5e4"/><stop offset="1" stop-color="#00d4ee" stop-opacity="0"/></radialGradient><radialGradient id="orange-pool"><stop stop-color="#fff0b9"/><stop offset=".3" stop-color="#ff9d22"/><stop offset="1" stop-color="#ff7900" stop-opacity="0"/></radialGradient>`,
  );
  const g = svg.append('g').attr('transform', 'translate(0 57) scale(1 .88)');
  const R = 6378137;
  const ll = [
      ((RELIEF_EXTENT.xmin / R) * 180) / Math.PI,
      (Math.atan(Math.sinh(RELIEF_EXTENT.ymax / R)) * 180) / Math.PI,
    ],
    rr = [
      ((RELIEF_EXTENT.xmax / R) * 180) / Math.PI,
      (Math.atan(Math.sinh(RELIEF_EXTENT.ymin / R)) * 180) / Math.PI,
    ];
  const p1 = projection(ll),
    p2 = projection(rr);
  const imageAttrs = {
    x: p1[0],
    y: p1[1],
    width: ((RELIEF_EXTENT.xmax - RELIEF_EXTENT.xmin) / R) * projection.scale(),
    height: ((RELIEF_EXTENT.ymax - RELIEF_EXTENT.ymin) / R) * projection.scale(),
  };
  g.append('image')
    .attr('href', RELIEF)
    .attr('x', imageAttrs.x)
    .attr('y', imageAttrs.y)
    .attr('width', imageAttrs.width)
    .attr('height', imageAttrs.height)
    .attr('opacity', 0.65)
    .attr('mask', 'url(#terrain-mask)');
  g.selectAll('.country')
    .data(COUNTRIES.features)
    .join('path')
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', '#01101c')
    .attr('stroke-width', 1.6)
    .attr('opacity', 0.75);
  drawMapDepth(g, defs, path(chinaOutline));
  const clip = defs.append('clipPath').attr('id', 'china-clip');
  clip
    .attr('clipPathUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', realFeatures.map((f) => path(f)).join(''))
    .attr('fill', 'white')
    .attr('clip-rule', 'nonzero');
  g.append('g')
    .attr('clip-path', 'url(#china-clip)')
    .append('image')
    .attr('href', MAP_TEXTURE)
    .attr('x', imageAttrs.x)
    .attr('y', imageAttrs.y)
    .attr('width', imageAttrs.width)
    .attr('height', imageAttrs.height)
    .attr('opacity', 1)
    .style('filter', 'brightness(1.05) saturate(.85) blur(.35px)');
  mapSelection = g
    .append('g')
    .selectAll('path')
    .data(realFeatures)
    .join('path')
    .attr('class', 'province')
    .attr('d', path)
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', (d) => `查看${d.properties.name}巡检数据`)
    .on('pointermove', (e, d) => {
      const s = provinceStats(d);
      showTip(
        e,
        `<strong>${d.properties.name}</strong><div class="tip-row"><span>在线车辆</span><b>${s.vehicles} 辆</b></div><div class="tip-row"><span>今日里程</span><b>${s.mileage} 公里</b></div><div style="color:#4687a5;font-size:10px">点击查看区域详情</div>`,
      );
    })
    .on('pointerleave', hideTip)
    .on('click', (e, d) => selectProvince(d))
    .on('keydown', (e, d) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectProvince(d);
      }
    });
  g.append('g')
    .attr('pointer-events', 'none')
    .selectAll('path')
    .data(realFeatures)
    .join('path')
    .attr('class', 'province-border')
    .attr('d', path);
  finishMapSurface(g);
  const inset = svg.append('g').attr('transform', 'translate(1190 684)');
  inset
    .append('path')
    .attr('d', 'M0 0H88L96 106H7Z')
    .attr('fill', '#031a2b66')
    .attr('stroke', '#3189bd')
    .attr('stroke-width', 2);
  const southProjection = d3.geoMercator().center([115, 12]).scale(150).translate([46, 54]);
  const southPath = d3.geoPath(southProjection);
  inset
    .append('clipPath')
    .attr('id', 'inset-clip')
    .append('rect')
    .attr('x', 7)
    .attr('y', 5)
    .attr('width', 82)
    .attr('height', 98);
  inset
    .append('g')
    .attr('clip-path', 'url(#inset-clip)')
    .selectAll('path')
    .data(CHINA.features)
    .join('path')
    .attr('d', southPath)
    .attr('fill', '#225d8c')
    .attr('stroke', '#63b5de')
    .attr('stroke-width', 0.5);
  inset
    .append('text')
    .attr('x', 47)
    .attr('y', 96)
    .attr('fill', '#3a92ba')
    .attr('font-size', 8)
    .attr('text-anchor', 'middle')
    .text('南海诸岛');
  const points = [
    {
      coord: [91, 36.5],
      name: '西部巡检中心',
      color: '#00eeeb',
      kind: 'hex',
      label: '10000公里',
      region: '青海省',
      dx: -25,
    },
    {
      coord: [96, 35],
      name: '西部巡检车队',
      color: '#ff9d36',
      kind: 'car',
      label: '30辆',
      region: '青海省',
      dx: 0,
    },
    {
      coord: [110, 40.5],
      name: '华北巡检中心',
      color: '#00eeeb',
      kind: 'hex',
      label: '10000公里',
      region: '内蒙古自治区',
      dx: -10,
    },
    {
      coord: [114.5, 41.8],
      name: '华北巡检车队',
      color: '#ff9d36',
      kind: 'car',
      label: '30辆',
      region: '河北省',
      dx: 0,
    },
  ];
  const marks = svg.append('g');
  points.forEach((p, i) => {
    let [x, y] = projection(p.coord);
    y = y * 0.88 + 57;
    const m = marks
      .append('g')
      .attr('class', 'map-marker')
      .attr('transform', `translate(${x} ${y})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', p.name + ' ' + p.label);
    m.append('ellipse')
      .attr('cy', 26)
      .attr('rx', 35)
      .attr('ry', 10)
      .attr('fill', p.kind === 'car' ? 'url(#orange-pool)' : 'url(#cyan-pool)');
    m.append('ellipse')
      .attr('class', 'marker-ring')
      .attr('cy', 26)
      .attr('rx', 28)
      .attr('ry', 7)
      .attr('fill', 'none')
      .attr('stroke', p.color)
      .attr('stroke-width', 1.3)
      .attr('opacity', 0.7);
    m.append('path').attr('d', 'M-13-6 0 20 13-6Z').attr('fill', p.color).attr('opacity', 0.7);
    m.append('circle')
      .attr('cy', -21)
      .attr('r', 25)
      .attr('fill', p.color)
      .attr('opacity', 0.35)
      .attr('filter', 'url(#pin-glow)');
    m.append('circle')
      .attr('class', 'pin-disc')
      .attr('cy', -21)
      .attr('r', 21)
      .attr('fill', p.kind === 'car' ? '#b96928' : '#007a83')
      .attr('stroke', p.color)
      .attr('stroke-width', 2.2);
    m.append('circle').attr('cy', -21).attr('r', 16).attr('fill', p.color).attr('opacity', 0.18);
    m.append('use')
      .attr('href', `#i-${p.kind === 'car' ? 'car' : 'hex'}`)
      .attr('x', -13)
      .attr('y', -34)
      .attr('width', 26)
      .attr('height', 26)
      .attr('fill', 'none')
      .attr('stroke', p.kind === 'car' ? '#fff5d9' : '#21fff4')
      .attr('stroke-width', 2.2);
    m.append('text').attr('class', 'map-note').attr('x', p.dx).attr('y', -56).text(p.label);
    m.on('pointermove', (e) =>
      showTip(
        e,
        `<strong>${p.name}</strong><br>覆盖区域：${p.region}<br>${p.kind === 'car' ? '在线车辆：30 辆' : '累计里程：10,000 公里'}<br><span style="color:#5c9bb8">点击查看调度信息</span>`,
      ),
    )
      .on('pointerleave', hideTip)
      .on('click', () => {
        hideTip();
        selectProvince(realFeatures.find((f) => f.properties.name === p.region));
      })
      .on('keydown', (e) => {
        if (e.key === 'Enter')
          selectProvince(realFeatures.find((f) => f.properties.name === p.region));
      });
  });
}
drawMap();
function provinceStats(f) {
  const n = Number(f.properties.adcode) / 10000;
  return {
    vehicles:
      f.properties.name === '北京市'
        ? 300
        : f.properties.name === '广西壮族自治区'
          ? 300
          : Math.round(n * 3.6 + 9),
    mileage: Math.round(n * 13.7 + 210),
    events: Math.round(n * 0.8 + 8),
    sites: Math.max(1, Math.round(n / 10)),
  };
}
function selectProvince(f) {
  selectedProvince = f;
  hideTip();
  mapSelection.classed('selected', (d) => d === f);
  const s = provinceStats(f);
  $('#map-detail').innerHTML =
    `<button class="close" aria-label="关闭区域详情">×</button><h3>${f.properties.name}</h3><p><span>巡检站点</span><b>${s.sites} 个</b></p><p><span>在线车辆</span><b>${s.vehicles} 辆</b></p><p><span>今日巡检里程</span><b>${s.mileage.toLocaleString()} 公里</b></p><p><span>今日巡检事件</span><b>${s.events} 件</b></p><button class="small-button" id="region-details">查看区域调度</button>`;
  $('#map-detail').classList.add('open');
  $('#map-detail .close').onclick = () => {
    $('#map-detail').classList.remove('open');
    mapSelection.classed('selected', false);
    selectedProvince = null;
  };
  $('#region-details').onclick = () => openRegion(f.properties.name);
}
function openModal(title, html) {
  hideTip();
  if (modalCleanup) {
    modalCleanup();
    modalCleanup = null;
  }
  if (!$('#modal-backdrop').classList.contains('open')) lastFocus = document.activeElement;
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  $('#modal-backdrop').classList.add('open');
  $('#modal-close').focus();
}
function closeModal() {
  if (modalCleanup) {
    modalCleanup();
    modalCleanup = null;
  }
  $('#modal-backdrop').classList.remove('open');
  lastFocus?.focus?.();
}
$('#modal-close').onclick = closeModal;
$('#modal-backdrop').onclick = (e) => {
  if (e.target === $('#modal-backdrop')) closeModal();
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    $('#menu').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#map-detail').classList.remove('open');
    hideTip();
  }
  if (e.key === 'Tab' && $('#modal-backdrop').classList.contains('open')) {
    const list = [
        ...$('#modal-backdrop').querySelectorAll(
          'button:not([disabled]),input,select,[tabindex="0"]',
        ),
      ].filter((x) => x.offsetParent !== null),
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
const summaryStats = (items) =>
  `<div class="modal-stats">${items.map((x) => `<div class="modal-stat"><div class="modal-label">${x[0]}</div><strong>${x[1]} <small>${x[2]}</small></strong></div>`).join('')}</div>`;
function openSummary(type) {
  const isToday = type.startsWith('today');
  const title = type.includes('mileage')
    ? '巡检里程统计'
    : type.includes('vehicles')
      ? '巡检车辆统计'
      : '巡检事件统计';
  const stats = type.includes('mileage')
    ? [
        [isToday ? '今日巡检里程' : '累计巡检里程', isToday ? '211' : '56,797', '公里'],
        ['覆盖区域', 34, '个'],
        ['任务完成率', '98.6', '%'],
      ]
    : type.includes('vehicles')
      ? [
          [isToday ? '今日出勤车辆' : '累计车辆出勤', isToday ? 210 : '56,797', '辆次'],
          ['在线设备', 4083, '台'],
          ['设备在线率', '99.2', '%'],
        ]
      : [
          [isToday ? '今日上报事件' : '累计上报事件', isToday ? 216 : '56,797', '件'],
          ['已处理事件', isToday ? 203 : '54,119', '件'],
          ['处置完成率', isToday ? '94.0' : '95.3', '%'],
        ];
  openModal(
    (isToday ? '今日' : '累计') + title,
    summaryStats(stats) +
      `<div class="modal-label">分区域运营统计 · ${today} · 演示数据</div><table class="modal-table"><thead><tr><th>运营区域</th><th>在线车辆</th><th>今日里程</th><th>今日事件</th><th>状态</th></tr></thead><tbody>${[
        '北京市',
        '广西壮族自治区',
        '四川省',
        '山东省',
        '广东省',
      ]
        .map((name) => {
          const s = provinceStats(realFeatures.find((f) => f.properties.name === name));
          return `<tr><td>${name}</td><td>${s.vehicles} 辆</td><td>${s.mileage} 公里</td><td>${s.events} 件</td><td class="status-working">运行正常</td></tr>`;
        })
        .join('')}</tbody></table>`,
  );
}
function openRecord(kind, index) {
  const e = kind === 'event' ? events[index] : alerts[index];
  openModal(
    kind === 'event' ? '巡检事件详情' : '车辆告警详情',
    `<div class="detail-grid"><div><label>记录编号</label><strong>${e.id}</strong></div><div><label>当前状态</label><strong class="${statusClass(e.status)}">${e.status}</strong></div><div><label>${kind === 'event' ? '事件名称' : '告警类型'}</label><strong>${e.name}</strong></div><div><label>${kind === 'event' ? '发生位置' : '车牌号码'}</label><strong>${e.location || e.plate}</strong></div><div><label>上报时间</label><strong>${today} ${e.time}</strong></div><div><label>事件等级</label><strong>${e.level || '一般'}</strong></div></div><p>${e.description}</p><div class="modal-actions"><button class="small-button" id="back-list">返回列表</button>${e.status !== '已处理' ? '<button class="small-button primary" id="resolve">标记为已处理</button>' : '<span class="demo-indicator">该记录已完成处置</span>'}</div>`,
  );
  $('#back-list').onclick = () => openList(kind === 'event' ? 'events' : 'alerts');
  if ($('#resolve'))
    $('#resolve').onclick = () => {
      e.status = '已处理';
      tableRows();
      openRecord(kind, index);
      toast('演示记录已更新为「已处理」');
    };
}
function openList(kind) {
  const arr = kind === 'alerts' ? alerts : events;
  openModal(
    kind === 'alerts' ? '车辆告警列表' : '事件告警列表',
    `<div class="modal-toolbar"><input id="record-search" placeholder="搜索${kind === 'alerts' ? '车牌、告警类型' : '事件名称、位置'}" aria-label="搜索记录"><select id="record-status" aria-label="筛选处理状态"><option>全部状态</option><option>待处理</option><option>处理中</option><option>已处理</option></select><button class="small-button" id="modal-export">导出CSV</button></div><div id="record-results"></div>`,
  );
  function paint() {
    const query = $('#record-search').value.trim(),
      status = $('#record-status').value;
    const filtered = arr
      .map((e, i) => ({ ...e, index: i }))
      .filter(
        (e) =>
          (status === '全部状态' || e.status === status) &&
          [e.name, e.location, e.plate, e.id, e.type].join(' ').includes(query),
      );
    $('#record-results').innerHTML =
      `<table class="modal-table"><thead><tr><th>${kind === 'alerts' ? '车辆类型' : '事件类型'}</th><th>${kind === 'alerts' ? '车牌号' : '事件名称'}</th><th>上报时间</th><th>处理状态</th><th>操作</th></tr></thead><tbody>${filtered.map((e) => `<tr><td>${e.type}</td><td>${e.plate || e.name}</td><td>${today} ${e.time}</td><td class="${statusClass(e.status)}">${e.status}</td><td><button data-record="${e.index}">查看详情</button></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center">暂无符合条件的记录</td></tr>'}</tbody></table><p class="demo-indicator">共 ${filtered.length} 条记录 · 本地演示数据</p>`;
    $$('[data-record]').forEach(
      (b) =>
        (b.onclick = () => openRecord(kind === 'alerts' ? 'alert' : 'event', +b.dataset.record)),
    );
    $('#modal-export').onclick = () => exportCSV(filtered, kind);
  }
  $('#record-search').oninput = paint;
  $('#record-status').onchange = paint;
  paint();
}
function openCategory(name) {
  const c = categories.find((x) => x.name === name);
  openModal(
    name + ' · 事件分析',
    summaryStats([
      ['累计事件', c.value.toLocaleString(), '件'],
      ['统计占比', c.pct, '%'],
      ['平均处理时长', 18, '分钟'],
    ]) +
      `<p>当前查看「${name}」类巡检事件。选择下方记录可查看详情和处理状态。</p><table class="modal-table"><thead><tr><th>事件名称</th><th>发生位置</th><th>处理状态</th><th>操作</th></tr></thead><tbody>${(events.filter((e) => e.type === name).length ? events.filter((e) => e.type === name) : events.slice(0, 3)).map((e) => `<tr><td>${e.name}</td><td>${e.location}</td><td class="${statusClass(e.status)}">${e.status}</td><td><button data-category-record="${events.indexOf(e)}">查看详情</button></td></tr>`).join('')}</tbody></table>`,
  );
  $$('[data-category-record]').forEach(
    (b) => (b.onclick = () => openRecord('event', +b.dataset.categoryRecord)),
  );
}
function openFleet(name) {
  const f = fleet.find((f) => f.name === name);
  openModal(
    name ? name + ' · 车辆统计' : '全国车辆统计',
    summaryStats(
      name
        ? [
            ['设备总量', f.count, f.unit],
            ['在线率', '99.2', '%'],
            ['今日出勤', Math.round(f.count * 0.91), f.unit],
          ]
        : [
            ['设备总量', 4083, '台'],
            ['设备类型', 6, '类'],
            ['在线率', '99.2', '%'],
          ],
    ) +
      `<table class="modal-table"><thead><tr><th>车辆类型</th><th>设备数量</th><th>今日出勤</th><th>运行状态</th></tr></thead><tbody>${(name ? [f] : fleet).map((f) => `<tr><td>${f.name}</td><td>${f.count} ${f.unit}</td><td>${Math.round(f.count * 0.91)} ${f.unit}</td><td class="status-working">正常运行</td></tr>`).join('')}</tbody></table><div class="modal-actions"><button class="small-button" id="fleet-view-car">查看巡检车辆</button></div>`,
  );
  $('#fleet-view-car').onclick = () => vehicleAction('detail', 0);
}
function openRegion(name) {
  const list = name
    ? [realFeatures.find((f) => f.properties.name === name)]
    : realFeatures.filter((f) =>
        ['北京市', '广西壮族自治区', '四川省', '山东省', '广东省', '浙江省'].includes(
          f.properties.name,
        ),
      );
  openModal(
    name ? name + ' · 运营调度' : '覆盖区域统计',
    `<div class="modal-label">全国巡检运营覆盖 · 本地演示数据</div><table class="modal-table"><thead><tr><th>区域</th><th>站点数量</th><th>在线车辆</th><th>巡检里程</th><th>巡检事件</th></tr></thead><tbody>${list
      .map((f) => {
        const s = provinceStats(f);
        return `<tr><td>${f.properties.name}</td><td>${s.sites}</td><td>${s.vehicles} 辆</td><td>${s.mileage} 公里</td><td>${s.events} 件</td></tr>`;
      })
      .join(
        '',
      )}</tbody></table><div class="modal-actions"><button class="small-button primary" id="region-dispatch">调度巡检车辆</button></div>`,
  );
  $('#region-dispatch').onclick = () =>
    vehicleAction('dispatch', name === '广西壮族自治区' ? 1 : 0);
}
const routeD =
  'M110 240 220 240Q245 240 245 215L245 130Q245 110 270 110H510Q535 110 535 135V225Q535 240 555 240H660';
function routeMarkup() {
  return `<div class="route-scene"><svg viewBox="0 0 800 340" aria-label="巡检路线"><defs><pattern id="city-grid" width="80" height="70" patternUnits="userSpaceOnUse"><path d="M0 0H80V70H0Z" fill="none" stroke="#163f56"/><rect x="14" y="12" width="47" height="44" rx="3" fill="#0b354d" stroke="#1a4c60"/></pattern></defs><rect width="800" height="340" fill="url(#city-grid)"/><path class="road" d="M0 110H800M0 240H800M245 0V340M535 0V340"/><path class="road-center" d="M0 110H800M0 240H800M245 0V340M535 0V340"/><path class="route" id="route-path" d="${routeD}"/><circle cx="110" cy="240" r="6" fill="#11ead8"/><circle cx="660" cy="240" r="6" fill="#ffab49"/><path class="route-car" id="route-car" d="M-8 6 0-11 8 6 0 2Z"/><text x="93" y="268" fill="#94dce2" font-size="11">巡检起点</text><text x="638" y="268" fill="#ffbc78" font-size="11">巡检终点</text></svg><span class="route-legend">${today} · 示意轨迹 / SIMULATION</span></div>`;
}
function vehicleAction(action, index) {
  const v = vehicles[index];
  if (action === 'takeover') {
    v.running = !v.running;
    renderVehicles();
    toast(v.id + (v.running ? ' 已恢复自动巡检' : ' 已暂停巡检'));
    return;
  }
  if (action === 'events') {
    openList('events');
    return;
  }
  if (action === 'route' || action === 'mileage') {
    openModal(
      v.id + ' · 巡检轨迹回放',
      routeMarkup() +
        `<div class="play-controls"><button class="small-button primary" id="route-play">暂停回放</button><input id="route-progress" type="range" min="0" max="100" value="0" aria-label="轨迹回放进度"><span id="route-time" style="font:13px Consolas;color:#68d7e7">00:00</span><select id="route-speed" aria-label="回放速度" style="background:#06233a;color:#9edbef;border:1px solid #19618b;padding:6px"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></div>`,
    );
    const route = $('#route-path'),
      car = $('#route-car'),
      len = route.getTotalLength();
    let progress = 0,
      playing = true;
    function move() {
      const p = route.getPointAtLength((len * progress) / 100),
        next = route.getPointAtLength(Math.min(len, (len * progress) / 100 + 1)),
        angle = (Math.atan2(next.y - p.y, next.x - p.x) * 180) / Math.PI + 90;
      car.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
      $('#route-progress').value = progress;
      $('#route-time').textContent =
        `${pad(Math.floor((progress * 1.8) / 60))}:${pad(Math.floor((progress * 1.8) % 60))}`;
    }
    move();
    const timer = setInterval(() => {
      if (playing) {
        progress += 0.15 * Number($('#route-speed').value);
        if (progress > 100) progress = 0;
        move();
      }
    }, 60);
    modalCleanup = () => clearInterval(timer);
    $('#route-play').onclick = () => {
      playing = !playing;
      $('#route-play').textContent = playing ? '暂停回放' : '继续回放';
    };
    $('#route-progress').oninput = (e) => {
      progress = +e.target.value;
      move();
    };
    return;
  }
  if (action === 'video') {
    openModal(
      v.id + ' · 视频巡检',
      `<div class="video-scene"><div class="video-buildings">${[65, 90, 55, 108, 72, 60, 95, 73, 98, 70].map((h) => `<div class="video-building" style="height:${h}px"></div>`).join('')}</div><div class="video-hud">CAM 01 / FRONT VIEW<br><br>AI DETECTION · ONLINE<span style="position:absolute;bottom:12px;left:12px">${v.id}　${v.speed} km/h　${v.site}</span><span style="position:absolute;bottom:12px;right:12px" id="video-clock"></span></div><div class="video-rec">● 演示画面</div></div><div class="play-controls"><button class="small-button primary" id="video-pause">暂停画面</button><span class="demo-indicator">本地巡检场景演示 · 未连接真实视频源</span></div>`,
    );
    const timer = setInterval(() => {
      $('#video-clock').textContent = new Date().toLocaleTimeString('zh-CN');
    }, 1000);
    modalCleanup = () => clearInterval(timer);
    let playing = true;
    $('#video-pause').onclick = () => {
      playing = !playing;
      $('.video-scene').style.setProperty('animation-play-state', playing ? 'running' : 'paused');
      $('.video-scene').classList.toggle('video-paused', !playing);
      const style =
        $('#video-pause-style') ||
        document.head.appendChild(
          Object.assign(document.createElement('style'), {
            id: 'video-pause-style',
            textContent: '.video-paused:before{animation-play-state:paused}',
          }),
        );
      $('#video-pause').textContent = playing ? '暂停画面' : '继续播放';
    };
    return;
  }
  if (action === 'dispatch') {
    openModal(
      v.id + ' · 远程调度',
      `<div class="detail-grid"><div><label>当前区域</label><strong>${v.site}</strong></div><div><label>剩余电量</label><strong style="color:#ffa84e">${v.battery}%</strong></div></div><label class="modal-label" for="dispatch-target">选择调度任务</label><select id="dispatch-target" style="width:100%;background:#041b2e;border:1px solid #16557a;padding:13px;color:#bce3fa;margin-top:8px"><option value="charge">返回充电站 · 预计 8 分钟</option><option value="inspect">继续区域巡检 · 预计 25 分钟</option><option value="standby">前往待命区 · 预计 5 分钟</option></select><p class="demo-indicator">调度操作仅更新当前页面演示状态。</p><div class="modal-actions"><button class="small-button" id="dispatch-cancel">取消</button><button class="small-button primary" id="dispatch-confirm">下发调度任务</button></div>`,
    );
    $('#dispatch-cancel').onclick = closeModal;
    $('#dispatch-confirm').onclick = () => {
      const val = $('#dispatch-target').value;
      v.running = val === 'inspect';
      v.site =
        val === 'charge'
          ? '正在返回充电站'
          : val === 'standby'
            ? '正在前往待命区'
            : index === 0
              ? '北京亦庄示范区'
              : '南宁青秀试点区';
      renderVehicles();
      closeModal();
      toast(`${v.id} 调度任务已下发（演示）`);
    };
    return;
  }
  openModal(
    v.id + (action === 'battery' ? ' · 电池状态' : ' · 车辆详情'),
    summaryStats(
      action === 'battery'
        ? [
            ['剩余电量', v.battery, '%'],
            ['预计续航', 24, '公里'],
            ['电池温度', 28, '°C'],
          ]
        : [
            ['累计里程', v.mileage, '公里'],
            ['巡检事件', v.total, '件'],
            ['当前车速', v.speed, 'km/h'],
          ],
    ) +
      `<div class="detail-grid"><div><label>车辆类型</label><strong>${v.type}巡检车</strong></div><div><label>设备编号</label><strong>${v.id}</strong></div><div><label>运营区域</label><strong>${v.site}</strong></div><div><label>运行状态</label><strong class="status-working">${v.running ? '自动巡检中' : '已暂停巡检'}</strong></div></div>${action === 'battery' ? '<p>电量已达到返航提醒阈值，可下发返回充电站任务。</p>' : ''}<div class="modal-actions"><button class="small-button" id="car-route">查看轨迹</button><button class="small-button primary" id="car-dispatch">远程调度</button></div>`,
  );
  $('#car-route').onclick = () => vehicleAction('route', index);
  $('#car-dispatch').onclick = () => vehicleAction('dispatch', index);
}
function exportCSV(rows = events, kind = 'events') {
  const isAlert = kind === 'alerts';
  const keys = isAlert
    ? ['id', 'type', 'plate', 'name', 'time', 'status']
    : ['id', 'type', 'name', 'location', 'time', 'status'];
  const heads = isAlert
    ? ['记录编号', '车辆类型', '车牌号', '告警类型', '上报时间', '处理状态']
    : ['记录编号', '事件类型', '事件名称', '发生位置', '上报时间', '处理状态'];
  const csv =
    '\uFEFF' +
    [heads, ...rows.map((e) => keys.map((k) => (k === 'time' ? today + ' ' + e[k] : e[k])))]
      .map((row) => row.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(','))
      .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${isAlert ? '车辆告警' : '巡检事件'}-${today}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('告警数据已导出');
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) {
    if (b.dataset.period) {
      period = +b.dataset.period;
      $$('[data-period]').forEach((x) => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', x === b);
      });
      drawComparison();
    }
    if (b.dataset.summary) openSummary(b.dataset.summary);
    if (b.dataset.category) openCategory(b.dataset.category);
    if (b.dataset.fleet) openFleet(b.dataset.fleet);
    if (b.dataset.region) {
      selectProvince(realFeatures.find((f) => f.properties.name === b.dataset.region));
    }
    if (b.dataset.action) vehicleAction(b.dataset.action, +b.dataset.vehicle);
    if (b.dataset.more) {
      const k = b.dataset.more;
      if (k === 'events' || k === 'alerts') openList(k);
      if (k === 'fleet') openFleet();
      if (k === 'regions') openRegion();
    }
  }
  const row = e.target.closest('[data-event],[data-alert]');
  if (row) {
    if (row.dataset.event !== undefined) openRecord('event', +row.dataset.event);
    else openRecord('alert', +row.dataset.alert);
  }
  if (!e.target.closest('.app-menu,.menu-dropdown')) {
    $('#menu').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-event],[data-alert]')) {
    e.preventDefault();
    e.target.click();
  }
});
$('#menu-toggle').onclick = () => {
  const open = $('#menu').classList.toggle('open');
  $('#menu-toggle').setAttribute('aria-expanded', open);
};
$('#fullscreen').onclick = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else await document.exitFullscreen();
  } catch {
    toast('当前窗口不支持全屏，可使用浏览器全屏功能');
  }
};
$('#refresh').onclick = () => {
  refreshCount++;
  drawComparison();
  const vals = [216 + refreshCount * 3, 211 + refreshCount * 2, 210 + refreshCount];
  ['events', 'mileage', 'vehicles'].forEach((k, i) => {
    $$(`#kpi-${k} .digit`).forEach((d, j) => (d.textContent = String(vals[i]).padStart(3, '0')[j]));
  });
  toast('演示数据已刷新 · ' + new Date().toLocaleTimeString('zh-CN'));
};
$('#export').onclick = () => exportCSV();
$('#about').onclick = () =>
  openModal(
    'AI智能巡检运营调度平台',
    `<p>全国巡检运营可视化大屏，将巡检里程、事件、设备和区域运营信息集中呈现。</p><div class="detail-grid"><div><label>运行模式</label><strong>离线交互演示</strong></div><div><label>交互能力</label><strong>区域查询 · 告警处置 · 车辆调度</strong></div></div><p class="demo-indicator">所有业务数据及天气均为演示数据，操作仅作用于当前页面。地图边界与阴影地形来自 Natural Earth 公共领域数据，允许商用、修改及再分发；资源随页面打包。</p>`,
  );
window.dashboard = {
  events,
  alerts,
  vehicles,
  get period() {
    return period;
  },
  get selectedProvince() {
    return selectedProvince?.properties.name;
  },
  openList,
};
