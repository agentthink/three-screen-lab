const P = (s) => document.querySelector(s),
  PA = (s) => [...document.querySelectorAll(s)];
const pEsc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const pIcon = (n) => `<svg class="p-icon" aria-hidden="true"><use href="#p-${n}"/></svg>`;
const pReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pScale = 1,
  pYear = 2022,
  regionSelected = 2,
  ageSelected = 2,
  pMode = 'flow',
  pPaused = pReduced,
  pToastTimer,
  pLastFocus = null;
const pSeries = { population: true, growth: true };
const pGender = [
  { year: 2022, value: 105.11 },
  { year: 2021, value: 89.31 },
  { year: 2020, value: 79.23 },
  { year: 2019, value: 98.21 },
];
const pHouseholds = [
  { name: '家庭户总数', value: 40.11, unit: '万户', ratio: 46 },
  { name: '集体户总数', value: 50.11, unit: '万户', ratio: 61 },
  { name: '家庭户人口', value: 73.21, unit: '万人', ratio: 45 },
  { name: '集体户人口', value: 81.12, unit: '万人', ratio: 56 },
];
const pRegions = [
  { name: '东部地区', value: 20, color: '#9d9b70', short: '东部' },
  { name: '东北地区', value: 23, color: '#739ba9', short: '东北' },
  { name: '西部地区', value: 23, color: '#8694b4', short: '西部' },
  { name: '中部地区', value: 34, color: '#6d9da7', short: '中部' },
];
const pComposition = [
  { name: '汉族人口', value: 6217, icon: 'ethnic' },
  { name: '少数民族', value: 2517, icon: 'diamond' },
  { name: '城镇人口', value: 8517, icon: 'city' },
  { name: '农村人口', value: 9517, icon: 'village' },
];
const pHistory = [
  { year: 1963, population: 79, growth: 1.6 },
  { year: 1964, population: 132, growth: 2.1 },
  { year: 1982, population: 194, growth: 1.5 },
  { year: 1990, population: 186, growth: 1.0 },
  { year: 2000, population: 231, growth: 0.55 },
  { year: 2010, population: 270, growth: 0.8 },
  { year: 2020, population: 292, growth: 0.3 },
];
const pAges = [
  { name: '20岁以下', value: 90 },
  { name: '21-40', value: 70 },
  { name: '41-60', value: 200 },
  { name: '61-80', value: 50 },
  { name: '81岁以上', value: 40 },
];
const pPopulation = {
  北京市: 2189,
  天津市: 1387,
  河北省: 7461,
  山西省: 3491,
  内蒙古自治区: 2405,
  辽宁省: 4259,
  吉林省: 2407,
  黑龙江省: 3185,
  上海市: 2487,
  江苏省: 8475,
  浙江省: 6457,
  安徽省: 6103,
  福建省: 4154,
  江西省: 4519,
  山东省: 10152,
  河南省: 9937,
  湖北省: 5775,
  湖南省: 6644,
  广东省: 12601,
  广西壮族自治区: 5013,
  海南省: 1008,
  重庆市: 3205,
  四川省: 8367,
  贵州省: 3856,
  云南省: 4721,
  西藏自治区: 365,
  陕西省: 3953,
  甘肃省: 2502,
  青海省: 592,
  宁夏回族自治区: 720,
  新疆维吾尔自治区: 2585,
  台湾省: 2356,
  香港特别行政区: 747,
  澳门特别行政区: 68,
};
const pRegionMembers = [
  [
    '北京市',
    '天津市',
    '河北省',
    '上海市',
    '江苏省',
    '浙江省',
    '福建省',
    '山东省',
    '广东省',
    '海南省',
  ],
  ['辽宁省', '吉林省', '黑龙江省'],
  [
    '内蒙古自治区',
    '广西壮族自治区',
    '重庆市',
    '四川省',
    '贵州省',
    '云南省',
    '西藏自治区',
    '陕西省',
    '甘肃省',
    '青海省',
    '宁夏回族自治区',
    '新疆维吾尔自治区',
  ],
  ['山西省', '安徽省', '江西省', '河南省', '湖北省', '湖南省'],
];
const pProvinceFeatures = POPULATION_CHINA.features.filter((f) => f.properties.name);
function pFit() {
  pScale = Math.min(innerWidth / 2160, innerHeight / 1200);
  P('#population-screen').style.transform = `scale(${pScale})`;
}
addEventListener('resize', pFit);
pFit();
const pClockStart = performance.now();
function pTick() {
  let s = 23 * 3600 + 23 * 60 + 52 + Math.floor((performance.now() - pClockStart) / 1000);
  const h = String(Math.floor(s / 3600) % 24).padStart(2, '0'),
    m = String(Math.floor(s / 60) % 60).padStart(2, '0'),
    sec = String(s % 60).padStart(2, '0');
  P('#population-clock').textContent = `${h}:${m}:${sec}`;
}
pTick();
setInterval(pTick, 1000);
function pTip(event, html) {
  const tip = P('#population-tooltip');
  tip.innerHTML = html;
  tip.style.display = 'block';
  const r = P('#population-screen').getBoundingClientRect();
  let x = (event.clientX - r.left) / pScale + 20,
    y = (event.clientY - r.top) / pScale + 17;
  tip.style.left = Math.max(15, Math.min(x, 2160 - tip.offsetWidth - 20)) + 'px';
  tip.style.top = Math.max(15, Math.min(y, 1200 - tip.offsetHeight - 20)) + 'px';
}
function pHideTip() {
  P('#population-tooltip').style.display = 'none';
}
function pToast(text) {
  P('#population-toast').textContent = text;
  P('#population-toast').classList.add('visible');
  clearTimeout(pToastTimer);
  pToastTimer = setTimeout(() => P('#population-toast').classList.remove('visible'), 3000);
}
function pChart(id) {
  const s = d3.select(id);
  s.selectAll('*').remove();
  return s;
}
function pGradient(svg, id, colors) {
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
  const g = defs.append('linearGradient').attr('id', id).attr('x2', '0').attr('y2', '1');
  colors.forEach(([o, c, a = 1]) =>
    g.append('stop').attr('offset', o).attr('stop-color', c).attr('stop-opacity', a),
  );
  return `url(#${id})`;
}
function drawGender() {
  const svg = pChart('#gender-chart');
  pGender.forEach((d, i) => {
    const y = 24 + i * 35;
    svg
      .append('text')
      .attr('x', 21)
      .attr('y', y + 4)
      .attr('font-size', 16)
      .attr('fill', '#a2b8ca')
      .text(d.year);
    svg
      .append('rect')
      .attr('x', 70)
      .attr('y', y - 2)
      .attr('height', 4)
      .attr('width', 310)
      .attr('fill', '#b7cbdb17');
    const male = 100 + (d.value - 90) * 2.2;
    svg
      .append('rect')
      .attr('x', 70)
      .attr('y', y - 2)
      .attr('height', 4)
      .attr('width', male)
      .attr(
        'fill',
        pGradient(svg, `gender-male-${i}`, [
          [0, '#bddfeb'],
          [1, '#628a9f'],
        ]),
      );
    svg
      .append('rect')
      .attr('x', 70 + male + 13)
      .attr('y', y - 2)
      .attr('height', 4)
      .attr('width', Math.max(40, 296 - male))
      .attr(
        'fill',
        pGradient(svg, `gender-female-${i}`, [
          [0, '#e6e5bd'],
          [1, '#8e9180'],
        ]),
      );
    svg
      .append('text')
      .attr('x', 386)
      .attr('y', y + 5)
      .attr('fill', '#e5eef8')
      .attr('font-size', 17)
      .attr('font-family', 'DIN Alternate,Arial')
      .attr('letter-spacing', 1)
      .text(d.value.toFixed(2));
    svg
      .append('rect')
      .attr('class', 'chart-hit')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', `查看${d.year}年性别比`)
      .attr('x', 15)
      .attr('y', y - 15)
      .attr('width', 441)
      .attr('height', 31)
      .on('pointermove', (e) =>
        pTip(
          e,
          `<strong>${d.year}年 · 总人口性别比</strong><div class="tip-line"><span>女性基准</span><b>100</b></div><div class="tip-line"><span>男性相对比例</span><b>${d.value.toFixed(2)}</b></div>`,
        ),
      )
      .on('pointerleave', pHideTip)
      .on('click', () => pDetail('gender', d.year))
      .on('keydown', (e) => {
        if (e.key === 'Enter') pDetail('gender', d.year);
      });
  });
}
drawGender();
P('#household-rows').innerHTML = pHouseholds
  .map(
    (d, i) =>
      `<button class="household-row" data-household="${i}"><i class="household-diamond"></i><span class="household-name">${d.name}</span><span class="household-track"><i style="--value:${d.ratio}%"></i></span><span class="household-bracket"></span><span class="household-value">${d.value.toFixed(2)}<small>${d.unit}</small></span></button>`,
  )
  .join('');
