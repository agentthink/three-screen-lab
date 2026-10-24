/* SPDX-License-Identifier: MIT — original procedural scenes and rendering. */
(() => {
  'use strict';
  const T = window.THREE;
  const builders = {};
  function create(host, kind, options = {}) {
    if (!T || !builders[kind]) throw new Error('Scene unavailable');
    const renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.id = 'observatory-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', options.label || '可交互三维场景');
    canvas.setAttribute('aria-describedby', 'scene-instructions');
    host.append(canvas);
    const scene = new T.Scene();
    const root = new T.Group();
    scene.add(root);
    const hemi = new T.HemisphereLight('#e2f5ff', '#1b2332', 2.4);
    scene.add(hemi);
    const sun = new T.DirectionalLight('#fff1d8', 3.6);
    sun.position.set(-18, 35, 23);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 1,
      far: 95,
    });
    sun.shadow.normalBias = 0.045;
    sun.shadow.bias = -0.0003;
    scene.add(sun);
    const rim = new T.DirectionalLight(options.accent || '#9be8db', 2.1);
    rim.position.set(18, 12, -20);
    scene.add(rim);
    const camera = new T.OrthographicCamera(-25, 25, 20, -20, 0.1, 180);
    const initial = { azimuth: 0.66, elevation: 0.68, zoom: 1.28 };
    const view = { ...initial },
      desired = { ...initial };
    const target = new T.Vector3(0, 0.5, 0);
    const geometries = new Map(),
      materials = new Map();
    const picks = [],
      animations = [],
      cleanup = [];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false,
      running = !reduce.matches,
      orbit = false,
      mode = 'all',
      selected = null;
    let frame = 0,
      previous = 0,
      elapsed = 0,
      width = 1,
      height = 1,
      pointer = null,
      dirty = true,
      projectedAt = 0;
    const highlights = new Map();
    const material = (color, extra = {}) => {
      const key = color + JSON.stringify(extra);
      if (!materials.has(key))
        materials.set(
          key,
          new T.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.15, ...extra }),
        );
      return materials.get(key);
    };
    function geometry(type, args) {
      const key = type + args.join(':');
      if (!geometries.has(key)) geometries.set(key, new T[type](...args));
      return geometries.get(key);
    }
    function add(type, args, position, color, scale = [1, 1, 1], extra = {}, parent = root) {
      const mesh = new T.Mesh(geometry(type, args), material(color, extra));
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      mesh.castShadow = !extra.transparent;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function ring(x, z, radius, color, parent = root) {
      const mesh = add(
        'TorusGeometry',
        [radius, 0.024, 6, 70],
        [x, 0.28, z],
        color,
        [1, 1, 1],
        { emissive: color, emissiveIntensity: 0.7 },
        parent,
      );
      mesh.rotation.x = -Math.PI / 2;
      return mesh;
    }
    function pick(id, mesh, position, size, layer = 'all') {
      const proxy = new T.Mesh(
        geometry('BoxGeometry', [1, 1, 1]),
        new T.MeshBasicMaterial({ visible: false }),
      );
      proxy.position.set(...position);
      proxy.scale.set(...size);
      proxy.userData.asset = id;
      root.add(proxy);
      picks.push(proxy);
      const group = new T.Group();
      root.add(group);
      ring(position[0], position[2], Math.max(size[0], size[2]) * 0.57, options.accent, group);
      group.visible = false;
      highlights.set(id, { mesh, group, layer });
      cleanup.push(() => proxy.material.dispose());
    }
    const state = {};
    const model = builders[kind]({ T, root, pick, animations, state });
    function sync() {
      canvas.dataset.ready = 'true';
      canvas.dataset.running = String(running);
      canvas.dataset.orbit = String(orbit);
      canvas.dataset.view = desired.elevation > 1.3 ? 'top' : 'perspective';
      canvas.dataset.zoom = desired.zoom.toFixed(2);
      canvas.dataset.focus = mode;
      canvas.dataset.selected = selected || '';
      canvas.dataset.drawCalls = String(renderer.info.render.calls);
      options.onView?.({ running, orbit, top: desired.elevation > 1.3 });
    }
    function select(id, notify = true) {
      if (!highlights.has(id)) return;
      selected = id;
      highlights.forEach((value, key) => {
        value.group.visible = key === id || (mode !== 'all' && value.layer === mode);
      });
      dirty = true;
      sync();
      if (notify) options.onSelect?.(id);
    }
    const on = (target, name, fn, config) => {
      target.addEventListener(name, fn, config);
      cleanup.push(() => target.removeEventListener(name, fn, config));
    };
    const raycaster = new T.Raycaster(),
      ndc = new T.Vector2();
    function hit(event) {
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      );
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObjects(picks, false)[0]?.object.userData.asset;
    }
    on(canvas, 'pointerdown', (event) => {
      if (event.button !== 0) return;
      pointer = {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        id: event.pointerId,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.focus({ preventScroll: true });
    });
    on(canvas, 'pointermove', (event) => {
      if (!pointer) {
        canvas.style.cursor = hit(event) ? 'pointer' : 'grab';
        return;
      }
      desired.azimuth -= (event.clientX - pointer.x) * 0.006;
      desired.elevation = T.MathUtils.clamp(
        desired.elevation + (event.clientY - pointer.y) * 0.004,
        0.2,
        1.53,
      );
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      orbit = false;
      dirty = true;
    });
    on(canvas, 'pointerup', (event) => {
      if (!pointer) return;
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 5) {
        const id = hit(event);
        if (id) select(id);
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      pointer = null;
      sync();
    });
    on(canvas, 'pointercancel', () => {
      pointer = null;
    });
    on(
      canvas,
      'wheel',
      (event) => {
        if (innerWidth < 1050 && !event.ctrlKey) return;
        event.preventDefault();
        zoom(Math.exp(-event.deltaY * 0.001));
      },
      { passive: false },
    );
    on(canvas, 'keydown', (event) => {
      if (
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'r', 'R'].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      orbit = false;
      if (event.key === 'ArrowLeft') desired.azimuth += 0.1;
      if (event.key === 'ArrowRight') desired.azimuth -= 0.1;
      if (event.key === 'ArrowUp') desired.elevation = Math.min(1.53, desired.elevation + 0.08);
      if (event.key === 'ArrowDown') desired.elevation = Math.max(0.2, desired.elevation - 0.08);
      if ('+=-'.includes(event.key)) zoom(event.key === '-' ? 0.9 : 1.1);
      if (event.key.toLowerCase() === 'r') reset();
      dirty = true;
      sync();
    });
    function zoom(factor) {
      desired.zoom = T.MathUtils.clamp(desired.zoom * factor, 0.7, 1.9);
      dirty = true;
      sync();
    }
    function reset() {
      Object.assign(desired, initial);
      orbit = false;
      dirty = true;
      sync();
    }
    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      const aspect = width / height,
        vertical = Math.max(19, 28 / aspect);
      camera.left = -vertical * aspect;
      camera.right = vertical * aspect;
      camera.top = vertical;
      camera.bottom = -vertical;
      camera.updateProjectionMatrix();
      dirty = true;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    function render(time) {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden) {
        previous = time;
        return;
      }
      const moving =
        Math.abs(view.azimuth - desired.azimuth) +
          Math.abs(view.elevation - desired.elevation) +
          Math.abs(view.zoom - desired.zoom) >
        0.0001;
      if (!running && !orbit && !dirty && !moving) {
        previous = time;
        return;
      }
      if (time - previous < 32 && !dirty) return;
      const dt = Math.min(0.05, Math.max(0, (time - previous) / 1000));
      previous = time;
      if (running) {
        elapsed += dt;
        animations.forEach((fn) => fn(elapsed, state));
      }
      if (orbit) desired.azimuth += dt * 0.09;
      const damping = reduce.matches ? 1 : 0.16;
      view.azimuth += (desired.azimuth - view.azimuth) * damping;
      view.elevation += (desired.elevation - view.elevation) * damping;
      view.zoom += (desired.zoom - view.zoom) * damping;
      const radius = 65,
        horizontal = Math.cos(view.elevation) * radius;
      camera.position.set(
        Math.sin(view.azimuth) * horizontal,
        Math.sin(view.elevation) * radius,
        Math.cos(view.azimuth) * horizontal,
      );
      camera.zoom = view.zoom;
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      dirty = false;
      sync();
      if (time - projectedAt > 100) {
        projectedAt = time;
        options.onProject?.(
          picks.map((proxy) => {
            const point = proxy.position.clone();
            point.y += proxy.scale.y * 0.5 + 0.5;
            point.project(camera);
            return {
              id: proxy.userData.asset,
              x: ((point.x + 1) * width) / 2,
              y: ((1 - point.y) * height) / 2,
              visible: point.z < 1 && Math.abs(point.x) < 0.84 && Math.abs(point.y) < 0.75,
            };
          }),
        );
      }
    }
    const onReduce = () => {
      if (reduce.matches) {
        running = false;
        orbit = false;
      }
      dirty = true;
      sync();
    };
    on(reduce, 'change', onReduce);
    frame = requestAnimationFrame(render);
    const api = {
      zoom,
      reset,
      select,
      setRunning(value) {
        running = value;
        dirty = true;
        sync();
      },
      setOrbit(value) {
        orbit = value;
        dirty = true;
        sync();
      },
      setTop(value) {
        desired.elevation = value ? 1.5 : initial.elevation;
        orbit = false;
        dirty = true;
        sync();
      },
      setMode(value) {
        mode = value;
        model?.setLayer?.(value);
        highlights.forEach((v) => {
          v.group.visible = value !== 'all' && v.layer === value;
        });
        dirty = true;
        sync();
      },
      simulate(value) {
        Object.assign(state, value);
        dirty = true;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        cleanup.forEach((fn) => fn());
        const ownedGeometry = new Set(geometries.values()),
          ownedMaterial = new Set(materials.values());
        root.traverse((o) => {
          if (o.geometry) ownedGeometry.add(o.geometry);
          if (o.material)
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
              ownedMaterial.add(m),
            );
        });
        ownedGeometry.forEach((g) => g.dispose());
        ownedMaterial.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
    on(canvas, 'webglcontextlost', (event) => {
      event.preventDefault();
      options.onLost?.();
      api.dispose();
    });
    VizLabRuntime.onDispose(api.dispose);
    return api;
  }
  window.ObservatoryScenes = { builders, create };
})();
