/* A real, orthographic WebGL globe with a raised spherical province mesh. */
(() => {
  const canvas = P('#earth-canvas'),
    stage = P('#earth-stage');
  const R = 570,
    MAP_R = 650,
    CENTER_X = 1600,
    CENTER_Y = 350;
  const INITIAL = { lon: 110, lat: 15, zoom: 1 };
  const view = { ...INITIAL },
    target = { ...INITIAL };
  let renderer,
    paused = pPaused,
    mode = 'flow',
    selectedName = null,
    regionNames = null,
    dirty = true;
  const provinces = [],
    outlines = [],
    flowHeads = [];
  const geometryFeatures = pProvinceFeatures.map((f) => ({
    ...f,
    geometry:
      f.geometry.type === 'MultiPolygon'
        ? {
            ...f.geometry,
            coordinates: f.geometry.coordinates.filter((p) => p[0].some((c) => c[1] > 17.5)),
          }
        : f.geometry,
  }));
  const geo = (lon, lat, r = R) => {
    const a = (lon * Math.PI) / 180,
      b = (lat * Math.PI) / 180;
    return new THREE.Vector3(
      r * Math.cos(b) * Math.cos(a),
      r * Math.sin(b),
      -r * Math.cos(b) * Math.sin(a),
    );
  };
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(2160, 1200, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } catch (e) {
    fallback();
    return;
  }
  stage.dataset.renderer = 'webgl';
  const scene = new THREE.Scene(),
    camera = new THREE.OrthographicCamera(0, 2160, 1200, 0, 0.1, 6000);
  camera.position.set(0, 0, 3000);
  camera.lookAt(0, 0, 0);
  const earthGroup = new THREE.Group();
  earthGroup.position.set(CENTER_X, CENTER_Y, 0);
  scene.add(earthGroup);
  const loader = new THREE.TextureLoader();
  let pendingTextures = 3;
  stage.dataset.textureReady = 'false';
  function texture(url) {
    const t = loader.load(
      url,
      () => {
        dirty = true;
        pendingTextures--;
        stage.dataset.textureReady = String(pendingTextures === 0);
      },
      undefined,
      () => {
        stage.dataset.textureError = 'true';
      },
    );
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const day = texture(EARTH_TEXTURES.day),
    night = texture(EARTH_TEXTURES.night),
    normal = texture(EARTH_TEXTURES.normal);
  const globeVertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos; void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vPos=p.xyz;gl_Position=projectionMatrix*p;}`;
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: day }, nightMap: { value: night }, normalMap: { value: normal } },
    vertexShader: globeVertex,
    fragmentShader: `
    uniform sampler2D dayMap;uniform sampler2D nightMap;uniform sampler2D normalMap;
    varying vec2 vUv;varying vec3 vNormal;varying vec3 vPos;
    void main(){vec3 albedo=texture2D(dayMap,vUv).rgb;vec3 cities=texture2D(nightMap,vUv).rgb;vec3 detail=texture2D(normalMap,vUv).rgb;
    float lum=dot(albedo,vec3(.299,.587,.114));float city=dot(cities,vec3(.3,.5,.2));
    float light=max(dot(normalize(vNormal),normalize(vec3(-.55,.65,1.))),0.);
    float terrain=(detail.r-.5)*.18+(detail.g-.5)*.15;
    vec3 base=mix(vec3(.012,.025,.043),vec3(.15,.22,.29),smoothstep(.025,.68,lum));
    base*=.38+light*.82+terrain;float rim=pow(1.-max(dot(normalize(vNormal),vec3(0.,0.,1.)),0.),4.);
    base+=vec3(.10,.33,.46)*rim*.26;base+=vec3(.20,.52,.69)*pow(city,1.3)*.38;
    gl_FragColor=vec4(base,1.);}`,
  });
  earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R, 160, 112), earthMaterial));

  // The bright atmospheric rim is evaluated in view space, not baked into a texture.
  const atmosphere = new THREE.Group();
  scene.add(atmosphere);
  atmosphere.position.copy(earthGroup.position);
  function atmosphereShell(radius, color, power, intensity, side = THREE.FrontSide) {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        power: { value: power },
        intensity: { value: intensity },
      },
      vertexShader: globeVertex,
      fragmentShader: `uniform vec3 color;uniform float power;uniform float intensity;varying vec3 vNormal;void main(){float edge=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),power);gl_FragColor=vec4(color,edge*intensity);}`,
      side,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), m);
  }
  atmosphere.add(atmosphereShell(R + 3, '#c4e8ff', 5.6, 0.66));
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1320, 1320),
    new THREE.ShaderMaterial({
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 vUv;void main(){float d=length(vUv-.5)*1320.;float a=exp(-pow((d-570.)/12.,2.))*.52+exp(-pow((d-570.)/30.,2.))*.17;gl_FragColor=vec4(.48,.76,1.,a);}',
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.position.z = 580;
  atmosphere.add(halo);
  // A larger, faint scan shell echoes the hemisphere above the globe.
  const scanMaterial = new THREE.ShaderMaterial({
    vertexShader: globeVertex,
    fragmentShader: `varying vec2 vUv;varying vec3 vNormal;void main(){float stripe=pow(.5+.5*sin(vUv.y*1140.),7.);float f=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),1.25);gl_FragColor=vec4(.35,.53,.68,stripe*(.018+f*.17));}`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
  const scanShell = new THREE.Mesh(new THREE.SphereGeometry(744, 128, 112), scanMaterial);
  earthGroup.add(scanShell);

  const globeGrid = new THREE.Group();
  earthGroup.add(globeGrid);
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xa6c6da,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
  });
  for (let lat = -60; lat <= 75; lat += 15) {
    const points = [];
    for (let lon = -180; lon <= 180; lon += 2) points.push(geo(lon, lat, R + 1));
    globeGrid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const points = [];
    for (let lat = -88; lat <= 88; lat += 2) points.push(geo(lon, lat, R + 1));
    globeGrid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }

  const orbitGroup = new THREE.Group();
  orbitGroup.position.copy(earthGroup.position);
  scene.add(orbitGroup);
  function orbitRing(angle, tilt, opacity) {
    const points = [];
    const a = (angle * Math.PI) / 180,
      b = (tilt * Math.PI) / 180;
    for (let i = 0; i <= 220; i++) {
      let t = (i / 220) * Math.PI * 2;
      const x = Math.cos(t) * 920,
        y = Math.sin(t) * 116;
      points.push(
        new THREE.Vector3(
          x * Math.cos(a) - y * Math.sin(a),
          x * Math.sin(a) + y * Math.cos(a),
          Math.sin(t + b) * 180,
        ),
      );
    }
    orbitGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0xb4d6e5,
          transparent: true,
          opacity,
          depthWrite: false,
        }),
      ),
    );
  }
  orbitRing(17, 5, 0.16);
  orbitRing(-24, 60, 0.065);

  function openRing(ring) {
    const out = ring.slice();
    if (
      out.length > 1 &&
      out[0][0] === out[out.length - 1][0] &&
      out[0][1] === out[out.length - 1][1]
    )
      out.pop();
    return out;
  }
  function polygonGeometry(poly) {
    let contour = openRing(poly[0]).map((p) => new THREE.Vector2(p[0], p[1]));
    if (contour.length < 3) return null;
    let holes = poly
      .slice(1)
      .map((r) => openRing(r).map((p) => new THREE.Vector2(p[0], p[1])))
      .filter((r) => r.length >= 3);
    if (!THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
    holes.forEach((h) => {
      if (THREE.ShapeUtils.isClockWise(h)) h.reverse();
    });
    const flat = contour.concat(...holes),
      faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    const positions = [],
      normals = [],
      uvs = [],
      sidePositions = [],
      sideColors = [];
    faces.forEach((face) =>
      face.forEach((i) => {
        const p = flat[i],
          v = geo(p.x, p.y, MAP_R),
          n = v.clone().normalize();
        positions.push(v.x, v.y, v.z);
        normals.push(n.x, n.y, n.z);
        uvs.push((p.x + 180) / 360, (p.y + 90) / 180);
      }),
    );
    const extrude = Math.abs(THREE.ShapeUtils.area(contour)) > 0.15;
    [contour, ...holes].forEach((r) => {
      for (let i = 0; i < r.length; i++) {
        const a = r[i],
          b = r[(i + 1) % r.length],
          ta = geo(a.x, a.y, MAP_R),
          tb = geo(b.x, b.y, MAP_R),
          ba = geo(a.x, a.y, MAP_R - (extrude ? 13 : 0)),
          bb = geo(b.x, b.y, MAP_R - (extrude ? 13 : 0));
        ba.y -= extrude ? 9 : 0;
        bb.y -= extrude ? 9 : 0;
        [ta, ba, tb, tb, ba, bb].forEach((p, j) => {
          sidePositions.push(p.x, p.y, p.z);
          const top = j === 0 || j === 2 || j === 3;
          sideColors.push(...(top ? [0.35, 0.55, 0.7] : [0.055, 0.12, 0.19]));
        });
      }
    });
    const top = new THREE.BufferGeometry();
    top.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    top.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    top.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const side = new THREE.BufferGeometry();
    side.setAttribute('position', new THREE.Float32BufferAttribute(sidePositions, 3));
    side.setAttribute('color', new THREE.Float32BufferAttribute(sideColors, 3));
    side.computeVertexNormals();
    return { top, side };
  }
  const countryGroup = new THREE.Group();
  earthGroup.add(countryGroup);
  const countryFragment = `uniform sampler2D dayMap;uniform sampler2D normalMap;uniform float density;uniform float selected;uniform float distribution;uniform float dimmed;varying vec2 vUv;varying vec3 vNormal;void main(){vec3 land=texture2D(dayMap,vUv).rgb;vec3 n=texture2D(normalMap,vUv).rgb;float l=dot(land,vec3(.3,.58,.12));float relief=(n.r-.5)*.6+(n.g-.5)*.3;float lighting=.78+max(dot(normalize(vNormal),normalize(vec3(-.4,.8,1.))),0.)*.22;vec3 ice=mix(vec3(.23,.43,.66),vec3(.53,.76,.96),clamp(l*.8+.24+relief,0.,1.));vec3 heat=mix(vec3(.12,.35,.55),vec3(.76,.93,1.),density);vec3 c=mix(ice,heat,distribution*.7)*lighting;c+=vec3(.16,.19,.2)*selected;c*=1.-dimmed*.55;gl_FragColor=vec4(c,.94);}`;
  geometryFeatures.forEach((feature) => {
    const name = feature.properties.name,
      pop = pPopulation[name] || 100;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: day },
        normalMap: { value: normal },
        density: { value: Math.max(0.1, Math.min(1, Math.sqrt(pop / 12601))) },
        selected: { value: 0 },
        distribution: { value: 0 },
        dimmed: { value: 0 },
      },
      vertexShader: globeVertex,
      fragmentShader: countryFragment,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const entry = {
      name,
      material,
      meshes: [],
      center: feature.properties.center || feature.properties.centroid,
    };
    const polys =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    polys.forEach((poly) => {
      if (poly[0].length < 4) return;
      const made = polygonGeometry(poly);
      if (!made) return;
      const side = new THREE.Mesh(
        made.side,
        new THREE.MeshBasicMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
        }),
      );
      countryGroup.add(side);
      const mesh = new THREE.Mesh(made.top, material);
      mesh.userData.province = name;
      entry.meshes.push(mesh);
      countryGroup.add(mesh);
      const borderPoints = poly[0].map((c) => geo(c[0], c[1], MAP_R + 1.3));
      const border = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(borderPoints),
        new THREE.LineBasicMaterial({
          color: 0xc5e6ff,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        }),
      );
      countryGroup.add(border);
    });
    provinces.push(entry);
  });

  const national = POPULATION_OUTLINE.features[0];
  const outerPolys =
    national.geometry.type === 'MultiPolygon'
      ? national.geometry.coordinates
      : [national.geometry.coordinates];
  outerPolys.forEach((poly) => {
    if (!poly[0].some((c) => c[1] > 17.5) || poly[0].length < 8) return;
    const area = Math.abs(d3.polygonArea(poly[0]));
    if (area < 0.14) return;
    const pts = poly[0]
      .filter((p, i) => i % 2 === 0 || i === poly[0].length - 1)
      .map((c) => geo(c[0], c[1], MAP_R + 2));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.1);
    const geometry = new THREE.TubeGeometry(curve, Math.min(1800, pts.length * 2), 1.05, 4, true);
    const edge = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xe0f2ff, transparent: true, opacity: 0.86 }),
    );
    countryGroup.add(edge);
    outlines.push(edge);
    const aura = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.min(1200, pts.length), 3.2, 4, true),
      new THREE.MeshBasicMaterial({
        color: 0x92d0ff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    countryGroup.add(aura);
  });

  // A normal sprite texture is generated locally; no remote assets are loaded.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 64;
  glowCanvas.height = 64;
  const glowCtx = glowCanvas.getContext('2d'),
    gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.13, 'rgba(221,247,255,.95)');
  gradient.addColorStop(0.32, 'rgba(153,220,255,.36)');
  gradient.addColorStop(1, 'rgba(100,180,255,0)');
  glowCtx.fillStyle = gradient;
  glowCtx.fillRect(0, 0, 64, 64);
  const glowMap = new THREE.CanvasTexture(glowCanvas);
  function glowSprite(color, size, opacity = 0.7) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    sp.scale.set(size, size, size);
    return sp;
  }
  const cities = {
    北京: [116.4, 39.9],
    上海: [121.47, 31.23],
    广州: [113.26, 23.13],
    深圳: [114.06, 22.55],
    成都: [104.07, 30.67],
    武汉: [114.3, 30.59],
    西安: [108.94, 34.34],
    郑州: [113.66, 34.75],
    重庆: [106.55, 29.56],
    昆明: [102.71, 25.04],
    杭州: [120.15, 30.28],
    哈尔滨: [126.63, 45.75],
    沈阳: [123.43, 41.8],
    乌鲁木齐: [87.62, 43.82],
    拉萨: [91.13, 29.65],
    银川: [106.23, 38.49],
    兰州: [103.83, 36.06],
    福州: [119.3, 26.08],
    南宁: [108.32, 22.82],
    海口: [110.2, 20.04],
    台北: [121.56, 25.03],
  };
  const flowGroup = new THREE.Group();
  earthGroup.add(flowGroup);
  const cityGroup = new THREE.Group();
  earthGroup.add(cityGroup);
  Object.entries(cities).forEach(([name, coord], i) => {
    const sp = glowSprite(i % 4 === 0 ? 0xf0efca : 0xc9eaff, i % 4 === 0 ? 17 : 11, 0.75);
    sp.position.copy(geo(...coord, MAP_R + 5));
    cityGroup.add(sp);
  });
  class MigrationCurve extends THREE.Curve {
    constructor(a, b, height) {
      super();
      this.a = geo(...a, 1);
      this.b = geo(...b, 1);
      this.height = height;
    }
    getPoint(t, out = new THREE.Vector3()) {
      out
        .copy(this.a)
        .lerp(this.b, t)
        .normalize()
        .multiplyScalar(MAP_R + 6 + Math.sin(t * Math.PI) * this.height);
      return out;
    }
  }
  const major = [
    ['北京', '广州'],
    ['北京', '上海'],
    ['北京', '成都'],
    ['北京', '哈尔滨'],
    ['北京', '乌鲁木齐'],
    ['北京', '西安'],
    ['上海', '广州'],
    ['上海', '重庆'],
    ['深圳', '武汉'],
    ['成都', '昆明'],
    ['郑州', '广州'],
    ['武汉', '杭州'],
    ['拉萨', '北京'],
    ['西安', '福州'],
    ['成都', '上海'],
  ];
  major.forEach(([from, to], i) => {
    const curve = new MigrationCurve(cities[from], cities[to], 27 + (i % 4) * 17);
    const tube = new THREE.TubeGeometry(curve, 72, 0.92, 3, false);
    flowGroup.add(
      new THREE.Mesh(
        tube,
        new THREE.MeshBasicMaterial({
          color: 0xf1d47c,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      ),
    );
    const head = glowSprite(0xfff1bc, 11, 0.88);
    flowGroup.add(head);
    flowHeads.push({ head, curve, speed: 0.04 + (i % 4) * 0.008, phase: i * 0.083 });
  });
  const names = Object.keys(cities);
  for (let i = 0; i < 24; i++) {
    const a = names[i % names.length],
      b = names[(i * 7 + 8) % names.length];
    if (a === b) continue;
    const curve = new MigrationCurve(cities[a], cities[b], 12 + (i % 5) * 9);
    flowGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
        new THREE.LineBasicMaterial({
          color: 0x8fd6fb,
          transparent: true,
          opacity: 0.27,
          depthWrite: false,
        }),
      ),
    );
    const head = glowSprite(0xb6e6ff, 7, 0.8);
    flowGroup.add(head);
    flowHeads.push({ head, curve, speed: 0.026 + (i % 5) * 0.005, phase: i * 0.09 });
  }
  const islands = [
    [121.2, 18.4],
    [123, 13.4],
    [119, 8],
    [115, 4],
    [111, -1],
    [106, -5],
    [101, 8],
    [104, 1],
    [126, 7],
    [122, 1],
    [130, 32],
    [138, 37],
    [142, 44],
  ];
  islands.forEach((c, i) => {
    const sp = glowSprite(0x9ae5ff, i % 3 === 0 ? 17 : 9, 0.6);
    sp.position.copy(geo(...c, R + 4));
    earthGroup.add(sp);
  });
  const orbitMote = glowSprite(0xb5ecff, 16, 0.8);
  orbitGroup.add(orbitMote);

  function updateHighlight() {
    provinces.forEach((p) => {
      p.material.uniforms.selected.value = p.name === selectedName ? 1 : 0;
      p.material.uniforms.dimmed.value = regionNames && !regionNames.includes(p.name) ? 1 : 0;
      p.material.uniforms.distribution.value = mode === 'distribution' ? 1 : 0;
    });
    dirty = true;
  }
  function applyView() {
    earthGroup.rotation.set(
      (view.lat * Math.PI) / 180,
      ((-90 - view.lon) * Math.PI) / 180,
      0,
      'XYZ',
    );
    earthGroup.scale.setScalar(view.zoom);
    atmosphere.scale.setScalar(view.zoom);
    orbitGroup.scale.setScalar(view.zoom);
    stage.dataset.viewLongitude = view.lon.toFixed(2);
    stage.dataset.viewLatitude = view.lat.toFixed(2);
    stage.dataset.zoom = view.zoom.toFixed(3);
  }
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let drag = null,
    hoverName = null,
    moveDistance = 0;
  const pick = (event) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      provinces.flatMap((p) => p.meshes),
      false,
    );
    return hits[0]?.object.userData.province || null;
  };
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, lon: target.lon, lat: target.lat };
    moveDistance = 0;
    canvas.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
    pHideTip();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (drag) {
      const dx = (event.clientX - drag.x) / pScale,
        dy = (event.clientY - drag.y) / pScale;
      moveDistance = Math.abs(dx) + Math.abs(dy);
      target.lon = drag.lon - dx * 0.075;
      target.lat = Math.max(-35, Math.min(65, drag.lat + dy * 0.075));
      dirty = true;
      return;
    }
    if (event.offsetX < 1060) return;
    const name = pick(event);
    if (name) {
      hoverName = name;
      stage.style.cursor = 'pointer';
      pTip(
        event,
        `<strong>${name}</strong><div class="tip-line"><span>常住人口</span><b>${(pPopulation[name] || 0).toLocaleString()} 万人</b></div><div class="tip-subtle">点击查看人口结构 · 拖动旋转地球</div>`,
      );
    } else {
      hoverName = null;
      stage.style.cursor = 'grab';
      pHideTip();
    }
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const clicked = moveDistance < 8;
    drag = null;
    stage.classList.remove('dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (clicked) {
      const name = pick(event);
      if (name) showProvince(name);
    }
  });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
    stage.classList.remove('dragging');
  });
  canvas.addEventListener('pointerleave', () => {
    if (!drag) pHideTip();
  });
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      target.zoom = Math.max(
        0.76,
        Math.min(1.4, target.zoom + (event.deltaY < 0 ? 0.055 : -0.055)),
      );
      dirty = true;
    },
    { passive: false },
  );
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '三维人口地球。拖动旋转，滚轮缩放；方向键旋转，R键复位');
  canvas.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', 'r', 'R'].includes(e.key))
      e.preventDefault();
    if (e.key === 'ArrowLeft') target.lon -= 7;
    if (e.key === 'ArrowRight') target.lon += 7;
    if (e.key === 'ArrowUp') target.lat = Math.min(65, target.lat + 5);
    if (e.key === 'ArrowDown') target.lat = Math.max(-35, target.lat - 5);
    if (e.key === '+') target.zoom = Math.min(1.4, target.zoom + 0.08);
    if (e.key === '-') target.zoom = Math.max(0.76, target.zoom - 0.08);
    if (e.key.toLowerCase() === 'r') Object.assign(target, INITIAL);
    dirty = true;
  });
  window.populationGlobe = {
    setSelected(name) {
      selectedName = name;
      regionNames = null;
      updateHighlight();
    },
    highlightRegion(names) {
      regionNames = names;
      selectedName = null;
      updateHighlight();
    },
    focusProvince(coord) {
      if (coord) {
        target.lon = coord[0];
        target.lat = Math.max(-25, coord[1] - 16);
        target.zoom = 1.05;
        dirty = true;
      }
    },
    setMode(next) {
      mode = next;
      flowGroup.visible = next === 'flow';
      cityGroup.visible = next !== 'provinces';
      regionNames = null;
      updateHighlight();
    },
    setPaused(value) {
      paused = value;
      dirty = true;
    },
    reset() {
      Object.assign(target, INITIAL);
      selectedName = null;
      regionNames = null;
      updateHighlight();
    },
  };
  let previous = 0,
    elapsed = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    if (now - previous < 32) return;
    const dt = Math.min(0.1, (now - previous) / 1000);
    previous = now;
    const moving =
      Math.abs(target.lon - view.lon) +
        Math.abs(target.lat - view.lat) +
        Math.abs(target.zoom - view.zoom) >
      0.001;
    if (moving) {
      view.lon += (target.lon - view.lon) * 0.16;
      view.lat += (target.lat - view.lat) * 0.16;
      view.zoom += (target.zoom - view.zoom) * 0.16;
      dirty = true;
    }
    if (!paused) {
      elapsed += dt;
      flowHeads.forEach((p) =>
        p.head.position.copy(p.curve.getPoint((elapsed * p.speed + p.phase) % 1)),
      );
      const t = elapsed * 0.08;
      orbitMote.position.set(Math.cos(t) * 900, Math.sin(t) * 116, Math.sin(t + 0.2) * 180);
      dirty = true;
    }
    if (dirty) {
      applyView();
      renderer.render(scene, camera);
      dirty = false;
    }
  }
  applyView();
  requestAnimationFrame(animate);

  function fallback() {
    stage.dataset.renderer = 'svg';
    canvas.style.display = 'none';
    const svg = d3.select('#earth-fallback').style('display', 'block');
    const projection = d3.geoOrthographic().rotate([-110, -15]).translate([1600, 850]).scale(570),
      path = d3.geoPath(projection);
    const defs = svg.append('defs');
    defs.html(
      '<radialGradient id="fallback-ocean"><stop stop-color="#182d3c"/><stop offset=".83" stop-color="#081522"/><stop offset="1" stop-color="#49748e"/></radialGradient><filter id="fallback-aura"><feGaussianBlur stdDeviation="11"/></filter>',
    );
    svg
      .append('circle')
      .attr('cx', 1600)
      .attr('cy', 850)
      .attr('r', 578)
      .attr('fill', '#98d7ff')
      .attr('opacity', 0.5)
      .attr('filter', 'url(#fallback-aura)');
    svg
      .append('circle')
      .attr('cx', 1600)
      .attr('cy', 850)
      .attr('r', 570)
      .attr('fill', 'url(#fallback-ocean)')
      .attr('stroke', '#a5d9f5')
      .attr('stroke-width', 3);
    svg
      .append('path')
      .datum(d3.geoGraticule10())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#8aacbf')
      .attr('stroke-opacity', 0.08);
    const projectChina = d3.geoOrthographic().rotate([-110, -15]).translate([1600, 850]).scale(650),
      chinaPath = d3.geoPath(projectChina);
    geometryFallback(POPULATION_WORLD.features, path, '#233c4d', '#7599ae', 0.7);
    geometryFallback(pProvinceFeatures, chinaPath, '#85aecb', '#dcf1ff', 1);
    function geometryFallback(features, p, fill, stroke, opacity) {
      svg
        .append('g')
        .selectAll('path')
        .data(features)
        .join('path')
        .attr('d', p)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 0.8)
        .attr('opacity', opacity);
    }
    window.populationGlobe = {
      setSelected() {},
      highlightRegion() {},
      focusProvince() {},
      setMode() {},
      setPaused() {},
      reset() {},
    };
  }
})();
