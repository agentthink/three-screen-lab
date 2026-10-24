/* SPDX-License-Identifier: MIT */
(() => {
  const H = ObservatoryDashboard.helpers;
  const left =
    H.panel(
      '园区空间画像',
      '01 / SPACE',
      '<div class="ob-health">' +
        H.ring(96.2, '空间使用率') +
        '<div class="ob-space-facts"><div><span>建筑面积</span><strong class="ob-num">18.6 <small>万㎡</small></strong></div><div><span>智慧楼宇</span><strong class="ob-num">12 <small>栋</small></strong></div><div><span>绿化覆盖率</span><strong class="ob-num">38.5 <small>%</small></strong></div></div></div><div class="ob-space-stack" aria-label="空间构成：研发办公62%，产业配套24%，公共空间14%"><i style="width:62%"></i><i style="width:24%"></i><i style="width:14%"></i></div><p class="ob-note">研发办公 62% · 产业配套 24% · 公共空间 14%</p>',
      'park',
    ) +
    H.panel(
      '企业创新生态',
      '02 / ECOSYSTEM',
      '<div class="ob-summary"><div><span class="ob-eyebrow">入驻企业</span><div class="ob-large"><strong class="ob-num">168</strong><small>家</small></div></div><span class="ob-pill">本月新增 +12 ↗</span></div>' +
        H.bars([
          ['人工智能', 84, '42%'],
          ['集成电路', 62, '31%', '#7bafdf'],
          ['生命科学', 36, '18%', '#75cabb'],
          ['其他产业', 18, '9%', '#6b739c'],
        ]),
      'users',
    ) +
    H.panel(
      '智慧通行与配套',
      '03 / MOBILITY',
      '<div class="ob-mobility"><div>' +
        H.icon('car') +
        '<span>停车余位</span><strong class="ob-num">128 <small>/ 680</small></strong></div><div>' +
        H.icon('energy') +
        '<span>充电桩可用</span><strong class="ob-num">24 <small>/ 48</small></strong></div></div><div class="ob-parking" aria-label="停车位占用示意">' +
        Array.from(
          { length: 18 },
          (_, i) => '<i class="' + (i > 13 ? 'available' : '') + '"></i>',
        ).join('') +
        '</div><p class="ob-note"><i class="ob-led"></i>通行秩序平稳<strong>平均入园 18 秒</strong></p>',
      'car',
    );
  const right =
    H.panel(
      '零碳能源管理',
      '04 / ENERGY',
      '<span class="ob-eyebrow">今日综合用电</span><div class="ob-large"><strong class="ob-num">24,680</strong><small>kWh</small><span>↓ 8.6%</span></div><div class="ob-energy-columns" aria-label="用电分时趋势示意">' +
        [35, 29, 24, 39, 68, 86, 78, 72, 89, 74, 62, 48]
          .map((value) => '<i style="height:' + value + '%"></i>')
          .join('') +
        '</div>' +
        H.facts([
          ['光伏发电', '6,842', 'kWh'],
          ['今日减碳', '3.82', '吨'],
        ]),
      'energy',
    ) +
    H.panel(
      '全域安全感知',
      '05 / SECURITY',
      '<div class="ob-security-top"><div class="ob-seal">' +
        H.icon('shield') +
        '</div><div><strong class="ob-num">99.8<small>%</small></strong><p>设备在线率 · 全域守护</p></div></div>' +
        H.matrix(48) +
        H.facts([
          ['视频监控', '386', '台'],
          ['智能门禁', '128', '套'],
          ['消防感知', '2,048', '个'],
        ]),
      'shield',
    ) +
    H.panel(
      '园区事件动态',
      '06 / EVENTS',
      '<button class="ob-alert" id="park-alert" data-action="resolve">' +
        H.icon('alert') +
        '<div><strong data-bind="event-title">B2 地下车库巡查提醒</strong><p>巡查任务待确认，请核对后标记完成</p><small data-bind="event-status">14:32 · 待处理，点击确认</small></div></button><div class="ob-task">' +
        H.icon('check') +
        '<div><strong>光伏系统完成并网自检</strong><p>14:28 · 能源系统</p></div><span>正常</span></div><div class="ob-task">' +
        H.icon('users') +
        '<div><strong>科创总部访客预约通过</strong><p>14:16 · 访客服务</p></div><span>完成</span></div>',
      'clock',
    );
  const rows = [
    [
      ['入驻企业', 168, '家', '本月 +12'],
      ['在园人数', 8426, '人', '↑ 8.6%'],
      ['空间使用率', 96.2, '%', '↑ 1.2%'],
      ['综合运行指数', 98.6, '分', '运行平稳'],
    ],
    [
      ['可租面积', 12.8, '万㎡', '空间动态管理'],
      ['已入驻企业', 168, '家', '创新协同'],
      ['本月新签', 12, '家', '↑ 3 家'],
      ['会议室使用率', 86.4, '%', '资源高效利用'],
    ],
    [
      ['今日用电', 24680, 'kWh', '↓ 8.6%'],
      ['光伏发电', 6842, 'kWh', '↑ 12.4%'],
      ['清洁能源占比', 27.7, '%', '持续提升'],
      ['累计减碳', 128.6, '吨', '绿色园区'],
    ],
    [
      ['在线摄像头', 386, '台', '覆盖全部楼宇'],
      ['门禁通行', 12864, '次', '秩序平稳'],
      ['巡更完成率', 98.5, '%', '按计划执行'],
      ['待处理事件', 1, '项', '等待确认'],
    ],
  ];
  ObservatoryDashboard.mount({
    id: 'park',
    glyph: 'park',
    accent: '#b7a9ef',
    brand: '星屿 STAR ISLE',
    brandEnglish: 'CONNECTED SPACES · INSPIRED FUTURES',
    title: '智慧园区运营中心',
    eyebrow: 'SMART CAMPUS / CONNECTED FUTURES',
    site: '张江 · 科创园',
    season: '22—28 °C · 晴',
    scopeLabel: '选择园区范围',
    scopes: [
      { id: 'all', name: '全园区' },
      { id: 'north', name: '北区 · 研发办公' },
      { id: 'south', name: '南区 · 创新配套' },
    ],
    topics: [
      { name: '园区总览', layer: 'all' },
      { name: '空间运营', layer: 'buildings', note: '科创总部 · 研发中心 · 活力中心' },
      { name: '智慧能源', layer: 'energy', note: '光伏阵列与清洁能源节点' },
      { name: '安防态势', layer: 'security', note: '全域安防感知节点' },
    ],
    metricIcons: ['park', 'users', 'leaf', 'shield'],
    left,
    right,
    sceneTitle: '园区数字孪生',
    sceneEnglish: 'CONNECTED CAMPUS',
    coordinates: '31°12′ N · 121°36′ E',
    focusNote: '智慧楼宇 · 光伏能源 · 绿色交通',
    layers: [
      { id: 'all', name: '园区全景' },
      { id: 'buildings', name: '楼宇空间', note: '聚焦智慧楼宇与公共空间' },
      { id: 'energy', name: '光伏能源', note: '显示光伏阵列与能源设施' },
      { id: 'security', name: '安全感知', note: '显示周界安全与感知节点' },
    ],
    metrics(state) {
      const data = rows[state.topic].map((row) => [...row]);
      if (state.topic === 3) {
        data[3][1] = state.resolved ? 0 : 1;
        data[3][3] = state.resolved ? '全部已处理' : '等待确认';
      }
      if (state.scope !== 'all') {
        const ratio = state.scope === 'north' ? 0.62 : 0.38;
        data.forEach((row) => {
          if (['家', '人', '台', '次', '项'].includes(row[2]))
            row[1] = row[2] === '项' ? (state.resolved ? 0 : 1) : Math.round(row[1] * ratio);
          if (['万㎡', 'kWh', '吨'].includes(row[2])) row[1] = Math.round(row[1] * ratio * 10) / 10;
        });
      }
      return data;
    },
    insight: {
      title: '园区人流活跃趋势',
      label: '今日通行总量',
      metricUnit: '人次',
      metrics: ['12,864', '11,382'],
      periods: ['今日', '昨日'],
      notes: ['16:00—17:00 为当前通行高峰。', '昨日通行平稳，峰值低于今日。'],
      values: [
        [18, 14, 12, 16, 32, 68, 84, 72, 88, 96, 82, 62],
        [12, 10, 16, 22, 28, 56, 74, 65, 80, 86, 73, 54],
      ],
      labels: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
      unit: '活跃指数',
      type: 'line',
    },
    assets: [
      {
        id: 'headquarters',
        short: '科创总部',
        name: '01 · 科创总部',
        description: '园区核心科研办公楼宇，集研发办公、创新服务与企业协同空间于一体。',
        fields: [
          ['入驻企业', '42 家'],
          ['空间使用率', '96.2 %'],
          ['智慧工位', '2,680 个'],
          ['设备状态', '运行正常'],
        ],
      },
      {
        id: 'research',
        short: '研发中心',
        name: '02 · 研发中心',
        description: '面向研发团队的共享实验与办公空间。展示空间使用及楼宇环境的模拟数据。',
        fields: [
          ['在园人员', '1,286 人'],
          ['环境温度', '24.6 °C'],
          ['会议室使用率', '86.4 %'],
          ['综合能效等级', 'A 级'],
        ],
      },
      {
        id: 'service',
        short: '活力中心',
        name: '03 · 活力中心',
        description: '面向全园区开放的公共服务与生活配套中心，结合绿色交通与共享空间运营。',
        fields: [
          ['今日客流', '2,408 人次'],
          ['停车余位', '128 个'],
          ['可用充电桩', '24 个'],
          ['服务状态', '正常开放'],
        ],
      },
    ],
    actions: {
      resolve(state, ui) {
        state.resolved = !state.resolved;
        ui.notify(state.resolved ? '车库巡查已确认，可再次点击撤销' : '已撤销巡查确认');
      },
    },
    update(state, ui) {
      ui.bind('event-title', state.resolved ? 'B2 车库巡查已确认' : 'B2 地下车库巡查提醒');
      ui.bind(
        'event-status',
        state.resolved ? '已确认 · 再次点击可撤销' : '14:32 · 待处理，点击确认',
      );
      document.querySelector('#park-alert').dataset.resolved = String(state.resolved);
    },
    footer: '园区运营演示 · 12 栋智慧楼宇',
  });
})();
