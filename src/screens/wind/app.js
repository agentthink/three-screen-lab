(() => {
  'use strict';
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  VizLabRuntime.mountStage($('#wind-screen'), 1920, 1080);
  const state = {
      unit: 'G1029',
      running: true,
      wire: false,
      explode: false,
      flow: false,
      auto: false,
      cool: false,
    },
    units = WindDemoData.units;
  let toastTimer, previousFocus;
  function toast(text) {
    $('#wind-toast').textContent = text;
    $('#wind-toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#wind-toast').classList.remove('show'), 2400);
  }
  const details = {
    power: {
      title: '有功功率 · POWER',
      text: '实时监测发电机输出与机组负荷，保持风能捕获与电网需求之间的平衡。',
      stats: [
        ['当前有功功率', '1563 kW'],
        ['理论功率', '1340.42 kW'],
        ['额定装机容量', '10 MW'],
        ['运行状态', '并网运行'],
      ],
    },
    speed: {
      title: '风况监测 · WIND',
      text: '轮毂高度风速与风向的模拟观测数据。机组通过偏航与变桨系统调整迎风姿态。',
      stats: [
        ['瞬时风速', '5.6 m/s'],
        ['十分钟平均风速', '5.4 m/s'],
        ['切入风速', '3.0 m/s'],
        ['切出风速', '25.0 m/s'],
      ],
    },
    direction: {
      title: '风向与偏航 · YAW',
      text: '偏航系统调整机舱与来流方向的夹角，减少偏航误差，保持发电效率。',
      stats: [
        ['当前风向', '30°'],
        ['偏航误差', '0.8°'],
        ['偏航电机', '正常'],
        ['控制方式', '自动迎风'],
      ],
    },
    temperature: {
      title: '温度监测 · THERMAL',
      text: '机组冷却回路持续管理发电机、变流器与齿轮箱的温升。',
      stats: [
        ['环境温度', '18 ℃'],
        ['齿轮箱油温', '43.2 ℃'],
        ['发电机绕组', '52.8 ℃'],
        ['冷却系统', '正常'],
      ],
    },
    grid: {
      title: '电网参数 · GRID',
      text: '三相电网参数与频率均处于演示系统设置的正常工作范围。',
      stats: [
        ['电网电流', '1338.4 A'],
        ['电网电压', '393.8 kV'],
        ['电网频率', '49.99 Hz'],
        ['并网状态', '正常'],
      ],
    },
    rotor: {
      title: '轮毂变桨系统 · ROTOR',
      text: '三叶片独立变桨机构通过液压执行器调节桨距角。透明轮毂呈现轴承、连杆与驱动单元。',
      stats: [
        ['叶片数量', '3'],
        ['叶轮转速', '8.2 rpm'],
        ['当前桨距角', '1.6°'],
        ['健康状态', '正常'],
      ],
    },
    pitch: {
      title: '变桨轴承 · PITCH',
      text: '独立变桨轴承连接叶片根部与轮毂，实现三叶片同步及单独调节。',
      stats: [
        ['桨距角', '1.6°'],
        ['液压压力', '185 bar'],
        ['变桨电机', '正常'],
        ['检查周期', '30 天'],
      ],
    },
    shaft: {
      title: '低速主轴 · MAIN SHAFT',
      text: '主轴与主轴承承载叶轮风载，将低速高扭矩输入传递至增速齿轮箱。',
      stats: [
        ['主轴转速', '8.2 rpm'],
        ['轴承温度', '38.6 ℃'],
        ['振动幅值', '0.42 mm/s'],
        ['润滑状态', '正常'],
      ],
    },
    gearbox: {
      title: '增速齿轮箱 · GEARBOX',
      text: '行星齿轮与多级传动将叶轮低转速提升至发电机工作转速。模型展示端面螺栓、齿圈与散热结构。',
      stats: [
        ['输出转速', '1549 rpm'],
        ['润滑油温', '43.2 ℃'],
        ['油路压力', '3.4 bar'],
        ['齿轮振动', '0.63 mm/s'],
      ],
    },
    generator: {
      title: '永磁发电机 · GENERATOR',
      text: '发电机将主传动链的机械能转化为电能。铜绕组、端盖、散热鳍片与接线盒均为独立几何。',
      stats: [
        ['有功功率', '1563 kW'],
        ['绕组温度', '52.8 ℃'],
        ['发电机转速', '1549 rpm'],
        ['运行状态', '正常'],
      ],
    },
    coupling: {
      title: '高速联轴器 · COUPLING',
      text: '弹性联轴器连接齿轮箱高速端与发电机轴，补偿微小位移并传递动力。',
      stats: [
        ['转速', '1549 rpm'],
        ['连接状态', '正常'],
        ['扭矩波动', '0.6 %'],
        ['上次维护', '2026-09-18'],
      ],
    },
    converter: {
      title: '变流与电控 · CONVERTER',
      text: '变流器管理发电输出质量，与电网同步后输送至场站集电系统。',
      stats: [
        ['电网频率', '49.99 Hz'],
        ['变流效率', '98.4 %'],
        ['柜内温度', '32.4 ℃'],
        ['通讯状态', '在线'],
      ],
    },
    bedplate: {
      title: '机舱承载底架 · BEDPLATE',
      text: '底架支撑主轴、传动链与发电机，并经偏航轴承连接塔筒。',
      stats: [
        ['结构状态', '正常'],
        ['振动监测', '正常'],
        ['连接螺栓', '全部紧固'],
        ['检修通道', '畅通'],
      ],
    },
    yaw: {
      title: '偏航与塔筒 · TOWER',
      text: '偏航轴承、驱动系统与塔筒颈部构成机舱转向及承载结构。',
      stats: [
        ['偏航角度', '30°'],
        ['驱动状态', '自动'],
        ['塔筒振动', '0.21 mm/s'],
        ['结构状态', '正常'],
      ],
    },
  };
  function showDetail(key) {
    const d = details[key] || details.rotor;
    previousFocus = document.activeElement;
    $('#detail-title').textContent = d.title;
    $('#detail-content').innerHTML =
      `<p>${d.text}</p>${d.stats.map(([k, v]) => `<div class="detail-stat"><span>${k}</span><b>${v}</b></div>`).join('')}<p style="font-size:11px;color:#617e95;margin-top:22px">${state.unit} · 本页面为可交互数字孪生演示，控制与数据均为模拟。</p>`;
    $('#wind-modal').classList.add('open');
    $('#close-detail').focus();
  }
  function closeDetail() {
    $('#wind-modal').classList.remove('open');
    previousFocus?.focus();
  }
  $('#close-detail').onclick = closeDetail;
  $('#detail-done').onclick = closeDetail;
  $('#wind-modal').onclick = (e) => {
    if (e.target === $('#wind-modal')) closeDetail();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetail();
    if (e.key === 'Tab' && $('#wind-modal').classList.contains('open')) {
      const a = $('#close-detail'),
        b = $('#detail-done');
      if (e.shiftKey && document.activeElement === a) {
        b.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === b) {
        a.focus();
        e.preventDefault();
      }
    }
  });
  $$('[data-detail]').forEach((el) => (el.onclick = () => showDetail(el.dataset.detail)));
  let twin;
  VizLabRuntime.onDispose(() => {
    twin?.dispose();
    clearTimeout(toastTimer);
  });
  try {
    twin = WindTwin.create($('#turbine-host'), showDetail);
  } catch (error) {
    $('#turbine-host').innerHTML =
      '<div class="model-loading">当前浏览器无法启动 WebGL，请使用支持硬件加速的桌面浏览器。</div>';
    console.error(error);
  }
  function btn(id, key, apply, label) {
    $(id).onclick = () => {
      state[key] = !state[key];
      $(id).setAttribute('aria-pressed', String(state[key]));
      twin?.[apply](state[key]);
      if (label) toast(label(state[key]));
    };
  }
  btn('#wind-wire', 'wire', 'setWire', (v) => (v ? '线框结构已开启' : '已恢复透明机舱'));
  btn('#wind-explode', 'explode', 'setExplode', (v) => (v ? '正在展开传动链组件' : '正在复原机舱'));
  btn('#wind-flow', 'flow', 'setFlow', (v) =>
    v ? '发电工艺：风能 → 机械能 → 电能' : '已关闭发电流光',
  );
  btn('#wind-orbit', 'auto', 'setAuto');
  btn('#wind-light', 'cool', 'setCool', (v) => (v ? '冰蓝冷光' : '铂金透视'));
  $('#wind-running').onclick = () => {
    state.running = !state.running;
    twin?.setRunning(state.running);
    $('#wind-running').setAttribute('aria-pressed', String(state.running));
    $('#wind-running span').textContent = state.running ? '运行中' : '已暂停';
    $('#unit-status').textContent = state.running ? '并网' : '待机';
    document.body.classList.toggle('stopped', !state.running);
    $('#metric-power').textContent = state.running ? units[state.unit].power : '0';
    $('#rpm').innerHTML = state.running
      ? `${units[state.unit].rpm} <small>rpm</small>`
      : '0 <small>rpm</small>';
    toast(state.running ? '模拟机组已恢复运行' : '模拟机组已暂停');
  };
  $('#wind-reset').onclick = () => {
    twin?.reset();
    toast('已恢复参考视角');
  };
  $('#wind-production').onclick = () => {
    twin?.production();
    toast('生产监测视角');
  };
  $('#wind-annotations').onclick = () => {
    const visible = $('#model-annotations').classList.toggle('visible');
    $('#wind-annotations').setAttribute('aria-pressed', String(visible));
  };
  function updateUnit() {
    const d = units[state.unit];
    $('#unit-name').textContent = state.unit;
    $('#model-state').textContent = `10 MW / ${state.unit}`;
    for (let k of ['power', 'speed', 'direction', 'temperature'])
      $('#metric-' + k).textContent =
        k === 'temperature' ? d.temp : k === 'power' && !state.running ? 0 : d[k];
    for (let k of ['day', 'month', 'year']) $('#energy-' + k).textContent = d[k];
    $('#active-power').innerHTML = d.active + ' <small>kW</small>';
    $('#load-rate').innerHTML = d.load + ' <small>%</small>';
    $('#rpm').innerHTML = (state.running ? d.rpm : 0) + ' <small>rpm</small>';
    twin?.selectUnit(state.unit);
    drawChart();
  }
  $('#unit-select').onchange = (e) => {
    state.unit = e.target.value;
    updateUnit();
    toast('已切换至 ' + state.unit);
  };
  function tick() {
    const d = new Date();
    $('#wind-clock').textContent = d.toLocaleTimeString('zh-CN', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
  const visible = { speed: true, load: true, theory: true },
    chartData = {
      speed: [2, 8, 11, 17, 21, 22, 21, 22, 30],
      load: [13, 14, 19, 25, 28, 28, 32, 34, 40],
      theory: [21, 22, 27, 32, 35, 35, 39, 41, 47],
    },
    colors = { speed: '#9ce1cc', load: '#409dca', theory: '#c7bbdc' };
  function drawChart() {
    const svg = d3.select('#wind-chart');
    svg.selectAll('*').remove();
    const W = 380,
      H = 245,
      m = { l: 31, r: 9, t: 8, b: 31 },
      x = d3
        .scaleLinear()
        .domain([0, 24])
        .range([m.l, W - m.r]),
      y = d3
        .scaleLinear()
        .domain([0, 60])
        .range([H - m.b, m.t]);
    const defs = svg.append('defs');
    Object.keys(colors).forEach((k) => {
      const g = defs
        .append('linearGradient')
        .attr('id', 'wind-fill-' + k)
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 1);
      g.append('stop')
        .attr('stop-color', colors[k])
        .attr('stop-opacity', k === 'speed' ? 0.4 : 0.13);
      g.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colors[k])
        .attr('stop-opacity', 0.015);
    });
    svg
      .append('g')
      .selectAll('line')
      .data(d3.range(0, 61, 10))
      .join('line')
      .attr('x1', m.l)
      .attr('x2', W - m.r)
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', '#49718b')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 0.6);
    svg
      .append('g')
      .selectAll('line')
      .data(d3.range(0, 25, 3))
      .join('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', m.t)
      .attr('y2', H - m.b)
      .attr('stroke', '#275a7b')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.7);
    svg
      .append('g')
      .attr('transform', `translate(0,${H - m.b})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(d3.range(0, 24, 3))
          .tickFormat((d) => d + ':00')
          .tickSize(0)
          .tickPadding(11),
      )
      .call((g) => g.select('.domain').attr('stroke', '#738ba5'));
    svg
      .append('g')
      .attr('transform', `translate(${m.l},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => (d === 0 ? '00' : d))
          .tickSize(0)
          .tickPadding(12),
      )
      .call((g) => g.select('.domain').remove());
    svg
      .selectAll('.tick text')
      .attr('fill', '#c2cee0')
      .attr('font-size', 11)
      .attr('font-family', 'Arial');
    const mult = state.unit === 'G1030' ? 1.07 : state.unit === 'G1031' ? 0.92 : 1;
    Object.keys(chartData).forEach((k) => {
      if (!visible[k]) return;
      const pts = chartData[k].map((v, i) => ({ x: i * 3, y: v * mult }));
      svg
        .append('path')
        .datum(pts)
        .attr(
          'd',
          d3
            .area()
            .x((d) => x(d.x))
            .y0(y(0))
            .y1((d) => y(d.y))
            .curve(d3.curveMonotoneX),
        )
        .attr('fill', `url(#wind-fill-${k})`);
      svg
        .append('path')
        .datum(pts)
        .attr(
          'd',
          d3
            .line()
            .x((d) => x(d.x))
            .y((d) => y(d.y))
            .curve(d3.curveMonotoneX),
        )
        .attr('fill', 'none')
        .attr('stroke', colors[k])
        .attr('stroke-width', 1.4);
    });
    const marker = svg.append('g');
    marker
      .append('line')
      .attr('x1', x(9))
      .attr('x2', x(9))
      .attr('y1', m.t)
      .attr('y2', H - m.b)
      .attr('stroke', '#72c4d56e')
      .attr('stroke-dasharray', '2 4');
    marker
      .append('circle')
      .attr('cx', x(9))
      .attr('cy', y(chartData.speed[3] * mult))
      .attr('r', 7)
      .attr('fill', '#102f3b')
      .attr('stroke', '#80e3d6');
    marker
      .append('circle')
      .attr('cx', x(9))
      .attr('cy', y(chartData.speed[3] * mult))
      .attr('r', 3)
      .attr('fill', '#8befdf');
    svg
      .append('rect')
      .attr('x', m.l)
      .attr('y', m.t)
      .attr('width', W - m.l - m.r)
      .attr('height', H - m.t - m.b)
      .attr('fill', 'transparent')
      .on('pointermove', function (e) {
        const [px] = d3.pointer(e),
          hour = Math.max(0, Math.min(24, Math.round(x.invert(px) / 3) * 3)),
          i = hour / 3,
          t = $('#wind-tooltip'),
          screen = $('#wind-screen').getBoundingClientRect(),
          scale = screen.width / 1920;
        marker.attr('transform', `translate(${x(hour) - x(9)},0)`);
        t.innerHTML = `<b>${state.unit} · ${String(hour).padStart(2, '0')}:00</b><br>风速 ${((chartData.speed[i] * mult) / 4).toFixed(1)} m/s<br>负荷 ${(chartData.load[i] * mult).toFixed(1)} kW<br>理论负荷 ${(chartData.theory[i] * mult).toFixed(1)} kW`;
        t.style.display = 'block';
        t.style.left = (e.clientX - screen.left) / scale - 170 + 'px';
        t.style.top = (e.clientY - screen.top) / scale - 50 + 'px';
      })
      .on('pointerleave', () => ($('#wind-tooltip').style.display = 'none'));
  }
  $$('[data-series]').forEach(
    (b) =>
      (b.onclick = () => {
        const key = b.dataset.series;
        visible[key] = !visible[key];
        b.setAttribute('aria-pressed', String(visible[key]));
        drawChart();
      }),
  );
  $$('[data-period]').forEach(
    (b) =>
      (b.onclick = () => {
        const map = {
            day: ['本日发电量', '12 万kWh', '较昨日 +8.2%'],
            month: ['本月发电量', '300 万kWh', '月度计划完成 86.4%'],
            year: ['本年发电量', '3212 万kWh', '累计减排 22,484 吨 CO₂'],
          },
          v = map[b.dataset.period];
        previousFocus = document.activeElement;
        $('#detail-title').textContent = v[0];
        $('#detail-content').innerHTML =
          `<div class="detail-stat"><span>${state.unit}</span><b>${units[state.unit][b.dataset.period]} 万kWh</b></div><p>${v[2]}</p><p>能源产出按当前选择机组展示。统计数据为演示值。</p>`;
        $('#wind-modal').classList.add('open');
        $('#close-detail').focus();
      }),
  );
  drawChart();
})();
