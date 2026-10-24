/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const paths = {
    leaf: 'M5 20C3 7 13 3 21 3c0 10-3 17-11 17H5ZM5 20 15 10',
    factory: 'M3 21V9l6 4V7l6 4V3h5v18H3Zm3-4h2m4 0h2',
    park: 'M3 21h18M5 21V8h6v13m2 0V3h6v18M7 11h2m-2 4h2m6-9h2m-2 4h2m-2 4h2',
    home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',
    fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
    export: 'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',
    help: 'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0',
    sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    water: 'M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13Zm-3 13a3 3 0 0 0 3 3',
    sensor:
      'M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0M5 5a10 10 0 0 0 0 14m14 0a10 10 0 0 0 0-14M2 2l20 20',
    wind: 'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3',
    layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
    check: 'm5 12 4 4L19 6',
    target: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5m-5 0L22 2m-7 0h7v7',
    calendar: 'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 10h14m-9 4h4m-4 3h4',
    energy: 'm13 2-9 12h7l-1 8 10-13h-7l0-7Z',
    shield: 'm12 2 8 3v7c0 5-5 8-8 10-3-2-8-5-8-10V5l8-3Zm-4 10 3 3 5-6',
    users:
      'M16 21v-3c0-3-3-5-6-5s-6 2-6 5v3m6-18a4 4 0 1 0 0 8 4 4 0 0 0 0-8m8 11c2 1 3 3 3 6m-4-17a4 4 0 0 1 0 8',
    chart: 'M4 3v18h17M8 17v-6m5 6V7m5 10V4',
    box: 'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10v9M3 8l9 5 9-5',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v6l4 2',
    alert: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    orbit: 'M4 10a8 8 0 1 1 0 5M4 10V4m0 6h6',
    top: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7',
    pause: 'M8 4v16m8-16v16',
    play: 'm7 3 14 9-14 9V3Z',
    close: 'm6 6 12 12M6 18 18 6',
    car: 'm4 10 2-6h12l2 6M3 10h18v9H3v-9Zm4 4h1m8 0h1M5 19v2m14-2v2',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
  };
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const icon = (name) =>
    '<svg class="ob-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' +
    (paths[name] || paths.layers) +
    '"/></svg>';
  const number = (value) =>
    typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 3 }) : value;
  function panel(title, code, body, glyph = 'layers') {
    return (
      '<section class="ob-panel"><div class="ob-panel-heading"><h2>' +
      icon(glyph) +
      escape(title) +
      '</h2><span>' +
      escape(code) +
      '</span></div>' +
      body +
      '</section>'
    );
  }
  function bars(items) {
    return (
      '<div class="ob-bars">' +
      items
        .map(
          ([label, value, display, color, binding]) =>
            '<div class="ob-bar"><span>' +
            escape(label) +
            '</span><div><i style="width:' +
            Math.min(100, value) +
            '%;' +
            (color ? 'background:' + color : '') +
            '"></i></div><strong class="ob-num"' +
            (binding ? ' data-bind="' + escape(binding) + '"' : '') +
            '>' +
            escape(display || value + '%') +
            '</strong></div>',
        )
        .join('') +
      '</div>'
    );
  }
  function facts(items) {
    return (
      '<div class="ob-facts">' +
      items
        .map(
          ([label, value, unit]) =>
            '<div><span>' +
            escape(label) +
            '</span><strong class="ob-num">' +
            escape(value) +
            '<small>' +
            escape(unit || '') +
            '</small></strong></div>',
        )
        .join('') +
      '</div>'
    );
  }
  function ring(value, label) {
    return (
      '<div class="ob-ring"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="46" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="55" cy="55" r="46" fill="none" stroke="var(--accent)" stroke-width="5" pathLength="100" stroke-dasharray="' +
      value +
      ' 100" transform="rotate(-90 55 55)" stroke-linecap="round"/><circle cx="55" cy="55" r="37" fill="none" stroke="var(--dim)" stroke-width=".8" stroke-dasharray="1 5"/></svg><strong class="ob-num">' +
      value +
      '<small>%</small></strong><span>' +
      escape(label) +
      '</span></div>'
    );
  }
  function matrix(count = 64) {
    return (
      '<div class="ob-matrix" aria-label="设备状态示意，绝大部分正常">' +
      Array.from(
        { length: count },
        (_, i) =>
          '<i class="' + (i === count - 1 ? 'warn' : i > count - 5 ? 'idle' : '') + '"></i>',
      ).join('') +
      '</div>'
    );
  }
  const helpers = { escape, icon, number, panel, bars, facts, ring, matrix };
  function mount(config) {
    const q = (selector, root = document) => root.querySelector(selector);
    const qa = (selector) => [...document.querySelectorAll(selector)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const state = {
      topic: 0,
      scope: config.scopes[0].id,
      period: 0,
      running: !reduced.matches,
      orbit: false,
      top: false,
      resolved: false,
      irrigating: false,
      taskDone: false,
    };
    const root = q('#observatory');
    root.dataset.case = config.id;
    root.innerHTML =
      '<header class="ob-header">' +
      ObservatoryHeader.create(config.id, root.dataset.headerArt) +
      '<a class="ob-brand" href="home.html" aria-label="返回大屏展厅"><span class="ob-brand-mark">' +
      icon(config.glyph) +
      '</span><div><strong>' +
      escape(config.brand) +
      '</strong><small>' +
      escape(config.brandEnglish) +
      '</small></div></a><div class="ob-title"><span>' +
      escape(config.eyebrow) +
      '</span><h1>' +
      escape(config.title) +
      '</h1></div><div class="ob-utilities"><span class="ob-demo"><i class="ob-led"></i>演示模式</span><time class="ob-clock ob-num" id="ob-clock"></time><button class="ob-icon-button" data-action="help" aria-label="使用说明" title="使用说明">' +
      icon('help') +
      '</button><button class="ob-icon-button" data-action="fullscreen" aria-label="切换全屏" title="切换全屏">' +
      icon('fullscreen') +
      '</button></div></header>' +
      '<nav class="ob-nav" aria-label="业务主题"><div class="ob-location"><i class="ob-led"></i><b>' +
      escape(config.site) +
      '</b><span>' +
      escape(config.season) +
      '</span></div><div class="ob-tabs" role="tablist" aria-label="' +
      escape(config.title) +
      '业务视图">' +
      config.topics
        .map(
          (topic, i) =>
            '<button class="ob-tab" id="ob-tab-' +
            i +
            '" role="tab" aria-selected="' +
            (i === 0) +
            '" aria-controls="ob-workspace" tabindex="' +
            (i === 0 ? 0 : -1) +
            '" data-topic="' +
            i +
            '"><span>0' +
            (i + 1) +
            '</span>' +
            escape(topic.name) +
            '</button>',
        )
        .join('') +
      '</div><select class="ob-select" id="ob-scope" aria-label="' +
      escape(config.scopeLabel) +
      '">' +
      config.scopes
        .map((scope) => '<option value="' + scope.id + '">' + escape(scope.name) + '</option>')
        .join('') +
      '</select></nav>' +
      '<section class="ob-metrics" id="ob-metrics" aria-label="核心运营指标"></section>' +
      '<main class="ob-grid" id="ob-workspace" role="tabpanel" aria-labelledby="ob-tab-0"><aside class="ob-side ob-left">' +
      config.left +
      '</aside><div class="ob-center"><section class="ob-stage" aria-label="' +
      escape(config.sceneTitle) +
      '"><div class="ob-stage-top"><div><span class="ob-live"><i class="ob-led"></i>3D TWIN</span><strong>' +
      escape(config.sceneTitle) +
      '</strong><small>' +
      escape(config.sceneEnglish) +
      '</small></div><select class="ob-select" id="ob-layer" aria-label="场景图层">' +
      config.layers
        .map((layer) => '<option value="' + layer.id + '">' + escape(layer.name) + '</option>')
        .join('') +
      '</select></div><span class="ob-stage-coordinate">' +
      escape(config.coordinates) +
      ' <span> / 概念模型</span></span><div class="ob-canvas-host" id="ob-canvas-host"></div><div class="ob-pins" id="ob-pins">' +
      config.assets
        .map(
          (asset) =>
            '<button class="ob-scene-pin" data-action="asset" data-asset="' +
            asset.id +
            '" tabindex="-1" aria-hidden="true" hidden><i></i>' +
            escape(asset.short) +
            '<b>+</b></button>',
        )
        .join('') +
      '</div><div class="ob-stage-tools"><button class="ob-icon-button" data-action="zoom-in" aria-label="放大三维场景" title="放大">' +
      icon('plus') +
      '</button><button class="ob-icon-button" data-action="zoom-out" aria-label="缩小三维场景" title="缩小">' +
      icon('minus') +
      '</button><button class="ob-icon-button" data-action="reset" aria-label="复位三维场景" title="复位">' +
      icon('orbit') +
      '</button></div><span class="ob-model-caption" id="ob-focus-note">' +
      escape(config.focusNote) +
      '</span><div class="ob-object-list" aria-label="场景对象">' +
      config.assets
        .map(
          (asset, i) =>
            '<button class="ob-object" data-action="asset" data-asset="' +
            asset.id +
            '" aria-pressed="false"><em>0' +
            (i + 1) +
            '</em>' +
            escape(asset.short) +
            '</button>',
        )
        .join('') +
      '</div><div class="ob-stage-bottom"><div class="ob-scene-controls"><button data-action="orbit" aria-pressed="false">' +
      icon('orbit') +
      '环绕巡航</button><button data-action="top" aria-pressed="false">' +
      icon('top') +
      '俯瞰视角</button><button data-action="running" aria-pressed="' +
      !state.running +
      '">' +
      icon(state.running ? 'pause' : 'play') +
      '<span>' +
      (state.running ? '暂停仿真' : '继续仿真') +
      '</span></button></div><span id="scene-instructions"><span class="desktop-instructions">拖动旋转 · 滚轮缩放</span><span class="mobile-instructions">横向拖动旋转</span></span></div></section>' +
      '<section class="ob-panel ob-insight"><div class="ob-panel-heading"><h2>' +
      icon('chart') +
      escape(config.insight.title) +
      '</h2><div class="ob-period" role="group" aria-label="趋势时间范围">' +
      config.insight.periods
        .map(
          (label, i) =>
            '<button data-period="' +
            i +
            '" aria-pressed="' +
            (i === 0) +
            '">' +
            escape(label) +
            '</button>',
        )
        .join('') +
      '</div></div><div class="ob-insight-body"><div class="ob-insight-summary"><small>' +
      escape(config.insight.label) +
      '</small><strong class="ob-num" id="ob-trend-metric"></strong><p id="ob-trend-note"></p></div><div class="ob-chart-wrap" id="ob-chart"><span class="ob-chart-tip" id="ob-chart-tip" hidden role="status"></span></div></div></section></div><aside class="ob-side ob-right">' +
      config.right +
      '</aside></main>' +
      '<footer class="ob-footer"><div><i class="ob-led"></i>' +
      escape(config.footer) +
      '<span>· 所有操作仅用于模拟演示</span></div><nav aria-label="更多大屏"><a href="home.html">' +
      icon('home') +
      '返回展厅</a><a href="agriculture.html">智慧农业</a><a href="industry.html">智慧工业</a><a href="park.html">智慧园区</a></nav><button class="ob-export" data-action="export">' +
      icon('export') +
      '导出当前指标</button></footer>' +
      '<dialog class="ob-dialog" id="ob-dialog" aria-labelledby="ob-dialog-title"><div class="ob-dialog-header"><h2 id="ob-dialog-title"></h2><button class="ob-icon-button" data-action="close" aria-label="关闭详情">' +
      icon('close') +
      '</button></div><div class="ob-dialog-content" id="ob-dialog-content"></div></dialog><div class="ob-toast" id="ob-toast" role="status" aria-live="polite" hidden></div>';
    const dialog = q('#ob-dialog'),
      host = q('#ob-canvas-host');
    let twin = null,
      toastTimer,
      clockTimer,
      lastFocus = null,
      dialogAction = null,
      disposed = false;
    const bind = (key, value) =>
      qa('[data-bind="' + key + '"]').forEach((el) => {
        el.textContent = String(value);
      });
    const setProgress = (key, value) =>
      qa('[data-progress="' + key + '"]').forEach((el) => {
        el.style.width = value + '%';
      });
    function notify(text) {
      const toast = q('#ob-toast');
      clearTimeout(toastTimer);
      toast.textContent = text;
      toast.hidden = false;
      toastTimer = setTimeout(() => {
        toast.hidden = true;
      }, 3600);
    }
    function showDialog(title, body, action) {
      lastFocus = document.activeElement;
      q('#ob-dialog-title').textContent = title;
      q('#ob-dialog-content').innerHTML = body;
      dialogAction = action;
      if (!dialog.open) dialog.showModal();
      q('[data-action="close"]', dialog).focus({ preventScroll: true });
    }
    function asset(id) {
      const entry = config.assets.find((value) => value.id === id);
      if (!entry) return;
      twin?.select(id, false);
      qa('.ob-object').forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.asset === id)),
      );
      showDialog(
        entry.name,
        '<p>' +
          escape(entry.description) +
          '</p><div class="ob-detail-grid">' +
          entry.fields
            .map(
              ([label, value]) =>
                '<div><span>' +
                escape(label) +
                '</span><strong class="ob-num">' +
                escape(value) +
                '</strong></div>',
            )
            .join('') +
          '</div><p class="ob-dialog-note">概念场景与模拟数据，仅用于展示；不连接实际设备。</p>',
      );
    }
    const ui = {
      bind,
      setProgress,
      notify,
      dialog: showDialog,
      asset,
      escape,
      icon,
      refresh: () => refresh(),
      scene: () => twin,
    };
    function metrics() {
      return config.metrics(state);
    }
    function chart() {
      const values = config.insight.values[state.period],
        labels = config.insight.labels,
        max = Math.ceil((Math.max(...values) * 1.12) / 10) * 10;
      const w = Math.max(240, q('#ob-chart').clientWidth),
        h = 130,
        left = 29,
        right = 10,
        top = 8,
        bottom = 23,
        plotW = w - left - right,
        plotH = h - top - bottom;
      const x = (i) => left + (i * plotW) / (values.length - 1),
        y = (v) => top + plotH * (1 - v / max);
      const points = values
        .map((value, i) => x(i).toFixed(1) + ',' + y(value).toFixed(1))
        .join(' ');
      const grid = [0, 0.5, 1]
        .map(
          (f) =>
            '<line class="ob-chart-grid" x1="' +
            left +
            '" x2="' +
            (w - right) +
            '" y1="' +
            y(f * max) +
            '" y2="' +
            y(f * max) +
            '"/><text x="' +
            (left - 6) +
            '" y="' +
            (y(f * max) + 3) +
            '" text-anchor="end">' +
            number(Math.round(f * max)) +
            '</text>',
        )
        .join('');
      const marks =
        config.insight.type === 'bar'
          ? values
              .map(
                (value, i) =>
                  '<rect x="' +
                  (x(i) - (plotW / values.length) * 0.25) +
                  '" y="' +
                  y(value) +
                  '" width="' +
                  (plotW / values.length) * 0.5 +
                  '" height="' +
                  (h - bottom - y(value)) +
                  '" fill="url(#ob-chart-fill)" rx="2"/>',
              )
              .join('')
          : '<polygon points="' +
            left +
            ',' +
            (h - bottom) +
            ' ' +
            points +
            ' ' +
            (w - right) +
            ',' +
            (h - bottom) +
            '" fill="url(#ob-chart-area)"/><polyline points="' +
            points +
            '" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>' +
            values
              .filter((_, i) => i % 2 === 0)
              .map(
                (v, j) =>
                  '<circle class="ob-chart-dot" cx="' + x(j * 2) + '" cy="' + y(v) + '" r="2.5"/>',
              )
              .join('');
      const axis = labels
        .map(
          (label, i) =>
            '<text x="' +
            (left + (i * plotW) / (labels.length - 1)) +
            '" y="' +
            (h - 4) +
            '" text-anchor="middle">' +
            escape(label) +
            '</text>',
        )
        .join('');
      const hits = values
        .map(
          (value, i) =>
            '<rect class="chart-hit" data-chart-index="' +
            i +
            '" tabindex="0" role="img" aria-label="' +
            escape(config.insight.sampleLabels?.[i] || '第' + (i + 1) + '时段') +
            '：' +
            number(value) +
            ' ' +
            escape(config.insight.unit) +
            '" x="' +
            (x(i) - (plotW / values.length) * 0.45) +
            '" y="' +
            top +
            '" width="' +
            (plotW / values.length) * 0.9 +
            '" height="' +
            plotH +
            '"><title>' +
            number(value) +
            ' ' +
            escape(config.insight.unit) +
            '</title></rect>',
        )
        .join('');
      q('#ob-chart').innerHTML =
        '<svg class="ob-chart" viewBox="0 0 ' +
        w +
        ' 130" style="--chart-font:' +
        (w > 600 ? 11 : 9) +
        'px" preserveAspectRatio="none" aria-label="' +
        escape(config.insight.title) +
        '"><defs><linearGradient id="ob-chart-area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".01"/></linearGradient><linearGradient id="ob-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".18"/></linearGradient></defs>' +
        grid +
        marks +
        axis +
        hits +
        '</svg><span class="ob-chart-tip" id="ob-chart-tip" hidden></span>';
      q('#ob-trend-metric').innerHTML =
        escape(config.insight.metrics[state.period]) +
        '<small>' +
        escape(config.insight.metricUnit) +
        '</small>';
      q('#ob-trend-note').textContent = config.insight.notes[state.period];
    }
    function refresh(redrawChart = false) {
      headerMotion();
      root.dataset.topic = String(state.topic);
      root.dataset.scope = state.scope;
      q('#ob-workspace').setAttribute('aria-labelledby', 'ob-tab-' + state.topic);
      qa('button[data-topic]').forEach((button) => {
        const active = Number(button.dataset.topic) === state.topic;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      q('#ob-metrics').innerHTML = metrics()
        .map(
          (metric, i) =>
            '<article class="ob-metric"><span class="ob-metric-label"><i>0' +
            (i + 1) +
            '</i>' +
            escape(metric[0]) +
            '</span><div class="ob-metric-value"><strong class="ob-num">' +
            escape(number(metric[1])) +
            '</strong><small>' +
            escape(metric[2]) +
            '</small><em>' +
            escape(metric[3] || '') +
            '</em></div>' +
            icon(config.metricIcons[i]) +
            '</article>',
        )
        .join('');
      qa('button[data-period]').forEach((button) =>
        button.setAttribute('aria-pressed', String(Number(button.dataset.period) === state.period)),
      );
      const runButton = q('[data-action="running"]');
      runButton.setAttribute('aria-pressed', String(!state.running));
      runButton.innerHTML =
        icon(state.running ? 'pause' : 'play') +
        '<span>' +
        (state.running ? '暂停仿真' : '继续仿真') +
        '</span>';
      q('[data-action="orbit"]').setAttribute('aria-pressed', String(state.orbit));
      q('[data-action="top"]').setAttribute('aria-pressed', String(state.top));
      config.update?.(state, ui);
      if (redrawChart) chart();
    }
    function changeTopic(index) {
      state.topic = index;
      q('#ob-layer').value = config.topics[index].layer || 'all';
      twin?.setMode(q('#ob-layer').value);
      q('#ob-focus-note').textContent = config.topics[index].note || config.focusNote;
      refresh();
    }
    function click(event) {
      const topic = event.target.closest('button[data-topic]');
      if (topic) {
        changeTopic(Number(topic.dataset.topic));
        return;
      }
      const period = event.target.closest('button[data-period]');
      if (period) {
        state.period = Number(period.dataset.period);
        refresh(true);
        return;
      }
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      if (action === 'close') {
        dialog.close();
        return;
      }
      if (action === 'confirm-dialog') {
        dialog.close();
        dialogAction?.();
        dialogAction = null;
        refresh();
        return;
      }
      if (action === 'asset') {
        asset(button.dataset.asset);
        return;
      }
      if (action === 'running') {
        state.running = !state.running;
        twin?.setRunning(state.running);
        refresh();
        return;
      }
      if (action === 'orbit') {
        state.orbit = !state.orbit;
        twin?.setOrbit(state.orbit);
        refresh();
        return;
      }
      if (action === 'top') {
        state.top = !state.top;
        state.orbit = false;
        twin?.setTop(state.top);
        refresh();
        return;
      }
      if (action === 'zoom-in' || action === 'zoom-out') {
        twin?.zoom(action === 'zoom-in' ? 1.12 : 1 / 1.12);
        return;
      }
      if (action === 'reset') {
        state.orbit = false;
        state.top = false;
        twin?.reset();
        refresh();
        notify('已恢复默认视角');
        return;
      }
      if (action === 'help') {
        showDialog(
          '探索这座数字空间',
          '<p>拖动场景旋转，滚轮或右侧按钮缩放；选择场景标记或下方对象按钮，查看详细数据。业务主题会同步切换核心指标与场景图层。</p><div class="ob-detail-grid"><div><span>键盘旋转</span><strong>↑ ↓ ← →</strong></div><div><span>缩放 / 复位</span><strong>+ − / R</strong></div><div><span>切换主题</span><strong>Tab / 左右键</strong></div><div><span>退出详情</span><strong>Esc</strong></div></div><p class="ob-dialog-note">所有指标、天气及操作均为本地模拟。启用“减少动态效果”时，仿真默认暂停；仍可主动运行或手动旋转。</p>',
        );
        return;
      }
      if (action === 'fullscreen') {
        (document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
        ).catch(() => notify('当前窗口不支持全屏，可在独立页面打开'));
        return;
      }
      if (action === 'export') {
        const rows = [
          ['业务主题', config.topics[state.topic].name],
          ['范围', config.scopes.find((scope) => scope.id === state.scope).name],
          [],
          ['指标', '数值', '单位'],
          ...metrics().map((m) => m.slice(0, 3)),
        ];
        const csv =
          '\uFEFF' +
          rows
            .map((row) =>
              row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(','),
            )
            .join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
          a = document.createElement('a');
        a.href = url;
        a.download = config.id + '-demo-metrics.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify('当前视图的演示指标已导出');
        return;
      }
      config.actions?.[action]?.(state, ui);
      refresh();
    }
    function change(event) {
      if (event.target.id === 'ob-scope') {
        state.scope = event.target.value;
        refresh(true);
      }
      if (event.target.id === 'ob-layer') {
        twin?.setMode(event.target.value);
        q('#ob-focus-note').textContent =
          config.layers.find((layer) => layer.id === event.target.value)?.note || config.focusNote;
      }
    }
    function key(event) {
      const tab = event.target.closest('button[data-topic]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let index = Number(tab.dataset.topic);
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = config.topics.length - 1;
      else
        index =
          (index + (event.key === 'ArrowRight' ? 1 : -1) + config.topics.length) %
          config.topics.length;
      changeTopic(index);
      q('button[data-topic="' + index + '"]').focus();
    }
    function showTip(event) {
      const hit = event.target.closest('[data-chart-index]');
      if (!hit) return;
      const tip = q('#ob-chart-tip');
      tip.textContent = hit.getAttribute('aria-label');
      tip.hidden = false;
    }
    function hideTip() {
      q('#ob-chart-tip').hidden = true;
    }
    root.addEventListener('click', click);
    root.addEventListener('change', change);
    root.addEventListener('keydown', key);
    q('#ob-chart').addEventListener('pointerover', showTip);
    q('#ob-chart').addEventListener('focusin', showTip);
    q('#ob-chart').addEventListener('pointerleave', hideTip);
    q('#ob-chart').addEventListener('focusout', hideTip);
    dialog.addEventListener('close', () => {
      if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    function clock() {
      const date = new Date();
      q('#ob-clock').innerHTML =
        escape(date.toLocaleTimeString('zh-CN', { hour12: false })) +
        '<small>' +
        escape(
          date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' }),
        ) +
        '</small>';
    }
    clock();
    clockTimer = setInterval(clock, 1000);
    refresh(true);
    const chartObserver = new ResizeObserver(chart);
    chartObserver.observe(q('#ob-chart'));
    function fallback() {
      root.dataset.renderer = 'fallback';
      host.innerHTML =
        '<div class="ob-empty"><svg viewBox="0 0 520 280" aria-hidden="true"><g transform="translate(260 60) rotate(30) skewX(-30)"><path d="M-145 0h290v160h-290z" fill="var(--panel)" stroke="var(--accent)" stroke-opacity=".3"/>' +
        config.assets
          .map(
            (entry, i) =>
              '<g transform="translate(' +
              (-105 + i * 82) +
              ' 35)"><path d="M0 0h55v65H0z" fill="var(--accent)" opacity=".15"/><path d="M0 0v-30h55v30m-55-30 14-10h55v30l-14 10M55-30l14-10" fill="none" stroke="var(--accent)" stroke-opacity=".6"/></g>',
          )
          .join('') +
        '</g></svg><span>已切换至轻量场景 · 可通过下方对象继续查看数据</span></div>';
      qa('.ob-stage-tools button,.ob-scene-controls button').forEach((button) => {
        button.disabled = true;
      });
      qa('.ob-scene-pin').forEach((pin) => {
        pin.hidden = true;
      });
    }
    try {
      const pins = qa('.ob-scene-pin');
      twin = ObservatoryScenes.create(host, config.id, {
        accent: config.accent,
        label: config.sceneTitle + '，方向键旋转，正负键缩放，R 复位',
        onSelect: asset,
        onView: (view) => {
          if (
            state.running === view.running &&
            state.orbit === view.orbit &&
            state.top === view.top
          )
            return;
          Object.assign(state, view);
          refresh();
        },
        onLost: () => {
          fallback();
          twin = null;
        },
        onProject: (projected) =>
          projected.forEach((point) => {
            const pin = pins.find((el) => el.dataset.asset === point.id);
            if (!pin) return;
            pin.hidden = !point.visible;
            pin.style.left = point.x + 'px';
            pin.style.top = point.y + 'px';
          }),
      });
      root.dataset.renderer = 'webgl';
    } catch {
      fallback();
    }
    const onReduce = () => {
      if (reduced.matches) {
        state.running = false;
        state.orbit = false;
        refresh();
      }
    };
    function headerMotion() {
      root.dataset.headerMotion = state.running && !document.hidden ? 'running' : 'paused';
    }
    document.addEventListener('visibilitychange', headerMotion);
    reduced.addEventListener('change', onReduce);
    VizLabRuntime.onDispose(() => {
      if (disposed) return;
      disposed = true;
      clearTimeout(toastTimer);
      clearInterval(clockTimer);
      chartObserver.disconnect();
      root.removeEventListener('click', click);
      root.removeEventListener('change', change);
      root.removeEventListener('keydown', key);
      reduced.removeEventListener('change', onReduce);
      document.removeEventListener('visibilitychange', headerMotion);
      twin?.dispose();
    });
  }
  window.ObservatoryDashboard = { mount, helpers };
})();
