/* Editable, metric-scale factory geometry. Three.js r160, no remote assets. */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T) return;
  const TAU = Math.PI * 2;
  const up = new T.Vector3(0, 1, 0);

  function create(host, options = {}) {
    const renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.id = 'factory-3d-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      '实时三维厂区：拖动旋转，滚轮缩放，方向键调整视角，R 键复位，Enter 查看冷却塔',
    );
    const scene = new T.Scene();
    const plant = new T.Group();
    plant.name = '智慧工厂 · 建筑与设备实体';
    scene.add(plant);
    const camera = new T.OrthographicCamera(-115, 115, 67, -67, 0.1, 1500);
    const target = new T.Vector3(0, 9, 0);
    const initial = { azimuth: (34 * Math.PI) / 180, elevation: (27 * Math.PI) / 180, zoom: 1 };
    let view = { ...initial },
      spinning = false,
      disposed = false,
      activeHost = host;
    let pointerDown = null,
      hovered = null,
      dirty = true,
      frame = 0,
      previous = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seed = 20261020;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const batches = new Map(),
      animations = [],
      pickable = [];
    let night = false,
      themeTransition = null;
    const wipe = {
      uFromNight: { value: 0 },
      uToNight: { value: 0 },
      uSweep: { value: 1 },
      uWipeWidth: { value: 1000 },
      uWipeOffset: { value: 0 },
      uWipeSpan: { value: 1 },
    };
    function beveledBox() {
      const b = 0.018,
        shape = new T.Shape();
      shape.moveTo(-0.5 + b, -0.5 + b);
      shape.lineTo(0.5 - b, -0.5 + b);
      shape.lineTo(0.5 - b, 0.5 - b);
      shape.lineTo(-0.5 + b, 0.5 - b);
      shape.closePath();
      const geo = new T.ExtrudeGeometry(shape, {
        depth: 1 - 2 * b,
        steps: 1,
        bevelEnabled: true,
        bevelThickness: b,
        bevelSize: b,
        bevelSegments: 3,
        curveSegments: 1,
      });
      geo.translate(0, 0, -0.5 + b);
      return geo;
    }
    const geometries = {
      beveled: beveledBox(),
      box: new T.BoxGeometry(1, 1, 1),
      cylinder: new T.CylinderGeometry(1, 1, 1, 16),
      foliage: new T.IcosahedronGeometry(1, 1),
      sphere: new T.SphereGeometry(1, 16, 8),
    };

    function texture(kind) {
      const c = document.createElement('canvas');
      c.width = c.height = 512;
      const x = c.getContext('2d');
      x.fillStyle = kind === 'concrete' ? '#a7bdc5' : kind === 'metal' ? '#b4c7cf' : '#65766e';
      x.fillRect(0, 0, 512, 512);
      const pixels = x.getImageData(0, 0, 512, 512);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const v = (rand() - 0.5) * (kind === 'ground' ? 30 : 13);
        for (let k = 0; k < 3; k++) pixels.data[i + k] += v;
      }
      x.putImageData(pixels, 0, 0);
      if (kind === 'concrete') {
        x.lineWidth = 0.65;
        x.strokeStyle = '#637e8c32';
        for (let y = 0; y < 512; y += 24) {
          x.beginPath();
          x.moveTo(0, y);
          x.lineTo(512, y);
          x.stroke();
        }
        for (let i = 0; i < 48; i++) {
          const xx = (i * 512) / 48;
          x.strokeStyle = i % 4 ? '#57758619' : '#d5e0e52c';
          x.beginPath();
          x.moveTo(xx, 0);
          x.lineTo(xx, 512);
          x.stroke();
        }
        for (let i = 0; i < 150; i++) {
          const xx = rand() * 512;
          x.fillStyle = '#3b586306';
          x.fillRect(xx, rand() * 450, 1 + rand() * 2, 30 + rand() * 100);
        }
      } else if (kind === 'metal') {
        for (let i = 0; i < 512; i += 4) {
          x.fillStyle = '#47627340';
          x.fillRect(i, 0, 1, 512);
          x.fillStyle = '#ffffff50';
          x.fillRect(i + 1, 0, 1, 512);
        }
        x.fillStyle = '#627e8b38';
        for (let y = 0; y < 512; y += 128) x.fillRect(0, y, 512, 2);
      } else {
        x.strokeStyle = '#94aa9633';
        x.lineWidth = 0.7;
        for (let i = 0; i < 5000; i++) {
          const xx = rand() * 512,
            yy = rand() * 512;
          x.beginPath();
          x.moveTo(xx, yy);
          x.lineTo(xx + rand() * 2, yy - 2 - rand() * 3);
          x.stroke();
        }
      }
      const t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }
    const concreteMap = texture('concrete'),
      sheetMap = texture('metal'),
      grassMap = texture('ground');
    // Generated achromatic mask is reused as a restrained, recolorable panel texture.
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridCanvas.height = 1024;
    const gridContext = gridCanvas.getContext('2d');
    gridContext.fillStyle = '#000';
    gridContext.fillRect(0, 0, 1024, 1024);
    const gridMap = new T.CanvasTexture(gridCanvas);
    gridMap.colorSpace = T.NoColorSpace;
    gridMap.wrapS = gridMap.wrapT = T.RepeatWrapping;
    gridMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const paintCanvas = document.createElement('canvas');
    paintCanvas.width = paintCanvas.height = 1024;
    const paintContext = paintCanvas.getContext('2d');
    paintContext.fillStyle = '#b2c3cc';
    paintContext.fillRect(0, 0, 1024, 1024);
    const paintMap = new T.CanvasTexture(paintCanvas);
    paintMap.colorSpace = T.SRGBColorSpace;
    paintMap.wrapS = paintMap.wrapT = T.RepeatWrapping;
    paintMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const gridImage = new Image();
    gridImage.onload = () => {
      gridContext.drawImage(gridImage, 0, 0, 1024, 1024);
      const data = gridContext.getImageData(0, 0, 1024, 1024),
        pixels = paintContext.createImageData(1024, 1024);
      for (let i = 0; i < data.data.length; i += 4) {
        const l = data.data[i] / 255;
        pixels.data[i] = 178 - l * 26;
        pixels.data[i + 1] = 195 - l * 23;
        pixels.data[i + 2] = 204 - l * 20;
        pixels.data[i + 3] = 255;
      }
      paintContext.putImageData(pixels, 0, 0);
      gridMap.needsUpdate = true;
      paintMap.needsUpdate = true;
      dirty = true;
      canvas.dataset.textureReady = 'true';
    };
    gridImage.src = window.FACTORY_GRID_MASK;
    const mat = (color, roughness = 0.76, metalness = 0.12, extra = {}) =>
      new T.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    const m = {
      shell: mat('#c4d5df', 0.86, 0.08, { map: paintMap }),
      inside: mat('#5b7b8e', 0.95, 0.02, { side: T.BackSide, map: concreteMap }),
      metal: mat('#b5c8d4', 0.72, 0.23, { map: paintMap }),
      roof: mat('#9fb8c5', 0.88, 0.12),
      white: mat('#a6bec9', 0.86, 0.08),
      trim: mat('#8faab9', 0.52, 0.32),
      steel: mat('#486d80', 0.7, 0.38),
      band: mat('#243f54', 0.8, 0.16),
      glass: mat('#385e73', 0.28, 0.54),
      window: mat('#294d60', 0.36, 0.3),
      vent: mat('#547382', 0.88, 0.2),
      pipe: mat('#7e9aaa', 0.55, 0.35),
      asphalt: mat('#52656b', 0.96, 0),
      curb: mat('#a4b7b8', 0.91, 0),
      grass: mat('#71866e', 1, 0, { map: grassMap }),
      leaf: mat('#45634e', 1, 0),
      leafLight: mat('#647b57', 1, 0),
      trunk: mat('#677266', 1, 0),
      base: mat('#547783', 0.86, 0.16),
      foundation: mat('#294756', 0.8, 0.23),
      lane: mat('#b8c5bf', 1, 0),
      light: new T.MeshBasicMaterial({ color: '#91d4e9' }),
      water: mat('#507682', 0.27, 0.45),
    };
    const tmp = new T.Object3D(),
      matrix = new T.Matrix4();
    function instance(geo, material, position, scale, zone = '', rotation = null) {
      const key = geo.uuid + material.uuid + zone;
      if (!batches.has(key)) batches.set(key, { geo, material, zone, items: [] });
      tmp.position.set(...position);
      tmp.scale.set(...scale);
      tmp.quaternion.identity();
      if (rotation instanceof T.Quaternion) tmp.quaternion.copy(rotation);
      else if (rotation) tmp.rotation.set(...rotation);
      tmp.updateMatrix();
      batches.get(key).items.push(tmp.matrix.clone());
    }
    const box = (x, y, z, w, h, d, material = m.white, zone = '', rotation = null) =>
      instance(
        material === m.metal || material === m.roof || (material === m.white && w >= 10 && h >= 3)
          ? geometries.beveled
          : geometries.box,
        material,
        [x, y, z],
        [w, h, d],
        zone,
        rotation,
      );
    const cylinder = (x, y, z, r, h, material = m.pipe, zone = '') =>
      instance(geometries.cylinder, material, [x, y, z], [r, h, r], zone);
    function beam(a, b, r, material = m.steel, zone = '') {
      const aa = new T.Vector3(...a),
        bb = new T.Vector3(...b),
        dir = bb.clone().sub(aa);
      instance(
        geometries.cylinder,
        material,
        aa.add(bb).multiplyScalar(0.5).toArray(),
        [r, dir.length(), r],
        zone,
        new T.Quaternion().setFromUnitVectors(up, dir.normalize()),
      );
    }
    function mesh(geo, material, x = 0, y = 0, z = 0, zone = '', parent = plant) {
      const v = new T.Mesh(geo, material);
      v.position.set(x, y, z);
      v.castShadow = true;
      v.receiveShadow = true;
      v.userData.zone = zone;
      parent.add(v);
      if (zone) pickable.push(v);
      return v;
    }
    function pipe(points, r = 0.5, zone = 'production') {
      return mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(
            points.map((v) => new T.Vector3(...v)),
            false,
            'centripetal',
          ),
          Math.max(16, points.length * 10),
          r,
          10,
          false,
        ),
        m.pipe,
        0,
        0,
        0,
        zone,
      );
    }
    function torus(x, y, z, r, tube, material = m.trim, zone = '') {
      const v = mesh(new T.TorusGeometry(r, tube, 8, 96), material, x, y, z, zone);
      v.rotation.x = Math.PI / 2;
      return v;
    }

    scene.add(new T.HemisphereLight('#d7edfa', '#243b49', 2.15));
    const keyLight = new T.DirectionalLight('#e5f2f8', 3.1);
    keyLight.position.set(-75, 150, 100);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(keyLight.shadow.camera, {
      left: -145,
      right: 145,
      top: 130,
      bottom: -100,
      near: 20,
      far: 400,
    });
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.12;
    keyLight.shadow.radius = 3;
    scene.add(keyLight);
    const rim = new T.DirectionalLight('#7ebdda', 1.35);
    rim.position.set(100, 60, -100);
    scene.add(rim);
    const fill = new T.DirectionalLight('#b1cad6', 0.6);
    fill.position.set(0, 25, 150);
    scene.add(fill);

    // A physical site slab, restrained floating blue plinths, and paved service roads.
    box(0, -1.1, 0, 190, 2.2, 96, m.base);
    box(0, -2.38, 0, 190.4, 0.36, 96.4, m.foundation);
    box(0, 0.04, 0, 188.8, 0.12, 94.8, m.grass);
    const plinthMaterial = new T.MeshBasicMaterial({
      color: '#367c9d',
      transparent: true,
      opacity: 0.23,
      depthWrite: false,
    });
    box(0, -7, 0, 202, 0.22, 106, plinthMaterial);
    box(
      0,
      -18,
      0,
      213,
      0.14,
      112,
      new T.MeshBasicMaterial({
        color: '#2d6482',
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    function road(x, z, w, d) {
      box(x, 0.16, z, w + 0.5, 0.14, d + 0.5, m.curb);
      box(x, 0.25, z, w, 0.09, d, m.asphalt);
      if (w > d)
        for (let xx = x - w / 2 + 1.5; xx < x + w / 2; xx += 5)
          box(xx, 0.31, z, 2, 0.015, 0.09, m.lane);
      else
        for (let zz = z - d / 2 + 1.5; zz < z + d / 2; zz += 5)
          box(x, 0.31, zz, 0.09, 0.015, 2, m.lane);
    }
    road(0, 42, 183, 5.1);
    road(0, -42, 183, 4.5);
    road(-89, 0, 4.2, 84);
    road(89, 0, 4.2, 84);
    road(-13, 0, 5, 80);
    road(14, 0, 4.5, 80);
    road(42, 29, 93, 4);
    road(-51, 28, 67, 4);
    road(-77, -14, 4, 48);
    road(-53, -30, 69, 3.6);
    road(69, -14, 4.6, 49);
    for (let x = -88; x <= 88; x += 4.5) {
      box(x, 0.32, 45.5, 2.7, 0.06, 0.2, m.curb);
      box(x, 0.32, -45.5, 2.7, 0.06, 0.2, m.curb);
    }

    // Hyperbolic tower: independent outer wall, internal wall, open rim, louvres and bracing.
    const cx = -48,
      cz = 10;
    const radius = (y) => 12.7 + 0.0078 * (y - 52) ** 2;
    const towerProfile = [];
    for (let y = 9; y <= 69; y += 0.5)
      towerProfile.push(new T.Vector2(radius(y), 9 + (y - 9) * 0.937));
    const tower = mesh(new T.LatheGeometry(towerProfile, 160), m.shell, cx, 0, cz, 'cooling');
    tower.name = 'CT-01 · 双曲线混凝土塔壳';
    const innerProfile = [];
    for (let y = 32; y <= 69; y += 0.5)
      innerProfile.push(new T.Vector2(radius(y) - 0.55, 9 + (y - 9) * 0.937));
    mesh(new T.LatheGeometry(innerProfile, 128), m.inside, cx, 0, cz, 'cooling');
    cylinder(cx, 32, cz, radius(32) - 0.65, 0.18, m.band, 'cooling');
    torus(cx, 65.22, cz, radius(69) - 0.12, 0.32, m.trim, 'cooling');
    torus(cx, 9, cz, radius(9), 0.34, m.trim, 'cooling');
    for (const start of [54, 59]) {
      const p = [];
      for (let y = start; y <= start + 1.8; y += 0.15)
        p.push(new T.Vector2(radius(y) + 0.045, 9 + (y - 9) * 0.937));
      mesh(new T.LatheGeometry(p, 160), m.band, cx, 0, cz, 'cooling');
    }
    cylinder(cx, 0.7, cz, 26.4, 1.2, m.white, 'cooling');
    cylinder(cx, 4.6, cz, 25.5, 7.5, m.band, 'cooling');
    for (let y = 1.7; y < 8.8; y += 0.62) torus(cx, y, cz, 25.6, 0.105, m.vent, 'cooling');
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU,
        b = ((i + 1) / 72) * TAU,
        r = 25.8;
      beam(
        [cx + Math.cos(a) * r, 1.3, cz + Math.sin(a) * r],
        [cx + Math.cos(a) * r, 9, cz + Math.sin(a) * r],
        0.13,
        m.trim,
        'cooling',
      );
      beam(
        [cx + Math.cos(a) * r, 1.4, cz + Math.sin(a) * r],
        [cx + Math.cos(b) * r, 8.8, cz + Math.sin(b) * r],
        0.075,
        m.trim,
        'cooling',
      );
    }
    torus(cx, 1.25, cz, 26.1, 0.24, m.trim, 'cooling');
    // Water channels, circulation pumps and the service entrance beneath the tower.
    box(-48, 0.65, 26.5, 37, 0.25, 2.1, m.water, 'cooling');
    for (let i = 0; i < 6; i++) {
      box(-32 + i * 2.4, 1, -14, 1.65, 1.5, 3, m.vent, 'cooling');
      cylinder(-32 + i * 2.4, 2, -14, 0.55, 1, m.pipe, 'cooling');
    }

    function building(x, z, w, d, h, zone = 'production', type = 'industrial') {
      box(x, 0.45, z, w + 1, 0.6, d + 1, m.curb, zone);
      box(x, h / 2 + 0.6, z, w, h, d, type === 'office' ? m.white : m.metal, zone);
      box(x, h + 0.7, z, w + 0.6, 0.55, d + 0.6, m.roof, zone);
      box(x, 1.5, z, w + 0.16, 1.3, d + 0.16, m.steel, zone);
      for (const side of [-1, 1]) {
        box(
          x,
          Math.max(2.5, h * 0.76),
          z + side * (d / 2 + 0.06),
          w,
          0.72,
          0.14,
          type === 'office' ? m.glass : m.vent,
          zone,
        );
        box(
          x + side * (w / 2 + 0.06),
          Math.max(2.5, h * 0.76),
          z,
          0.14,
          0.72,
          d,
          type === 'office' ? m.glass : m.vent,
          zone,
        );
      }
      if (type === 'office') {
        for (let yy = 2.2; yy < h; yy += 2.6) {
          for (let xx = x - w / 2 + 1; xx < x + w / 2 - 0.5; xx += 2.1) {
            box(xx, yy, z + d / 2 + 0.06, 0.86, 1.0, 0.12, m.window, zone);
            box(xx, yy, z - d / 2 - 0.06, 0.86, 1.0, 0.12, m.window, zone);
          }
          for (let zz = z - d / 2 + 1; zz < z + d / 2 - 0.5; zz += 2.1) {
            box(x + w / 2 + 0.06, yy, zz, 0.12, 1.0, 0.86, m.window, zone);
            box(x - w / 2 - 0.06, yy, zz, 0.12, 1.0, 0.86, m.window, zone);
          }
        }
      } else {
        for (let xx = x - w / 2; xx <= x + w / 2; xx += 2.6) {
          box(xx, h / 2 + 0.6, z + d / 2 + 0.13, 0.12, h, 0.18, m.trim, zone);
          box(xx, h / 2 + 0.6, z - d / 2 - 0.13, 0.12, h, 0.18, m.trim, zone);
        }
        for (let zz = z - d / 2; zz <= z + d / 2; zz += 2.6) {
          box(x + w / 2 + 0.13, h / 2 + 0.6, zz, 0.18, h, 0.12, m.trim, zone);
          box(x - w / 2 - 0.13, h / 2 + 0.6, zz, 0.18, h, 0.12, m.trim, zone);
        }
        for (let xx = x - w / 2 + 3; xx < x + w / 2 - 1; xx += 4.2)
          box(xx, h + 1.4, z, 2.1, 1.1, d * 0.7, m.white, zone);
      }
      return { x, z, w, d, h };
    }
    // Main boiler houses with recessed louvre belts, sawtooth rooflights and annexes.
    building(36, -15, 22, 25, 30);
    building(57, -24, 22, 25, 38);
    building(46, 10, 51, 18, 17);
    building(67, 11, 10, 35, 24);
    building(44, 23, 50, 9, 10);
    building(77, -22, 12, 27, 13);
    building(20, 0, 12, 14, 16);
    box(17, 7.5, 7.1, 13, 12, 0.18, m.glass, 'production');
    for (let i = 0; i < 5; i++) box(11 + i * 3.1, 7.5, 7.28, 0.24, 12, 0.3, m.trim, 'production');
    box(17, 7.5, 7.28, 13, 0.24, 0.3, m.trim, 'production');
    // External ducts, a stair tower, plant ladders, service platforms and handrails.
    cylinder(27, 16, -2, 1.1, 30, m.pipe, 'production');
    cylinder(29, 8, 3, 2.2, 14, m.pipe, 'production');
    cylinder(69, 20, -27, 0.8, 38, m.trim, 'production');
    for (let y = 5; y < 24; y += 3) {
      box(73, y, 13, 3, 0.2, 5, m.steel, 'production');
      for (const z of [10.5, 15.5])
        beam([71.5, y + 1, z], [74.5, y + 1, z], 0.06, m.trim, 'production');
    }
    for (let y = 1; y < 23; y += 0.6)
      beam([74.5, y, 11], [74.5, y, 13], 0.045, m.trim, 'production');
    for (const z of [11, 13]) beam([74.5, 0.8, z], [74.5, 24, z], 0.07, m.trim, 'production');
    for (let i = 0; i < 7; i++) {
      box(38 + i * 6, 4.5, 28, 4, 7, 1, m.vent, 'production');
      box(38 + i * 6, 5.5, 28.6, 3.2, 0.2, 0.25, m.trim, 'production');
    }

    function stack(x, z, r, h) {
      cylinder(x, h / 2 + 0.5, z, r, h, m.white, 'production');
      mesh(new T.CylinderGeometry(r * 0.78, r, 3, 32), m.roof, x, h + 2, z, 'production');
      cylinder(x, h + 3.7, z, r * 0.54, 1, m.trim, 'production');
      for (let y = 5; y < h; y += 6) {
        torus(x, y, z, r + 0.06, 0.08, m.steel, 'production');
      }
      torus(x, h - 1, z, r + 1, 0.16, m.trim, 'production');
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        beam(
          [x + Math.cos(a) * (r + 0.8), h - 1, z + Math.sin(a) * (r + 0.8)],
          [x + Math.cos(a) * (r + 0.8), h + 0.3, z + Math.sin(a) * (r + 0.8)],
          0.045,
          m.trim,
          'production',
        );
      }
      torus(x, h + 0.3, z, r + 0.8, 0.055, m.trim, 'production');
      for (let y = 1; y < h; y += 0.7)
        beam([x + r + 0.2, y, z - 0.5], [x + r + 0.2, y, z + 0.5], 0.04, m.trim, 'production');
      for (const dz of [-0.5, 0.5])
        beam([x + r + 0.2, 1, z + dz], [x + r + 0.2, h + 1, z + dz], 0.06, m.trim, 'production');
    }
    stack(3, -17, 3.1, 27);
    stack(-7, 2, 2.5, 18);
    building(-1, -30, 11, 9, 6, 'production', 'office');
    building(-5, 19, 13, 7, 5, 'production', 'office');
    building(6, -3, 12, 9, 7, 'production', 'office');
    for (let i = 0; i < 4; i++) cylinder(-12 + i * 4, 8, -33, 1.65, 14, m.white, 'production');
    // Two levels of process pipework, with rounded elbows and structural pipe racks.
    for (let i = 0; i < 4; i++)
      pipe(
        [
          [-22, 9 + i * 0.75, 1 + i * 0.7],
          [-15, 9 + i * 0.75, 1 + i * 0.7],
          [-10, 9 + i * 0.75, -3],
          [5, 9 + i * 0.75, -3],
          [18, 9 + i * 0.75, -3],
          [22, 9 + i * 0.75, -10],
        ],
        0.4,
      );
    pipe(
      [
        [-22, 12, -6],
        [-15, 12, -6],
        [-12, 12, -9],
        [2, 12, -9],
        [7, 12, -4],
        [22, 12, -4],
      ],
      1.25,
    );
    for (let i = 0; i < 5; i++)
      pipe(
        [
          [-32, 5.7 + i * 0.42, 24 + i * 0.55],
          [0, 5.7 + i * 0.42, 24 + i * 0.55],
          [25, 5.7 + i * 0.42, 24 + i * 0.55],
          [63, 5.7 + i * 0.42, 24 + i * 0.55],
        ],
        0.23,
        'storage',
      );
    for (let x = -31; x <= 63; x += 7) {
      for (const z of [23.7, 27.8]) beam([x, 0.5, z], [x, 8.4, z], 0.12, m.steel, 'storage');
      beam([x, 8.2, 23.7], [x, 8.2, 27.8], 0.14, m.steel, 'storage');
      if (x < 60) {
        beam([x, 2, 23.7], [x + 7, 8, 23.7], 0.075, m.trim, 'storage');
      }
    }

    // Enclosed diagonal belt conveyor. The shell and supporting truss are real solids.
    const ca = new T.Vector3(58, 22, -2),
      cb = new T.Vector3(91, 4, 17),
      cd = cb.clone().sub(ca),
      cq = new T.Quaternion().setFromUnitVectors(up, cd.clone().normalize());
    instance(
      geometries.box,
      m.roof,
      ca.clone().add(cb).multiplyScalar(0.5).toArray(),
      [3.8, cd.length(), 3.2],
      'storage',
      cq,
    );
    for (let i = 0; i <= 8; i++) {
      const p = ca.clone().lerp(cb, i / 8);
      beam([p.x, p.y - 1.5, p.z], [p.x, 0.7, p.z], 0.16, m.steel, 'storage');
      if (i < 8) {
        const n = ca.clone().lerp(cb, (i + 1) / 8);
        beam([p.x, 0.8, p.z], [n.x, n.y - 1.6, n.z], 0.1, m.trim, 'storage');
      }
    }
    for (const dx of [-1.6, 1.6])
      beam([ca.x + dx, ca.y - 1.6, ca.z], [cb.x + dx, cb.y - 1.6, cb.z], 0.13, m.trim, 'storage');

    // Low workshops, administration buildings and water-treatment equipment.
    building(-78, -27, 19, 7, 4, 'storage', 'office');
    building(-78, -11, 17, 7, 4, 'storage', 'office');
    building(-80, 8, 14, 7, 4, 'storage', 'office');
    building(-74, 34, 17, 6, 4, 'storage', 'office');
    building(-23, 37, 17, 5, 4, 'storage', 'office');
    building(-26, -33, 14, 7, 4, 'storage', 'office');
    building(3, 35, 16, 7, 4, 'storage', 'office');
    building(27, 37, 13, 9, 5, 'storage');
    building(44, 36, 11, 10, 6, 'storage');
    building(63, 34, 13, 15, 13, 'storage', 'office');
    building(82, 35, 9, 13, 5, 'storage', 'office');
    // Glazed south facade and finely spaced mullions on the administration block.
    box(63, 7.4, 41.57, 11, 10, 0.16, m.glass, 'storage');
    for (let x = 58; x < 69; x += 1.35) box(x, 7.4, 41.75, 0.13, 10, 0.22, m.trim, 'storage');
    for (let y = 3; y < 13; y += 2.6) box(63, y, 41.75, 11, 0.13, 0.22, m.trim, 'storage');
    const tank = (x, z, r, h) => {
      cylinder(x, h / 2 + 0.5, z, r, h, m.white, 'storage');
      const cap = mesh(
        new T.SphereGeometry(r, 24, 10, 0, TAU, 0, Math.PI / 2),
        m.roof,
        x,
        h + 0.5,
        z,
        'storage',
      );
      cap.scale.y = 0.2;
      for (const y of [2, h * 0.55, h]) torus(x, y, z, r + 0.03, 0.06, m.steel, 'storage');
      beam([x + r + 0.15, 0.7, z], [x + r + 0.15, h + 0.9, z], 0.065, m.trim, 'storage');
    };
    tank(18, 34, 3.4, 7);
    tank(23, 30, 3.4, 9);
    tank(17, 24, 2.3, 6);
    box(-1, 0.45, 18, 14, 0.2, 6, m.curb, 'storage');
    const fanMaterial = mat('#456777', 0.62, 0.44);
    for (let i = 0; i < 4; i++) {
      const x = -5 + i * 3.4,
        z = 16.8;
      box(x, 2.1, z, 3, 3.1, 4, m.white, 'storage');
      cylinder(x, 3.8, z, 1.2, 0.28, m.vent, 'storage');
      torus(x, 4, z, 1.2, 0.11, m.trim, 'storage');
      const fan = new T.Group();
      fan.position.set(x, 4, z);
      plant.add(fan);
      fan.userData.zone = 'storage';
      for (let a = 0; a < 4; a++) {
        const blade = mesh(
          new T.BoxGeometry(0.42, 0.06, 1),
          fanMaterial,
          0,
          0,
          0.4,
          'storage',
          fan,
        );
        blade.rotation.y = (a * Math.PI) / 2;
        blade.position.set(Math.sin((a * Math.PI) / 2) * 0.4, 0, Math.cos((a * Math.PI) / 2) * 0.4);
      }
      animations.push(fan);
    }
    // Roof machinery, loading bays, pallets and road vehicles bring scale to the model.
    for (const [x, z, h] of [
      [36, -15, 31.5],
      [57, -24, 39.5],
      [44, 10, 18.5],
      [44, 23, 11.5],
    ]) {
      for (let i = 0; i < 3; i++) {
        box(x - 6 + i * 5, h, z + 2, 3, 1.5, 2.5, m.white, 'production');
        box(x - 6 + i * 5, h + 0.85, z + 2, 2.5, 0.1, 2, m.vent, 'production');
      }
    }
    for (let i = 0; i < 12; i++) {
      box(73 + (i % 3) * 2.2, 0.9, -3 + Math.floor(i / 3) * 2, 1.5, 1.2, 1.4, m.steel, 'storage');
    }
    function truck(x, z, flip = false) {
      const y = 0.55;
      box(x, y + 1, z, 2.5, 1.8, 5, m.white, 'storage');
      box(x, y + 1, z + 3.4, 2.3, 1.7, 1.6, m.trim, 'storage');
      box(x, y + 1.4, z + 4.25, 1.8, 0.65, 0.05, m.glass, 'storage');
      for (const xx of [-1.25, 1.25])
        for (const zz of [-1.8, 1.8, 3.3]) {
          const wheel = mesh(
            new T.CylinderGeometry(0.45, 0.45, 0.22, 10),
            m.band,
            x + xx,
            y - 0.05,
            z + zz,
            'storage',
          );
          wheel.rotation.z = Math.PI / 2;
        }
    }
    truck(-13, 29);
    truck(88, -32);
    for (let i = 0; i < 9; i++) {
      box(51 + i * 3.1, 0.34, 44.5, 2.2, 0.03, 3, m.curb);
      box(51 + i * 3.1, 0.45, 44.5, 1.4, 0.4, 2.4, i % 2 ? m.glass : m.white);
    }
    // Individual trees are instanced in three material batches, not image billboards.
    function tree(x, z, size = 1) {
      const h = (2.3 + rand() * 1.4) * size;
      cylinder(x, h * 0.4, z, 0.12 * size, h * 0.8, m.trunk);
      for (let j = 0; j < 3; j++) {
        const material = j === 1 ? m.leafLight : m.leaf;
        instance(
          geometries.foliage,
          material,
          [
            x + (rand() - 0.5) * 1.1 * size,
            h * 0.7 + j * 0.38 * size,
            z + (rand() - 0.5) * 1.1 * size,
          ],
          [1.05 * size, 1.25 * size, 1.02 * size],
        );
      }
    }
    for (let x = -91; x < 93; x += 2.1) {
      tree(x, 46.5, 0.7 + rand() * 0.22);
      tree(x, -46.4, 0.65 + rand() * 0.3);
    }
    for (let z = -43; z < 43; z += 2.5) {
      tree(-93, z, 0.7);
      tree(93, z, 0.65);
    }
    for (let x = -85; x < -18; x += 2.4) tree(x, 23.8, 0.7);
    for (let x = -83; x < -22; x += 3.5) tree(x, -37, 0.65);
    for (let x = -8; x < 76; x += 2.8) if (x < 10 || x > 37) tree(x, 39.7, 0.62);
    for (let z = -33; z < 23; z += 3.4) {
      tree(-17, z, 0.7);
      if (z > 0) tree(10, z, 0.6);
    }
    // Loading yard, entrance gates, light poles and a small landscaped roundel.
    box(76, 0.36, 34, 15, 0.16, 18, m.asphalt, 'storage');
    torus(75, 0.49, 34, 2.8, 0.16, m.curb);
    cylinder(75, 0.5, 34, 2.55, 0.12, m.grass);
    tree(75, 34, 0.8);
    for (const x of [-86, 10, 87])
      for (const z of [-39, 39]) {
        beam([x, 0.4, z], [x, 6.5, z], 0.07, m.steel);
        beam([x, 6.5, z], [x + 1, 6.5, z], 0.06, m.steel);
        box(x + 1, 6.5, z, 1, 0.15, 0.4, m.light);
      }
    for (let x = -87; x < 90; x += 5) {
      beam([x, 0.5, -47], [x, 2.2, -47], 0.045, m.steel);
      beam([x, 1.9, -47], [x + 5, 1.9, -47], 0.045, m.steel);
    }

    for (const { geo, material, zone, items } of batches.values()) {
      const batch = new T.InstancedMesh(geo, material, items.length);
      items.forEach((v, i) => batch.setMatrixAt(i, v));
      batch.instanceMatrix.needsUpdate = true;
      batch.castShadow =
        material === m.leaf || material === m.leafLight ? false : !material.transparent;
      batch.receiveShadow = !material.transparent;
      batch.userData.zone = zone;
      batch.name = zone ? `${zone} · architectural details` : 'site details';
      plant.add(batch);
      if (zone) pickable.push(batch);
    }
    // Floating surveying lines reproduce the reference without masking the architecture.
    const survey = new T.Group();
    scene.add(survey);
    for (const y of [18, 27, 36]) {
      const pts = [
        [-96, y, -49],
        [96, y, -49],
        [96, y, 49],
        [-96, y, 49],
        [-96, y, -49],
      ].map((p) => new T.Vector3(...p));
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints(pts),
        new T.LineBasicMaterial({
          color: '#66bbdb',
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        }),
      );
      survey.add(line);
    }
    const selection = torus(
      cx,
      0.5,
      cz,
      28,
      0.1,
      new T.MeshBasicMaterial({ color: '#86daf0', transparent: true, opacity: 0.7 }),
    );
    selection.visible = false;
    plant.remove(selection);
    scene.add(selection);
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2();
    // Solid shading and Fresnel emission share one screen-space wipe.
    // View-space normals include instancing and bevels; the rim follows the camera.
    const wipeGLSL = `uniform float uFromNight,uToNight,uSweep,uWipeWidth,uWipeOffset,uWipeSpan;
      float screenX(){return uWipeOffset+gl_FragCoord.x/uWipeWidth*uWipeSpan;}
      float wipeEdge(){return mix(-.055,1.055,uSweep);}
      float nightWeight(){float mask=1.0-smoothstep(wipeEdge()-.018,wipeEdge()+.018,screenX());return mix(uFromNight,uToNight,mask);}
      float scanBeam(){return exp(-pow((screenX()-wipeEdge())/.008,2.0))*step(.001,uSweep)*step(uSweep,.999);}`;
    function applyWipe(material, isWire = false) {
      const painted = material === m.shell || material === m.metal;
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, wipe);
        if (painted) {
          shader.uniforms.uGridMask = { value: gridMap };
          shader.vertexShader = 'varying vec2 vFactoryGridUv;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvFactoryGridUv=uv;',
          );
        }
        shader.fragmentShader =
          wipeGLSL +
          (painted ? '\nuniform sampler2D uGridMask;varying vec2 vFactoryGridUv;' : '') +
          '\n' +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
          float nw=nightWeight();
          ${isWire ? 'if(nw<.002)discard;gl_FragColor.rgb=vec3(.025,.13,.35);gl_FragColor.a*=nw;' : `vec3 nightPaint=vec3(.008,.028,.054)+gl_FragColor.rgb*vec3(.08,.16,.25);${painted ? 'nightPaint=vec3(.009,.029,.052)+gl_FragColor.rgb*vec3(.055,.12,.20);' : ''}gl_FragColor.rgb=mix(gl_FragColor.rgb,nightPaint,nw);gl_FragColor.rgb+=scanBeam()*vec3(.025,.24,.46);`}`,
        );
      };
      material.customProgramCacheKey = () =>
        isWire
          ? 'factory-night-line-v3'
          : painted
            ? 'factory-painted-surface-v3'
            : 'factory-day-night-wipe-v3';
      material.needsUpdate = true;
    }
    const seen = new Set();
    plant.traverse((o) => {
      if (o.isMesh && !seen.has(o.material.uuid)) {
        seen.add(o.material.uuid);
        applyWipe(o.material);
      }
    });
    const fresnelScene = new T.Scene(),
      glowLinks = [];
    const fresnelMaterial = new T.ShaderMaterial({
      uniforms: { ...wipe, uGridMask: { value: gridMap }, uGridSurface: { value: 0 } },
      extensions: { derivatives: true },
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false,
      vertexShader: `#include <common>
        varying vec3 vFresnelNormal;
        varying vec2 vEmissionUv;
        void main(){
          #include <beginnormal_vertex>
          #include <defaultnormal_vertex>
          #include <begin_vertex>
          #include <project_vertex>
          vFresnelNormal=normalize(transformedNormal);
          vEmissionUv=uv;
        }`,
      fragmentShader: `${wipeGLSL}
        varying vec3 vFresnelNormal;
        varying vec2 vEmissionUv;uniform sampler2D uGridMask;uniform float uGridSurface;
        void main(){
          float nw=nightWeight();if(nw<.002)discard;
          float rim=pow(1.0-clamp(abs(normalize(vFresnelNormal).z),0.0,1.0),3.7);
          vec3 ice=mix(vec3(.02,.19,.36),vec3(.17,.58,.78),pow(rim,.7));
          vec2 cells=vEmissionUv*8.0;
          vec2 pixelStep=max(fwidth(cells),vec2(.00001));
          vec2 gridDistance=abs(fract(cells+.5)-.5)/pixelStep;
          float nearestLine=min(gridDistance.x,gridDistance.y);
          float fineLine=1.0-smoothstep(0.0,.78,nearestLine);
          float textureTone=mix(.88,1.0,texture2D(uGridMask,vEmissionUv).r);
          float luminousGrid=fineLine*textureTone*uGridSurface;
          gl_FragColor=vec4(ice*rim*2.5+vec3(.11,.48,.82)*luminousGrid*2.4,nw*.82);
        }`,
    });
    const panelGlowMaterial = fresnelMaterial.clone();
    panelGlowMaterial.uniforms = {
      ...wipe,
      uGridMask: { value: gridMap },
      uGridSurface: { value: 1 },
    };
    const depthMaterial = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: true });
    plant.updateMatrixWorld(true);
    plant.traverse((source) => {
      if (!source.isMesh || !source.userData.zone || source.material === m.inside) return;
      const surface = source.geometry;
      const make = (geometry, material, indices = null) => {
        let v;
        if (source.isInstancedMesh) {
          v = new T.InstancedMesh(geometry, material, indices ? indices.length : source.count);
          if (indices)
            indices.forEach((id, i) => {
              source.getMatrixAt(id, matrix);
              v.setMatrixAt(i, matrix);
            });
          else v.instanceMatrix = source.instanceMatrix;
        } else v = new T.Mesh(geometry, material);
        v.matrixAutoUpdate = false;
        v.matrix.copy(source.matrixWorld);
        fresnelScene.add(v);
        glowLinks.push({ source, object: v });
        return v;
      };
      make(source.geometry, depthMaterial).renderOrder = 0;
      if (source === tower || source.material === m.metal)
        make(surface, panelGlowMaterial).renderOrder = 1;
      else if (
        (source.material === m.band && source.geometry.type === 'LatheGeometry') ||
        (source.geometry.type === 'TorusGeometry' &&
          source.geometry.parameters.radius >= 14 &&
          source.material === m.trim)
      )
        make(surface, fresnelMaterial).renderOrder = 1;
      else if (source.isInstancedMesh && source.material === m.white) {
        const ids = [];
        for (let i = 0; i < source.count; i++) {
          source.getMatrixAt(i, matrix);
          const a = matrix.elements;
          if (Math.hypot(a[4], a[5], a[6]) >= 12 && Math.hypot(a[0], a[1], a[2]) >= 2) ids.push(i);
        }
        if (ids.length) make(surface, fresnelMaterial, ids).renderOrder = 1;
      }
    });
    for (const [y, w, d] of [
      [-7, 202, 106],
      [-18, 213, 112],
    ]) {
      const points = [
        [-w / 2, y, -d / 2],
        [w / 2, y, -d / 2],
        [w / 2, y, d / 2],
        [-w / 2, y, d / 2],
        [-w / 2, y, -d / 2],
      ].map((p) => new T.Vector3(...p));
      const material = new T.LineBasicMaterial({
        color: '#2f85d4',
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      applyWipe(material, true);
      const line = new T.Line(new T.BufferGeometry().setFromPoints(points), material);
      line.renderOrder = 2;
      fresnelScene.add(line);
    }
    const glowA = new T.WebGLRenderTarget(512, 320, { depthBuffer: true });
    glowA.samples = renderer.capabilities.isWebGL2 ? 4 : 0;
    const glowB = new T.WebGLRenderTarget(512, 320, { depthBuffer: false });
    const postScene = new T.Scene(),
      postCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postVertex = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
    const blur = new T.ShaderMaterial({
      uniforms: { tSource: { value: glowA.texture }, uStep: { value: new T.Vector2(1 / 512, 0) } },
      vertexShader: postVertex,
      fragmentShader:
        'varying vec2 vUv;uniform sampler2D tSource;uniform vec2 uStep;void main(){vec4 c=texture2D(tSource,vUv)*.383103;c+=(texture2D(tSource,vUv+uStep)+texture2D(tSource,vUv-uStep))*.241843;c+=(texture2D(tSource,vUv+uStep*2.)+texture2D(tSource,vUv-uStep*2.))*.060625;c+=(texture2D(tSource,vUv+uStep*3.)+texture2D(tSource,vUv-uStep*3.))*.00598;gl_FragColor=c;}',
      depthTest: false,
      depthWrite: false,
    });
    const composite = new T.ShaderMaterial({
      uniforms: {
        tBlur: { value: glowB.texture },
        tCore: { value: glowA.texture },
        uStep: { value: new T.Vector2(0, 1 / 320) },
      },
      vertexShader: postVertex,
      fragmentShader:
        'varying vec2 vUv;uniform sampler2D tBlur,tCore;uniform vec2 uStep;void main(){vec3 c=texture2D(tBlur,vUv).rgb*.383103;c+=(texture2D(tBlur,vUv+uStep).rgb+texture2D(tBlur,vUv-uStep).rgb)*.241843;c+=(texture2D(tBlur,vUv+uStep*2.).rgb+texture2D(tBlur,vUv-uStep*2.).rgb)*.060625;c+=(texture2D(tBlur,vUv+uStep*3.).rgb+texture2D(tBlur,vUv-uStep*3.).rgb)*.00598;c=c*.60+texture2D(tCore,vUv).rgb*.78;gl_FragColor=vec4(c,clamp(max(c.r,max(c.g,c.b))*.8,0.,.9));}',
      transparent: true,
      blending: T.CustomBlending,
      blendSrc: T.OneFactor,
      blendDst: T.OneFactor,
      blendSrcAlpha: T.OneFactor,
      blendDstAlpha: T.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), blur);
    postScene.add(quad);
    function render() {
      const modeMix = themeTransition
        ? T.MathUtils.lerp(wipe.uFromNight.value, wipe.uToNight.value, wipe.uSweep.value)
        : night
          ? 1
          : 0;
      survey.children.forEach((line) => (line.material.opacity = 0.09 * (1 - modeMix)));
      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      wipe.uWipeWidth.value = canvas.width;
      renderer.render(scene, camera);
      if (night || themeTransition) {
        glowLinks.forEach(({ source, object }) => object.matrix.copy(source.matrixWorld));
        wipe.uWipeWidth.value = glowA.width;
        renderer.setRenderTarget(glowA);
        renderer.clear();
        renderer.render(fresnelScene, camera);
        quad.material = blur;
        renderer.setRenderTarget(glowB);
        renderer.clear();
        renderer.render(postScene, postCamera);
        renderer.setRenderTarget(null);
        renderer.autoClear = false;
        quad.material = composite;
        renderer.render(postScene, postCamera);
        renderer.autoClear = true;
      }
      wipe.uWipeWidth.value = canvas.width;
    }
    function updateCamera() {
      const { azimuth: a, elevation: e } = view;
      camera.position.set(
        target.x + Math.sin(a) * Math.cos(e) * 350,
        target.y + Math.sin(e) * 350,
        target.z + Math.cos(a) * Math.cos(e) * 350,
      );
      camera.lookAt(target);
      camera.zoom = view.zoom;
      camera.updateProjectionMatrix();
      dirty = true;
      canvas.dataset.azimuth = ((a * 180) / Math.PI).toFixed(2);
      canvas.dataset.elevation = ((e * 180) / Math.PI).toFixed(2);
      canvas.dataset.zoom = view.zoom.toFixed(3);
      canvas.dataset.autoRotate = String(spinning);
      options.onChange?.(spinning);
    }
    function resize() {
      const w = activeHost.clientWidth || 1000,
        h = activeHost.clientHeight || 585;
      renderer.setSize(w, h, false);
      const aspect = w / h,
        width = Math.max(230, 148 * aspect);
      const r = activeHost.getBoundingClientRect(),
        s = document.querySelector('#factory-screen').getBoundingClientRect();
      wipe.uWipeOffset.value = (r.left - s.left) / s.width;
      wipe.uWipeSpan.value = r.width / s.width;
      glowA.setSize(canvas.width, canvas.height);
      glowB.setSize(canvas.width, canvas.height);
      const haloRadius = 1;
      blur.uniforms.uStep.value.set(haloRadius / glowA.width, 0);
      composite.uniforms.uStep.value.set(0, haloRadius / glowA.height);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = width / aspect / 2;
      camera.bottom = -width / aspect / 2;
      updateCamera();
    }
    const observer = new ResizeObserver(resize);
    function mount(next) {
      observer.disconnect();
      activeHost = next;
      next.appendChild(canvas);
      observer.observe(next);
      resize();
    }
    function reset() {
      view = { ...initial };
      target.set(0, 9, 0);
      spinning = false;
      updateCamera();
      return api;
    }
    function zoom(factor) {
      view.zoom = T.MathUtils.clamp(view.zoom * factor, 0.65, 2.8);
      updateCamera();
    }
    function hit(event) {
      const r = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        (-(event.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(pickable, false)[0]?.object.userData.zone || null;
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      pointerDown = {
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
      };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('dragging');
      options.onLeave?.();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (pointerDown) {
        const p = pointerDown,
          dx = e.clientX - p.lastX,
          dy = e.clientY - p.lastY;
        p.lastX = e.clientX;
        p.lastY = e.clientY;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4) p.moved = true;
        if (p.moved) {
          view.azimuth -= dx * 0.005;
          view.elevation = T.MathUtils.clamp(view.elevation + dy * 0.004, 0.13, 1.25);
          spinning = false;
          updateCamera();
        }
        return;
      }
      const zone = hit(e);
      hovered = zone;
      canvas.style.cursor = zone ? 'pointer' : 'grab';
      selection.visible = zone === 'cooling';
      dirty = true;
      if (zone) options.onHover?.(zone, e);
      else options.onLeave?.();
    });
    function endPointer(e) {
      const p = pointerDown;
      if (!p) return;
      pointerDown = null;
      canvas.classList.remove('dragging');
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (!p.moved) {
        const zone = hit(e);
        if (zone) options.onSelect?.(zone);
      }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', (e) => {
      pointerDown = null;
      canvas.classList.remove('dragging');
    });
    canvas.addEventListener('pointerleave', () => {
      hovered = null;
      selection.visible = false;
      dirty = true;
      options.onLeave?.();
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        zoom(Math.exp(-e.deltaY * 0.001));
      },
      { passive: false },
    );
    canvas.addEventListener('dblclick', reset);
    canvas.addEventListener('keydown', (e) => {
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          '+',
          '=',
          '-',
          'r',
          'R',
          'Enter',
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key === 'ArrowLeft') view.azimuth -= 0.08;
      if (e.key === 'ArrowRight') view.azimuth += 0.08;
      if (e.key === 'ArrowUp') view.elevation = Math.min(1.25, view.elevation + 0.06);
      if (e.key === 'ArrowDown') view.elevation = Math.max(0.13, view.elevation - 0.06);
      if (e.key === '+' || e.key === '=') zoom(1.1);
      if (e.key === '-') zoom(1 / 1.1);
      if (e.key === 'r' || e.key === 'R') reset();
      if (e.key === 'Enter') options.onSelect?.(hovered || 'cooling');
      updateCamera();
    });
    document.addEventListener('visibilitychange', () => {
      dirty = true;
    });
    function animate(time) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden || time - previous < 32) return;
      const dt = Math.min(0.08, (time - previous) / 1000);
      previous = time;
      if (themeTransition) {
        const p = Math.min(1, (time - themeTransition.started) / 1600);
        wipe.uSweep.value = p;
        dirty = true;
        canvas.dataset.themeProgress = p.toFixed(3);
        canvas.dataset.themePhase = p < 0.45 ? 'left' : p < 0.65 ? 'center' : 'right';
        if (p === 1) {
          themeTransition = null;
          options.onTheme?.({ night, busy: false });
        }
      }
      if (spinning) {
        view.azimuth += dt * 0.1;
        updateCamera();
      }
      if (!reduce && options.getState?.('storage') !== false) {
        animations.forEach((f) => (f.rotation.y += dt * 1.8));
        dirty = true;
      }
      if (dirty) {
        render();
        renderer.shadowMap.autoUpdate = false;
        dirty = false;
        canvas.dataset.ready = 'true';
        canvas.dataset.triangles = String(renderer.info.render.triangles);
        canvas.dataset.drawCalls = String(renderer.info.render.calls);
      }
    }
    const api = {
      mount,
      reset,
      zoom,
      canvas,
      plant,
      setAutoRotate(value) {
        spinning = value ?? !spinning;
        updateCamera();
        return spinning;
      },
      setNight(value) {
        if (themeTransition) return night;
        const next = !!value;
        if (next === night) return night;
        wipe.uFromNight.value = night ? 1 : 0;
        wipe.uToNight.value = next ? 1 : 0;
        wipe.uSweep.value = 0;
        night = next;
        themeTransition = { started: performance.now() };
        canvas.dataset.theme = night ? 'night' : 'day';
        canvas.dataset.themeProgress = '0';
        options.onTheme?.({ night, busy: true });
        dirty = true;
        return night;
      },
      isNight() {
        return night;
      },
      getView() {
        return { ...view, target: target.toArray(), autoRotate: spinning };
      },
      setView(v) {
        view = { azimuth: v.azimuth, elevation: v.elevation, zoom: v.zoom };
        if (v.target) target.fromArray(v.target);
        spinning = !!v.autoRotate;
        updateCamera();
      },
      getStats() {
        return {
          triangles: renderer.info.render.triangles,
          drawCalls: renderer.info.render.calls,
          objects: plant.children.length,
        };
      },
      exportGLB() {
        return exportGLB(plant);
      },
      dispose() {
        disposed = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.dispose();
        glowA.dispose();
        glowB.dispose();
        blur.dispose();
        composite.dispose();
        fresnelMaterial.dispose();
        panelGlowMaterial.dispose();
        depthMaterial.dispose();
        scene.traverse((o) => {
          o.geometry?.dispose();
        });
        Object.values(m).forEach((v) => v.dispose());
        [concreteMap, sheetMap, grassMap, gridMap, paintMap].forEach((v) => v.dispose());
        canvas.remove();
      },
    };
    mount(host);
    frame = requestAnimationFrame(animate);
    return api;
  }

  // glTF 2.0 exporter: bake instancing into normal indexed geometry for broad DCC compatibility.
  function exportGLB(root) {
    root.updateMatrixWorld(true);
    const groups = new Map(),
      world = new T.Matrix4(),
      local = new T.Matrix4(),
      normal = new T.Matrix3(),
      p = new T.Vector3(),
      n = new T.Vector3();
    root.traverse((o) => {
      if (!o.isMesh || !o.visible || o.material.transparent) return;
      const material = o.material,
        geometry = o.geometry,
        pos = geometry.attributes.position,
        norm = geometry.attributes.normal,
        uv = geometry.attributes.uv;
      if (!groups.has(material.uuid))
        groups.set(material.uuid, { material, positions: [], normals: [], uvs: [], indices: [] });
      const b = groups.get(material.uuid),
        count = o.isInstancedMesh ? o.count : 1;
      for (let j = 0; j < count; j++) {
        if (o.isInstancedMesh) {
          o.getMatrixAt(j, local);
          world.multiplyMatrices(o.matrixWorld, local);
        } else world.copy(o.matrixWorld);
        normal.getNormalMatrix(world);
        const start = b.positions.length / 3;
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i).applyMatrix4(world);
          b.positions.push(p.x, p.y, p.z);
          if (norm) n.fromBufferAttribute(norm, i).applyMatrix3(normal).normalize();
          else n.set(0, 1, 0);
          b.normals.push(n.x, n.y, n.z);
          b.uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
        }
        const idx = geometry.index;
        if (idx) for (let i = 0; i < idx.count; i++) b.indices.push(start + idx.getX(i));
        else for (let i = 0; i < pos.count; i++) b.indices.push(start + i);
      }
    });
    const gltf = {
      asset: { version: '2.0', generator: 'Factory Digital Twin / Three.js r160' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: '智慧工厂 · 可编辑建筑模型', mesh: 0 }],
      meshes: [{ primitives: [] }],
      materials: [],
      accessors: [],
      bufferViews: [],
      buffers: [{ byteLength: 0 }],
      images: [],
      textures: [],
      samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    };
    const chunks = [];
    let offset = 0;
    function buffer(bytes, target) {
      const padded = new Uint8Array((bytes.byteLength + 3) & ~3);
      padded.set(new Uint8Array(bytes.buffer || bytes, bytes.byteOffset || 0, bytes.byteLength));
      const index = gltf.bufferViews.length;
      gltf.bufferViews.push({
        buffer: 0,
        byteOffset: offset,
        byteLength: bytes.byteLength,
        ...(target ? { target } : {}),
      });
      offset += padded.length;
      chunks.push(padded);
      return index;
    }
    function accessor(values, type, componentType = 5126, minMax = false) {
      const data = componentType === 5125 ? new Uint32Array(values) : new Float32Array(values),
        size = { VEC3: 3, VEC2: 2, SCALAR: 1 }[type];
      const a = {
        bufferView: buffer(data, componentType === 5125 ? 34963 : 34962),
        componentType,
        count: data.length / size,
        type,
      };
      if (minMax) {
        a.min = Array(size).fill(Infinity);
        a.max = Array(size).fill(-Infinity);
        for (let i = 0; i < values.length; i++) {
          const k = i % size;
          a.min[k] = Math.min(a.min[k], values[i]);
          a.max[k] = Math.max(a.max[k], values[i]);
        }
      }
      gltf.accessors.push(a);
      return gltf.accessors.length - 1;
    }
    const maps = new Map();
    for (const b of groups.values()) {
      const m = b.material,
        mi = gltf.materials.length,
        material = {
          name: m.name || `Factory material ${mi}`,
          pbrMetallicRoughness: {
            baseColorFactor: [m.color.r, m.color.g, m.color.b, 1],
            metallicFactor: m.metalness ?? 0,
            roughnessFactor: m.roughness ?? 0.8,
          },
          doubleSided: m.side === T.DoubleSide,
        };
      if (m.map?.image instanceof HTMLCanvasElement) {
        if (!maps.has(m.map.uuid)) {
          const data = atob(m.map.image.toDataURL('image/png').split(',')[1]),
            bytes = Uint8Array.from(data, (c) => c.charCodeAt(0)),
            source = gltf.images.length;
          gltf.images.push({ bufferView: buffer(bytes), mimeType: 'image/png' });
          maps.set(m.map.uuid, gltf.textures.length);
          gltf.textures.push({ source, sampler: 0 });
        }
        material.pbrMetallicRoughness.baseColorTexture = { index: maps.get(m.map.uuid) };
      }
      gltf.materials.push(material);
      gltf.meshes[0].primitives.push({
        attributes: {
          POSITION: accessor(b.positions, 'VEC3', 5126, true),
          NORMAL: accessor(b.normals, 'VEC3'),
          TEXCOORD_0: accessor(b.uvs, 'VEC2'),
        },
        indices: accessor(b.indices, 'SCALAR', 5125),
        material: mi,
      });
    }
    gltf.buffers[0].byteLength = offset;
    const json = new TextEncoder().encode(JSON.stringify(gltf)),
      jsonPad = new Uint8Array((json.length + 3) & ~3);
    jsonPad.fill(32);
    jsonPad.set(json);
    const total = 12 + 8 + jsonPad.length + 8 + offset,
      header = new ArrayBuffer(20),
      view = new DataView(header);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, total, true);
    view.setUint32(12, jsonPad.length, true);
    view.setUint32(16, 0x4e4f534a, true);
    const bh = new ArrayBuffer(8),
      bv = new DataView(bh);
    bv.setUint32(0, offset, true);
    bv.setUint32(4, 0x004e4942, true);
    return new Blob([header, jsonPad, bh, ...chunks], { type: 'model/gltf-binary' });
  }
  window.FactoryDigitalTwin = { create };
})();