function drawRegions() {
  const svg = pChart('#region-chart'),
    g = svg.append('g').attr('transform', 'translate(138 131)');
  const pie = d3
      .pie()
      .sort(null)
      .value((d) => d.value)
      .startAngle(-Math.PI * 1.09)
      .endAngle(Math.PI * 0.91),
    arc = d3.arc().innerRadius(51).outerRadius(93).padAngle(0.025);
  const arcs = pie(pRegions);
  g.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (d, i) => (i === regionSelected ? '#487eaa' : d.data.color))
    .attr('opacity', (d, i) => (i === regionSelected ? 1 : 0.55))
    .style('cursor', 'pointer')
    .on('pointermove', (e, d) =>
      pTip(
        e,
        `<strong>${d.data.name}</strong><div class="tip-line"><span>人口分布占比</span><b>${d.data.value}%</b></div><div class="tip-subtle">点击联动地球区域高亮</div>`,
      ),
    )
    .on('pointerleave', pHideTip)
    .on('click', (e, d) => selectRegion(pRegions.indexOf(d.data)));
  arcs.forEach((d, i) => {
    const a = (d.startAngle + d.endAngle) / 2,
      p = [Math.sin(a) * 73, -Math.cos(a) * 73];
    g.append('text')
      .attr(
        'transform',
        `translate(${p}) rotate(${(a * 180) / Math.PI > 90 && (a * 180) / Math.PI < 270 ? (a * 180) / Math.PI - 180 : (a * 180) / Math.PI})`,
      )
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('fill', i === regionSelected ? '#dff4ff' : '#d1d8cf')
      .attr('dominant-baseline', 'middle')
      .attr('letter-spacing', 1)
      .text(d.data.name);
  });
  g.append('circle')
    .attr('r', 39)
    .attr('fill', '#0d1c2d8c')
    .attr('stroke', '#8bc9ee3a')
    .attr('stroke-width', 1);
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 6)
    .attr('font-family', 'DIN Alternate,Arial')
    .attr('font-style', 'italic')
    .attr('font-weight', 700)
    .attr('font-size', 26)
    .attr('fill', '#e6f5ff')
    .text(pRegions[regionSelected].value + '%');
  P('#region-legend').innerHTML = pRegions
    .map(
      (r, i) =>
        `<button data-region="${i}" aria-pressed="${i === regionSelected}"><i style="--region-color:${r.color}"></i><span>${r.name}</span><strong>${r.value} %</strong></button>`,
    )
    .join('');
}
drawRegions();
function selectRegion(i) {
  regionSelected = i;
  drawRegions();
  window.populationGlobe?.highlightRegion(pRegionMembers[i]);
  pToast(`${pRegions[i].name} · 人口占比 ${pRegions[i].value}%`);
}
P('#composition-grid').innerHTML = pComposition
  .map(
    (d, i) =>
      `<button class="composition-card" data-composition="${i}"><span class="composition-orb">${pIcon(d.icon)}</span><span class="composition-copy"><label>${d.name}</label><strong>${d.value}<small>万人</small></strong></span></button>`,
  )
  .join('');
