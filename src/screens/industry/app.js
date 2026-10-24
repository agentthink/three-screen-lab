/* SPDX-License-Identifier: MIT */
(() => {
  const H = ObservatoryDashboard.helpers;
  const left =
    H.panel(
      '生产计划执行',
      '01 / PRODUCTION',
      '<span class="ob-eyebrow" data-bind="shift-label">白班计划完成率</span><div class="ob-large"><strong class="ob-num" data-bind="completion">89.5</strong><small>%</small><span class="ob-pill">ON TRACK</span></div><div class="ob-production-track"><i data-progress="production" style="width:89.5%"></i></div><div class="ob-facts"><div><span>计划产量</span><strong class="ob-num">32,000<small>件</small></strong></div><div><span>当班已完成</span><strong class="ob-num" data-bind="completed">28,640</strong></div></div><p class="ob-note">生产节拍<strong>24.8 s / 件 · ↑ 6.2%</strong></p>',
      'factory',
    ) +
    H.panel(
      '全流程质量控制',
      '02 / QUALITY',
      '<div class="ob-health">' +
        H.ring(98.6, '一次检验合格率') +
        '<div class="ob-health-copy"><span class="ob-pill">质量稳定</span><small>较上班次提升</small><strong class="ob-num">0.8<em> % ↗</em></strong></div></div>' +
        H.bars([
          ['外观检测', 99.2],
          ['尺寸精度', 98.4],
          ['功能测试', 99.6],
        ]) +
        '',
      'target',
    ) +
    H.panel(
      '能源消耗监测',
      '03 / ENERGY',
      '<span class="ob-eyebrow">当班综合用电</span><div class="ob-large"><strong class="ob-num" data-bind="energy">8,642</strong><small>kWh</small><span>↓ 12.4%</span></div>' +
        H.bars([
          ['生产设备', 71, '6,136', null, 'production-energy'],
          ['空调通风', 18, '1,556', null, 'climate-energy'],
          ['照明其他', 11, '950', null, 'lighting-energy'],
        ]) +
        '<p class="ob-note">单位产品能耗<strong>0.302 kWh / 件</strong></p>',
      'energy',
    );
  const right =
    H.panel(
      '设备综合效率',
      '04 / OEE',
      '<div class="ob-health">' +
        H.ring(92.8, 'OEE 综合效率') +
        '<div class="ob-health-copy"><span class="ob-pill">优于目标</span><small>目标值 85.0%</small><strong class="ob-num">+7.8<em> %</em></strong></div></div>' +
        H.facts([
          ['时间稼动率', '96.5', '%'],
          ['性能效率', '97.6', '%'],
          ['良品率', '98.6', '%'],
        ]),
      'chart',
    ) +
    H.panel(
      '设备运行监控',
      '05 / ASSET HEALTH',
      '<div class="ob-summary"><div><span class="ob-eyebrow">接入设备总数</span><div class="ob-large"><strong class="ob-num">168</strong><small>台</small></div></div><span class="ob-pill">' +
        H.icon('shield') +
        '健康评分 96</span></div>' +
        H.matrix(64) +
        '<div class="ob-matrix-key"><span><i></i>运行 156</span><span>待机 10</span><span class="ob-warn">维护 02</span></div><p class="ob-note">平均运行温度<strong>42.1 °C · 正常</strong></p>',
      'sensor',
    ) +
    H.panel(
      '事件与预警',
      '06 / EVENTS',
      '<button class="ob-alert" id="industry-alert" data-action="acknowledge">' +
        H.icon('alert') +
        '<div><strong data-bind="alert-title">CNC-06 预防性维护提醒</strong><p>建议在下次停机窗口完成主轴保养</p><small data-bind="alert-status">14:32 · 待确认，点击处理</small></div></button><div class="ob-task">' +
        H.icon('check') +
        '<div><strong>装配线 A 质检批次通过</strong><p>14:28 · 1,280 件完成全检</p></div><span>正常</span></div><button class="ob-task ob-task-button" data-action="work-order">' +
        H.icon('box') +
        '<div><strong>当前生产工单 WO-0924-A</strong><p>自动装配线 · 点击查看工单</p></div><span>详情 →</span></button>',
      'alert',
    );
  const records = [
    [
      ['当班完成产量', 28640, '件', '↑ 12.8%'],
      ['一次检验合格率', 98.6, '%', '↑ 0.8%'],
      ['设备综合效率', 92.8, '%', '↑ 2.4%'],
      ['在线生产设备', 168, '台', '在线率 99.2%'],
    ],
    [
      ['联网设备总数', 168, '台', '全域接入'],
      ['设备在线率', 99.2, '%', '运行平稳'],
      ['平均运行温度', 42.1, '°C', '处于正常区间'],
      ['主轴平均转速', 8600, 'rpm', '负载稳定'],
    ],
    [
      ['检验合格数量', 28236, '件', '按批次追溯'],
      ['一次检验合格率', 98.6, '%', '↑ 0.8%'],
      ['复检不良率', 0.4, '%', '↓ 0.2%'],
      ['待复检产品', 404, '件', '质检中'],
    ],
    [
      ['当班综合用电', 8642, 'kWh', '↓ 12.4%'],
      ['节能优化比例', 18.2, '%', '优于目标'],
      ['单位产品能耗', 0.302, 'kWh/件', '↓ 6.5%'],
      ['清洁能源占比', 32.8, '%', '↑ 3.2%'],
    ],
  ];
  ObservatoryDashboard.mount({
    id: 'industry',
    glyph: 'factory',
    accent: '#eab36d',
    brand: 'NEXUS 工业智能',
    brandEnglish: 'INDUSTRIAL INTELLIGENCE PLATFORM',
    title: '智慧工业数字运营中心',
    eyebrow: 'MANUFACTURING / COMMAND CENTER',
    site: 'PLANT 01 · 智能制造基地',
    season: '精益制造 · 全链协同',
    scopeLabel: '选择生产班次',
    scopes: [
      { id: 'day', name: '白班 08:00—20:00' },
      { id: 'night', name: '夜班 20:00—08:00' },
    ],
    topics: [
      { name: '生产总览', layer: 'all' },
      { name: '设备监控', layer: 'machines', note: '聚焦自动装配与精密加工设备' },
      { name: '质量管理', layer: 'all', note: '质检追溯 · 一次检验合格率 98.6%' },
      { name: '能源管理', layer: 'utilities', note: '显示车间能源与物流基础设施' },
    ],
    metricIcons: ['box', 'target', 'chart', 'factory'],
    left,
    right,
    sceneTitle: '生产车间数字孪生',
    sceneEnglish: 'ASSEMBLY WORKSHOP',
    coordinates: '1# WORKSHOP · 12,800 m²',
    focusNote: '机械臂 · 精密加工 · 智能物流',
    layers: [
      { id: 'all', name: '车间全景' },
      { id: 'machines', name: '生产设备', note: '聚焦生产与加工设备' },
      { id: 'utilities', name: '能源与物流', note: '显示安全通道与能源设施' },
    ],
    metrics(state) {
      const rows = records[state.topic].map((row) => [...row]);
      if (state.scope === 'night') {
        if (state.topic === 0) rows[0][1] = 26368;
        if (state.topic === 2) {
          rows[0][1] = 25999;
          rows[3][1] = 369;
        }
        if (state.topic === 3) rows[0][1] = 7965;
      }
      return rows;
    },
    insight: {
      title: '产能趋势与计划达成',
      label: '小时峰值产量',
      metricUnit: '件 / h',
      metrics: ['3,120', '3,350'],
      periods: ['今日', '昨日'],
      notes: ['当前产线节拍稳定，小时产能达成 98.2%。', '昨日高峰位于 17:00，产线运行平稳。'],
      values: [
        [1800, 2140, 2390, 2240, 2680, 2820, 2730, 3020, 2880, 3120, 2950, 2860],
        [2140, 2400, 2570, 2340, 2890, 2980, 3020, 3240, 3180, 3350, 3190, 3090],
      ],
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '19:00'],
      unit: '件',
      type: 'bar',
    },
    assets: [
      {
        id: 'assembly',
        short: '自动装配线',
        name: '01 / 自动装配线',
        description: '机械臂、输送带与视觉检测工位组成的自动化生产单元。可暂停仿真观察设备结构。',
        fields: [
          ['当前工单', 'WO-0924-A'],
          ['工单完成率', '92.6 %'],
          ['生产节拍', '24.8 s / 件'],
          ['产品合格率', '99.2 %'],
        ],
      },
      {
        id: 'cnc',
        short: '精密加工单元',
        name: '02 / 精密加工单元',
        description: '数控加工设备与辅助检测单元的概念模型。设备数值为确定性的演示数据。',
        fields: [
          ['当前工单', 'WO-0924-B'],
          ['主轴转速', '8,600 rpm'],
          ['设备温度', '42.1 °C'],
          ['维护窗口', '下次计划停机'],
        ],
      },
      {
        id: 'logistics',
        short: 'AGV 物流通道',
        name: '03 / AGV 智能物流',
        description: '连接物料仓储与装配工位的自动配送路线。车辆沿固定路径循环演示。',
        fields: [
          ['当前任务', '物料配送'],
          ['剩余电量', '86 %'],
          ['任务完成数', '128 单'],
          ['运行状态', '仿真运行中'],
        ],
      },
    ],
    actions: {
      acknowledge(state, ui) {
        state.resolved = !state.resolved;
        ui.notify(state.resolved ? '维护提醒已确认；再次点击可撤销' : '已撤销提醒确认');
      },
      'work-order'(state, ui) {
        ui.dialog(
          '生产工单 · WO-0924-A',
          '<p>智能装配单元当前批次的模拟生产进度，可用于查看计划与实际完成情况。</p><div class="ob-detail-grid"><div><span>产品型号</span><strong>NX-620 精密组件</strong></div><div><span>计划数量</span><strong>16,000 件</strong></div><div><span>已完成数量</span><strong>14,816 件</strong></div><div><span>计划达成</span><strong>92.6 %</strong></div></div><p class="ob-dialog-note">演示工单，不连接真实 MES 或生产设备。</p>',
        );
      },
    },
    update(state, ui) {
      const night = state.scope === 'night';
      ui.bind('shift-label', night ? '夜班计划完成率' : '白班计划完成率');
      ui.bind('completion', night ? '82.4' : '89.5');
      ui.bind('completed', night ? '26,368' : '28,640');
      ui.bind('energy', night ? '7,965' : '8,642');
      ui.bind('production-energy', night ? '5,655' : '6,136');
      ui.bind('climate-energy', night ? '1,434' : '1,556');
      ui.bind('lighting-energy', night ? '876' : '950');
      ui.setProgress('production', night ? 82.4 : 89.5);
      ui.bind('alert-title', state.resolved ? 'CNC-06 维护提醒已确认' : 'CNC-06 预防性维护提醒');
      ui.bind(
        'alert-status',
        state.resolved ? '已确认 · 再次点击可撤销' : '14:32 · 待确认，点击处理',
      );
      document.querySelector('#industry-alert').dataset.resolved = String(state.resolved);
    },
    footer: '制造协同演示 · 2 条生产线',
  });
})();
