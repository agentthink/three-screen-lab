/* SPDX-License-Identifier: MIT */
(() => {
  const H = ObservatoryDashboard.helpers;
  const task = (title, note, done = true) =>
    '<div class="ob-task">' +
    H.icon(done ? 'check' : 'target') +
    '<div><strong>' +
    title +
    '</strong><p>' +
    note +
    '</p></div><span>' +
    (done ? '已完成' : '待执行') +
    '</span></div>';
  const left =
    H.panel(
      '农场空间概况',
      '01 / FARMLAND',
      '<div class="ob-summary"><div><span class="ob-eyebrow">长三角生态农业示范基地</span><h3>崇明 · 未来农场</h3><p>设施种植与大田轮作，共生生长</p></div><div class="ob-seal">' +
        H.icon('leaf') +
        '</div></div>' +
        H.facts([
          ['种植地块', '32', '块'],
          ['作物品种', '12', '种'],
          ['绿色认证', '100', '%'],
        ]) +
        '<p class="ob-note"><i class="ob-led"></i>当前生长季<strong>第 128 天</strong></p>',
      'leaf',
    ) +
    H.panel(
      '作物生长监测',
      '02 / CROP HEALTH',
      '<div class="ob-health">' +
        H.ring(96.8, '健康作物占比') +
        '<div class="ob-health-copy"><span class="ob-pill">长势优良</span><small>较上周提升</small><strong class="ob-num">2.6<em> % ↗</em></strong></div></div>' +
        H.bars([
          ['优良', 86.4, '86.4%'],
          ['正常', 10.4, '10.4%', '#6eaa90'],
          ['待关注', 3.2, '3.2%', '#c0a66b'],
        ]),
      'leaf',
    ) +
    H.panel(
      '智慧水肥管理',
      '03 / IRRIGATION',
      '<span class="ob-eyebrow">今日精准灌溉用水</span><div class="ob-large"><strong class="ob-num" data-bind="water">1,248.2</strong><small>m³</small><span>↓ 18.6%</span></div>' +
        H.bars([
          ['水资源利用率', 92.6],
          ['肥料精准配比', 98.2],
        ]) +
        '<button class="ob-action" id="irrigation-action" data-action="irrigation">' +
        H.icon('water') +
        '<span data-bind="irrigation-label">模拟 A01 精准灌溉</span>' +
        H.icon('arrow') +
        '</button>',
      'water',
    );
  const climate = [
    ['空气温度', '24.6', '°C', 'sun'],
    ['空气湿度', '68.2', '%', 'water'],
    ['光照强度', '28,640', 'lux', 'sun'],
    ['风速', '2.4', 'm/s', 'wind'],
  ]
    .map(
      ([label, value, unit, glyph]) =>
        '<div class="ob-climate-item"><span>' +
        label +
        '</span><strong class="ob-num">' +
        value +
        '<small>' +
        unit +
        '</small></strong>' +
        H.icon(glyph) +
        '</div>',
    )
    .join('');
  const right =
    H.panel(
      '田间微气候',
      '04 / CLIMATE',
      '<div class="ob-climate">' +
        climate +
        '</div><p class="ob-note"><i class="ob-led"></i>光温条件适宜<strong>东南风 · 晴朗</strong></p>',
      'sun',
    ) +
    H.panel(
      '土壤生命力',
      '05 / SOIL',
      '<div class="ob-summary"><div><span class="ob-eyebrow">土壤综合健康评分</span><div class="ob-large"><strong class="ob-num">92</strong><small>/ 100</small></div></div><div class="ob-seal">' +
        H.icon('layers') +
        '</div></div>' +
        H.bars([
          ['氮 N', 76, '128 mg/kg'],
          ['磷 P', 58, '42 mg/kg'],
          ['钾 K', 87, '186 mg/kg'],
        ]) +
        '<p class="ob-note">土壤酸碱度<strong>pH 6.8 · 适宜</strong></p>',
      'layers',
    ) +
    H.panel(
      '今日农事计划',
      '06 / FIELDWORK',
      task('土壤与墒情晨间巡检', '08:00 · 全域 32 个地块') +
        task('温室精准水肥补给', '10:30 · A01—A06 温室') +
        '<button class="ob-task ob-task-button" data-action="task">' +
        H.icon('target') +
        '<div><strong>无人机作物长势巡检</strong><p>15:00 · B 区大田种植区</p></div><span data-bind="task-label">确认完成 →</span></button><p class="ob-note"><i class="ob-led"></i><span data-bind="task-note">今日农事按计划有序进行</span></p>',
      'calendar',
    );
  const base = [
    [
      ['智慧种植面积', 2860, '亩', '全域感知'],
      ['作物健康指数', 96.8, '%', '↑ 2.6%'],
      ['预计本季产量', 328.6, '吨', '↑ 12.8%'],
      ['在线感知设备', 128, '台', '在线率 99.2%'],
    ],
    [
      ['优良作物覆盖', 2471, '亩', '↑ 4.2%'],
      ['生长健康评分', 96.8, '分', '长势优良'],
      ['待关注地块', 1, '块', '已安排巡检'],
      ['监测品种', 12, '种', '全周期覆盖'],
    ],
    [
      ['今日灌溉用水', 1248.2, 'm³', '↓ 18.6%'],
      ['土壤含水率', 72.4, '%', '墒情适宜'],
      ['水资源利用率', 92.6, '%', '↑ 3.4%'],
      ['在线阀控设备', 36, '台', '运行正常'],
    ],
    [
      ['今日农事任务', 3, '项', '有序进行'],
      ['已完成任务', 2, '项', '按计划执行'],
      ['作业覆盖面积', 2180, '亩', '全域协同'],
      ['农机在线率', 100, '%', '12 台在线'],
    ],
  ];
  ObservatoryDashboard.mount({
    id: 'agriculture',
    glyph: 'leaf',
    accent: '#bdd69a',
    brand: '禾境 AGRIVERSE',
    brandEnglish: 'DIGITAL NATURE · 生长有迹',
    title: '智慧农业生态管理中心',
    eyebrow: 'PRECISION AGRICULTURE OBSERVATORY',
    site: '崇明 · 未来农场',
    season: '生长季 2026',
    scopeLabel: '选择农业区域',
    scopes: [
      { id: 'all', name: '全部地块' },
      { id: 'greenhouse', name: 'A 区 · 设施种植' },
      { id: 'field', name: 'B 区 · 大田种植' },
    ],
    topics: [
      { name: '农场总览', layer: 'all' },
      { name: '作物监测', layer: 'crops', note: '作物地块与智慧温室' },
      { name: '智慧灌溉', layer: 'infrastructure', note: '水肥基础设施与感知网络' },
      { name: '农事管理', layer: 'all', note: '今日农事任务 · 可在右侧确认完成' },
    ],
    metricIcons: ['leaf', 'target', 'chart', 'sensor'],
    left,
    right,
    sceneTitle: '农场数字孪生',
    sceneEnglish: 'DIGITAL FARMLAND',
    coordinates: '31°37′ N · 121°29′ E',
    focusNote: '农田 · 温室 · 智慧水网',
    layers: [
      { id: 'all', name: '全场概览' },
      { id: 'crops', name: '作物地块', note: '仅显示作物监测重点' },
      { id: 'infrastructure', name: '水肥基础设施', note: '显示智慧水网与感知设施' },
    ],
    metrics(state) {
      const rows = base[state.topic].map((row) => [...row]);
      if (state.topic === 3) rows[1][1] = state.taskDone ? 3 : 2;
      if (state.topic === 2 && state.irrigating) rows[0][1] = 1249.6;
      if (state.scope !== 'all') {
        const ratio = state.scope === 'greenhouse' ? 680 / 2860 : 2180 / 2860;
        rows.forEach((row) => {
          if (['亩', '吨', 'm³', '台'].includes(row[2]))
            row[1] =
              row[2] === '台' ? Math.round(row[1] * ratio) : Math.round(row[1] * ratio * 10) / 10;
        });
        if (state.topic === 0) rows[1][1] = state.scope === 'greenhouse' ? 98.2 : 96.3;
      }
      return rows;
    },
    insight: {
      title: '生长趋势与产能预测',
      label: '本季预计增产',
      metricUnit: '%',
      metrics: ['12.8', '14.2'],
      periods: ['今日', '本周'],
      notes: ['光温条件适宜，生长高于同期水平。', '本周生长势持续向好，预计产能增加。'],
      values: [
        [32, 36, 34, 49, 52, 61, 58, 70, 74, 78, 83, 92],
        [42, 51, 47, 62, 57, 68, 66, 76, 82, 87, 92, 98],
      ],
      labels: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      unit: '生长指数',
      type: 'line',
    },
    assets: [
      {
        id: 'greenhouse',
        short: '智慧温室',
        name: 'A01 · 智慧温室',
        description: '设施种植区的温湿度与水肥协同管理。当前为番茄生长周期的模拟观测。',
        fields: [
          ['种植面积', '680 亩'],
          ['空气温度', '24.6 °C'],
          ['空气湿度', '68.2 %'],
          ['生长评分', '98.2 分'],
        ],
      },
      {
        id: 'field',
        short: '高标准农田',
        name: 'B02 · 高标准农田',
        description: '大田轮作区采用土壤墒情、光温和无人机巡检进行综合观测。',
        fields: [
          ['种植面积', '2,180 亩'],
          ['主要作物', '水稻 / 小麦'],
          ['土壤含水率', '72.4 %'],
          ['预计产量', '232.2 吨'],
        ],
      },
      {
        id: 'reservoir',
        short: '智能蓄水池',
        name: '智慧水利 · 调蓄中心',
        description: '模拟蓄水与精准灌溉的调度中心，展示节水灌溉与水资源循环利用。',
        fields: [
          ['当前蓄水量', '2,840 m³'],
          ['水资源利用率', '92.6 %'],
          ['今日用水', '1,248.2 m³'],
          ['水质状态', '符合示范标准'],
        ],
      },
    ],
    actions: {
      irrigation(state, ui) {
        if (state.irrigating) {
          state.irrigating = false;
          ui.notify('A01 模拟灌溉已停止');
          return;
        }
        ui.dialog(
          '模拟 A01 精准灌溉',
          '<p>为 A01 温室模拟一次水肥补给。此操作只改变当前演示状态，不会控制真实设备。</p><div class="ob-detail-grid"><div><span>预计时长</span><strong>6 分钟</strong></div><div><span>预计用水</span><strong>12.4 m³</strong></div></div><div class="ob-dialog-actions"><button class="primary" data-action="confirm-dialog">开始模拟灌溉</button><button data-action="close">取消</button></div>',
          () => {
            state.irrigating = true;
            ui.refresh();
            ui.notify('A01 模拟灌溉已启动，可随时停止');
          },
        );
      },
      task(state, ui) {
        state.taskDone = !state.taskDone;
        ui.notify(state.taskDone ? '巡检任务已标记完成，可再次点击撤销' : '已撤销完成标记');
      },
    },
    update(state, ui) {
      ui.bind('water', state.irrigating ? '1,249.6' : '1,248.2');
      ui.bind(
        'irrigation-label',
        state.irrigating ? 'A01 模拟灌溉中 · 点击停止' : '模拟 A01 精准灌溉',
      );
      document.querySelector('#irrigation-action').dataset.active = String(state.irrigating);
      ui.bind('task-label', state.taskDone ? '已完成 · 撤销' : '确认完成 →');
      ui.bind('task-note', state.taskDone ? '今日农事计划已全部完成' : '今日农事按计划有序进行');
    },
    footer: '生态感知演示 · 32 个地块',
  });
})();