function drawHistory() {
  const svg = pChart('#history-chart'),
    x = d3
      .scalePoint()
      .domain(pHistory.map((d) => d.year))
      .range([65, 391]),
    y = d3.scaleLinear().domain([0, 350]).range([158, 27]),
    rate = d3.scaleLinear().domain([0, 3]).range([158, 27]);
  const fill = pGradient(svg, 'history-bars', [
    [0, '#95cbdc', 0.9],
    [1, '#7392a4', 0.17],
  ]);
  [0, 88, 175, 263, 350].forEach((v) => {
    svg
      .append('line')
      .attr('class', 'grid')
      .attr('x1', 43)
      .attr('x2', 414)
      .attr('y1', y(v))
      .attr('y2', y(v));
    svg
      .append('text')
      .attr('x', 37)
      .attr('y', y(v) + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', 12)
      .text(v);
  });
  svg.append('text').attr('x', 32).attr('y', 14).attr('font-size', 12).text('万人');
  svg.append('text').attr('x', 438).attr('y', 14).attr('font-size', 12).text('%');
  [0, 0.75, 1.5, 2.25, 3].forEach((v) =>
    svg
      .append('text')
      .attr('x', 438)
      .attr('y', rate(v) + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text(v),
  );
  if (pSeries.population)
    svg
      .selectAll('.history-bar')
      .data(pHistory)
      .join('rect')
      .attr('class', 'history-bar')
      .attr('x', (d) => x(d.year) - 6)
      .attr('y', (d) => y(d.population))
      .attr('height', (d) => 158 - y(d.population))
      .attr('width', 12)
      .attr('fill', fill);
  if (pSeries.growth)
    svg
      .append('path')
      .attr(
        'd',
        d3
          .line()
          .x((d) => x(d.year))
          .y((d) => rate(d.growth))(pHistory),
      )
      .attr('fill', 'none')
      .attr('stroke', '#dddcc0')
      .attr('stroke-width', 1.4);
  svg
    .append('line')
    .attr('x1', 43)
    .attr('x2', 415)
    .attr('y1', 158)
    .attr('y2', 158)
    .attr('stroke', '#9eb8c54d');
  pHistory.forEach((d) => {
    svg
      .append('text')
      .attr('x', x(d.year))
      .attr('y', 181)
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')
      .text(d.year);
    svg
      .append('rect')
      .attr('class', 'chart-hit')
      .attr('x', x(d.year) - 23)
      .attr('y', 24)
      .attr('width', 46)
      .attr('height', 137)
      .on('pointermove', (e) =>
        pTip(
          e,
          `<strong>${d.year}年 · 人口总览</strong>${pSeries.population ? `<div class="tip-line"><span>总人口</span><b>${d.population} 万人</b></div>` : ''}${pSeries.growth ? `<div class="tip-line"><span>年增长率</span><b>${d.growth}%</b></div>` : ''}`,
        ),
      )
      .on('pointerleave', pHideTip)
      .on('click', () => pDetail('history', d.year));
  });
}
drawHistory();
function drawAges() {
  const svg = pChart('#age-chart'),
    x = [50, 144, 240, 335, 430],
    y = [107, 119, 53, 126, 130];
  x.forEach((xx, i) =>
    svg
      .append('rect')
      .attr('x', xx - 24)
      .attr('y', 18)
      .attr('width', 48)
      .attr('height', 193)
      .attr('fill', i % 2 === 0 ? '#9bb3c408' : '#91a4bd04'),
  );
  svg
    .append('path')
    .attr('d', d3.line()(x.map((v, i) => [v, y[i]])))
    .attr('fill', 'none')
    .attr('stroke', '#abbec69c')
    .attr('stroke-width', 1.4);
  pAges.forEach((d, i) => {
    const selected = i === ageSelected;
    svg
      .append('circle')
      .attr('cx', x[i])
      .attr('cy', y[i])
      .attr('r', selected ? 22 : 13)
      .attr('fill', selected ? '#e9e5b408' : '#b2d8ed02')
      .attr('stroke', selected ? '#dfdcad' : '#a8d3e1')
      .attr('stroke-opacity', selected ? 0.72 : 0.6)
      .attr('stroke-width', 1.6);
    svg
      .append('circle')
      .attr('cx', x[i])
      .attr('cy', y[i])
      .attr('r', selected ? 5 : 2.5)
      .attr('fill', selected ? '#f6f0b9' : '#bbddeb')
      .attr('style', selected ? 'filter:drop-shadow(0 0 8px #faf5c0)' : '');
    svg
      .append('text')
      .attr('x', x[i])
      .attr('y', selected ? y[i] + 59 : y[i] - 27)
      .attr('text-anchor', 'middle')
      .attr('font-size', selected ? 18 : 16)
      .attr('fill', selected ? '#f0ecc8' : '#d0e0ed')
      .attr('font-family', 'DIN Alternate,Arial')
      .attr('font-weight', selected ? 600 : 400)
      .text(d.value);
    svg
      .append('text')
      .attr('x', x[i] + (selected ? 21 : 13))
      .attr('y', selected ? y[i] + 59 : y[i] - 27)
      .attr('text-anchor', 'start')
      .attr('font-size', 12)
      .attr('fill', selected ? '#dddcb8' : '#a0b5c6')
      .text('万人');
    svg
      .append('text')
      .attr('x', x[i])
      .attr('y', 198)
      .attr('text-anchor', 'middle')
      .attr('font-size', 13)
      .attr('fill', '#c2d2df')
      .text(d.name);
    svg
      .append('circle')
      .attr('class', 'chart-hit')
      .attr('cx', x[i])
      .attr('cy', y[i])
      .attr('r', 32)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', `查看${d.name}人口${d.value}万人`)
      .on('pointermove', (e) =>
        pTip(
          e,
          `<strong>${d.name} · 年龄构成</strong><div class="tip-line"><span>人口数量</span><b>${d.value} 万人</b></div><div class="tip-line"><span>年龄组占比</span><b>${((d.value / d3.sum(pAges, (a) => a.value)) * 100).toFixed(1)}%</b></div>`,
        ),
      )
      .on('pointerleave', pHideTip)
      .on('click', () => {
        ageSelected = i;
        drawAges();
        pDetail('age', i);
      })
      .on('keydown', (e) => {
        if (e.key === 'Enter') {
          ageSelected = i;
          drawAges();
          pDetail('age', i);
        }
      });
  });
}
drawAges();
function pDialog(title, html) {
  pHideTip();
  if (!P('#p-dialog-backdrop').classList.contains('open')) pLastFocus = document.activeElement;
  P('#p-dialog-title').textContent = title;
  P('#p-dialog-body').innerHTML = html;
  P('#p-dialog-backdrop').classList.add('open');
  P('#p-dialog-close').focus();
}
function closePDialog() {
  P('#p-dialog-backdrop').classList.remove('open');
  pLastFocus?.focus?.();
}
const pStats = (items) =>
  `<div class="p-stats">${items.map((s) => `<div class="p-stat"><label>${s[0]}</label><strong>${s[1]}<small>${s[2]}</small></strong></div>`).join('')}</div>`;
const pNote =
  '<p class="p-dialog-note">可视化展示数据，用于本地交互演示；不作为官方人口统计依据。</p>';
function pDetail(kind, selected) {
  const title = {
    gender: '性别构成',
    household: '户别人口',
    region: '地区分布',
    composition: '民族 / 城乡分布',
    history: '历年人口总览',
    age: '年龄构成',
  }[kind];
  let html = '';
  if (kind === 'gender') {
    const year = selected || pYear;
    html =
      pStats([
        ['男性人口', '19,517', '万人'],
        ['女性人口', '17,234', '万人'],
        [`${year}年性别比`, (pGender.find((d) => d.year === year)?.value || 105.11).toFixed(2), ''],
      ]) +
      `<table class="p-table"><thead><tr><th>统计年份</th><th>性别比（女性=100）</th><th>统计口径</th></tr></thead><tbody>${pGender.map((d) => `<tr><td>${d.year}</td><td>${d.value.toFixed(2)}</td><td>总人口性别比</td></tr>`).join('')}</tbody></table>`;
  } else if (kind === 'household') {
    html =
      pStats([
        ['家庭户总数', '40.11', '万户'],
        ['集体户总数', '50.11', '万户'],
        ['家庭户人口', '73.21', '万人'],
      ]) +
      `<table class="p-table"><thead><tr><th>户别统计项目</th><th>统计值</th><th>单位</th></tr></thead><tbody>${pHouseholds.map((d) => `<tr><td>${d.name}</td><td>${d.value.toFixed(2)}</td><td>${d.unit}</td></tr>`).join('')}</tbody></table>`;
  } else if (kind === 'region') {
    html =
      pStats([
        ['当前选择', pRegions[regionSelected].name, ''],
        ['人口占比', pRegions[regionSelected].value, '%'],
        ['覆盖省级地区', pRegionMembers[regionSelected].length, '个'],
      ]) +
      `<table class="p-table"><thead><tr><th>地区</th><th>人口分布占比</th><th>地图操作</th></tr></thead><tbody>${pRegions.map((d, i) => `<tr><td>${d.name}</td><td>${d.value}%</td><td><button data-select-region="${i}">高亮区域</button></td></tr>`).join('')}</tbody></table>`;
  } else if (kind === 'composition') {
    const d = pComposition[Number.isInteger(selected) ? selected : 0];
    html =
      pStats([
        ['当前统计项目', d.name, ''],
        ['人口数量', d.value, '万人'],
        ['分类数量', 4, '项'],
      ]) +
      `<table class="p-table"><thead><tr><th>统计类别</th><th>人口数量</th><th>单位</th></tr></thead><tbody>${pComposition.map((d) => `<tr><td>${d.name}</td><td>${d.value}</td><td>万人</td></tr>`).join('')}</tbody></table>`;
  } else if (kind === 'history') {
    const d = pHistory.find((d) => d.year === selected) || pHistory[pHistory.length - 1];
    html =
      pStats([
        ['统计年份', d.year, '年'],
        ['总人口', d.population, '万人'],
        ['年增长率', d.growth, '%'],
      ]) +
      `<table class="p-table"><thead><tr><th>年份</th><th>总人口(万人)</th><th>年增长率</th></tr></thead><tbody>${pHistory.map((d) => `<tr><td>${d.year}</td><td>${d.population}</td><td>${d.growth}%</td></tr>`).join('')}</tbody></table>`;
  } else if (kind === 'age') {
    const d = pAges[Number.isInteger(selected) ? selected : ageSelected];
    html =
      pStats([
        ['年龄组', d.name, ''],
        ['人口数量', d.value, '万人'],
        ['年龄组占比', ((d.value / d3.sum(pAges, (d) => d.value)) * 100).toFixed(1), '%'],
      ]) +
      `<table class="p-table"><thead><tr><th>年龄组</th><th>人口数量(万人)</th><th>结构占比</th></tr></thead><tbody>${pAges.map((d) => `<tr><td>${d.name}</td><td>${d.value}</td><td>${((d.value / d3.sum(pAges, (d) => d.value)) * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`;
  }
  pDialog(title + ' · ' + pYear, html + pNote);
  PA('[data-select-region]').forEach(
    (b) =>
      (b.onclick = () => {
        selectRegion(+b.dataset.selectRegion);
        closePDialog();
      }),
  );
}
function showProvince(name, focus = false) {
  const feature = pProvinceFeatures.find((f) => f.properties.name === name);
  if (!feature) return;
  window.populationGlobe?.setSelected(name);
  if (focus)
    window.populationGlobe?.focusProvince(feature.properties.center || feature.properties.centroid);
  const pop = pPopulation[name] || 0;
  const urban = 55 + ((Number(feature.properties.adcode) / 10000) % 31);
  P('#province-card').innerHTML =
    `<button class="card-close" id="close-province-card" aria-label="关闭省份详情">×</button><h3>${name}</h3><p><span>常住人口</span><b>${pop.toLocaleString()} 万</b></p><p><span>城镇化率</span><b>${urban.toFixed(1)}%</b></p><p><span>统计年份</span><b>${pYear}</b></p><button class="p-button" id="province-detail-button">查看人口结构</button>`;
  P('#province-card').classList.add('open');
  P('#close-province-card').onclick = () => {
    P('#province-card').classList.remove('open');
    window.populationGlobe?.setSelected(null);
  };
  P('#province-detail-button').onclick = () => {
    pDialog(
      name + ' · 人口结构',
      pStats([
        ['常住人口', pop.toLocaleString(), '万人'],
        ['城镇化率', urban.toFixed(1), '%'],
        ['统计年份', pYear, '年'],
      ]) +
        `<div class="p-detail-grid"><div><label>男性人口（演示）</label><strong>${Math.round(pop * 0.512).toLocaleString()} 万人</strong></div><div><label>女性人口（演示）</label><strong>${Math.round(pop * 0.488).toLocaleString()} 万人</strong></div><div><label>城镇人口（演示）</label><strong>${Math.round((pop * urban) / 100).toLocaleString()} 万人</strong></div><div><label>农村人口（演示）</label><strong>${Math.round(pop * (1 - urban / 100)).toLocaleString()} 万人</strong></div></div>` +
        pNote,
    );
  };
  renderProvinceList();
}
function renderProvinceList() {
  const query = P('#province-search').value.trim();
  const selected = P('#province-card h3')?.textContent;
  const rows = pProvinceFeatures
    .filter((f) => f.properties.name.includes(query))
    .sort((a, b) => (pPopulation[b.properties.name] || 0) - (pPopulation[a.properties.name] || 0));
  P('#province-list').innerHTML =
    rows
      .map(
        (f) =>
          `<button data-province="${f.properties.name}" class="${f.properties.name === selected ? 'selected' : ''}"><span>${f.properties.name}</span><strong>${(pPopulation[f.properties.name] || 0).toLocaleString()}<small>万人</small></strong></button>`,
      )
      .join('') || '<p class="p-dialog-note">没有符合条件的省份</p>';
}
renderProvinceList();
P('#province-search').oninput = renderProvinceList;
function setMapMode(mode) {
  pMode = mode;
  PA('[data-map-mode]').forEach((b) => {
    const active = b.dataset.mapMode === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active);
  });
  P('#province-drawer').classList.toggle('open', mode === 'provinces');
  P('#map-legend').hidden = mode !== 'distribution';
  window.populationGlobe?.setMode(mode);
  if (mode === 'provinces') P('#province-search').focus();
}
function pExport() {
  const rows = pProvinceFeatures.map((f) => [
    f.properties.name,
    pPopulation[f.properties.name] || 0,
    pYear,
  ]);
  const csv =
    '\uFEFF' +
    [['省级地区', '常住人口(万人)', '展示年份'], ...rows]
      .map((row) => row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(','))
      .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `全国人口统计-${pYear}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  pToast('省份人口数据已导出');
}
function showYearPicker() {
  pDialog(
    '统计年份与显示设置',
    `<div class="p-form-row"><label>统计年份<select id="stat-year">${[2022, 2021, 2020, 2019].map((y) => `<option ${pYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select></label><label>地球视觉模式<select id="stat-mode"><option value="flow" ${pMode === 'flow' ? 'selected' : ''}>人口流动</option><option value="distribution" ${pMode === 'distribution' ? 'selected' : ''}>人口分布</option><option value="provinces" ${pMode === 'provinces' ? 'selected' : ''}>各省数据</option></select></label></div><div class="p-detail-grid"><div><label>地球交互</label><strong>拖动旋转 / 滚轮缩放</strong></div><div><label>图表交互</label><strong>悬浮提示 / 点击展开</strong></div></div><div class="p-dialog-actions"><button class="p-button" id="about-population">项目说明</button><button class="p-button primary" id="apply-stat-settings">应用设置</button></div>` +
      pNote,
  );
  P('#apply-stat-settings').onclick = () => {
    pYear = +P('#stat-year').value;
    P('#population-date').textContent = `${pYear}.05.10`;
    const mode = P('#stat-mode').value;
    setMapMode(mode);
    closePDialog();
    pToast(`已切换至 ${pYear} 年展示视图`);
  };
  P('#about-population').onclick = () =>
    pDialog(
      '全国人口统计总览',
      `<div class="p-detail-grid"><div><label>地球引擎</label><strong>WebGL 实时球体与地理几何</strong></div><div><label>地图来源</label><strong>Natural Earth 公共领域数据</strong></div><div><label>画面组成</label><strong>地球纹理 / 抬升地图 / 大气辉光</strong></div><div><label>数据交互</label><strong>统计面板 / 迁徙流线 / 省份查询</strong></div></div><p class="p-dialog-note">地球与中国地图为可拖动的实际几何体，图表及文字为可编辑页面元素。所有数据仅用于视觉展示，不代表官方统计；图像与脚本已内嵌。</p>`,
    );
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.detail) pDetail(b.dataset.detail);
  if (b.dataset.gender) pDetail('gender');
  if (b.dataset.household !== undefined) pDetail('household', +b.dataset.household);
  if (b.dataset.region !== undefined) selectRegion(+b.dataset.region);
  if (b.dataset.composition !== undefined) pDetail('composition', +b.dataset.composition);
  if (b.dataset.mapMode) setMapMode(b.dataset.mapMode);
  if (b.dataset.province) showProvince(b.dataset.province, true);
  if (b.dataset.historySeries) {
    const key = b.dataset.historySeries;
    if (pSeries[key] && Object.values(pSeries).filter(Boolean).length === 1) {
      pToast('至少保留一组统计系列');
      return;
    }
    pSeries[key] = !pSeries[key];
    b.setAttribute('aria-pressed', pSeries[key]);
    drawHistory();
  }
});
P('#p-dialog-close').onclick = closePDialog;
P('#p-dialog-backdrop').onclick = (e) => {
  if (e.target === P('#p-dialog-backdrop')) closePDialog();
};
P('#date-picker').onclick = showYearPicker;
P('#population-title').onclick = showYearPicker;
P('#province-export').onclick = pExport;
P('#close-drawer').onclick = () => setMapMode('flow');
P('#animation-toggle').onclick = () => {
  pPaused = !pPaused;
  P('#animation-toggle').setAttribute('aria-pressed', pPaused);
  P('#animation-toggle').setAttribute('aria-label', pPaused ? '恢复地球光效' : '暂停地球光效');
  window.populationGlobe?.setPaused(pPaused);
  pToast(pPaused ? '动态光效已暂停' : '动态光效已恢复');
};
P('#population-fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    pToast('可使用浏览器全屏功能观看');
  }
};
P('#reset-globe').onclick = () => {
  window.populationGlobe?.reset();
  P('#province-card').classList.remove('open');
  P('#province-drawer').classList.remove('open');
  if (pMode === 'provinces') setMapMode('flow');
  pToast('地球视角已复位');
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePDialog();
    P('#province-card').classList.remove('open');
    if (pMode === 'provinces') setMapMode('flow');
    pHideTip();
  }
  if (e.key === 'Tab' && P('#p-dialog-backdrop').classList.contains('open')) {
    const list = PA(
        '#p-dialog-backdrop button,#p-dialog-backdrop input,#p-dialog-backdrop select',
      ).filter((x) => x.offsetParent !== null),
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
function drawStars() {
  const c = P('#space-stars'),
    ctx = c.getContext('2d');
  c.width = 2160;
  c.height = 1200;
  let seed = 7123;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 135; i++) {
    const x = rand() * 2160,
      y = rand() * 1200,
      r = rand() * 2.2 + 0.3;
    ctx.fillStyle = `rgba(164,206,227,${rand() * 0.23 + 0.03})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 21; i++) {
    const x = 1100 + rand() * 1030,
      y = 95 + rand() * 1060,
      s = rand() > 0.84 ? 9 : 3;
    ctx.shadowColor = '#91f4ff';
    ctx.shadowBlur = s > 5 ? 14 : 3;
    ctx.fillStyle = s > 5 ? '#92e6e5a8' : '#addef35e';
    ctx.fillRect(x, y, s, s);
  }
  ctx.shadowBlur = 0;
}
drawStars();
window.populationDashboard = {
  showProvince,
  setMapMode,
  pDetail,
  get mode() {
    return pMode;
  },
  get year() {
    return pYear;
  },
  get region() {
    return regionSelected;
  },
  get paused() {
    return pPaused;
  },
};
