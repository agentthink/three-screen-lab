/* Scene geometry adapted with owner permission from big-screen-astra; MIT in this distribution. */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;
  function buildPark(scene) {
    const root = new THREE.Group();
    scene.add(root);
    const buildings = new THREE.Group(),
      energy = new THREE.Group(),
      security = new THREE.Group();
    root.add(buildings, energy, security);
    const base = standard('#151b37'),
      road = standard('#222b47'),
      glass = standard('#697ab0', { metalness: 0.75, roughness: 0.22 }),
      white = standard('#b6c9e8', { metalness: 0.4 }),
      violet = glow('#aa92ff'),
      cyan = glow('#70eaff'),
      green = standard('#325f64');
    box(root, 0, -0.65, 0, 35, 1, 27, base);
    box(root, 0, -0.1, 0, 33, 0.15, 25, road);
    for (const x of [-11, 0, 11]) box(root, x, 0.01, 0, 1.8, 0.08, 24, base);
    for (const z of [-9, 0, 9]) box(root, 0, 0.02, z, 33, 0.08, 1.8, base);
    for (const x of [-11, 0, 11])
      for (let z = -11; z < 12; z += 1.5) box(root, x, 0.09, z, 0.06, 0.02, 0.65, white);
    for (const z of [-9, 0, 9])
      for (let x = -15; x < 16; x += 1.5) box(root, x, 0.09, z, 0.65, 0.02, 0.06, white);
    const towers = [
      [-6, -4, 7, 4, 4],
      [5, -4, 10, 4.2, 4],
      [-6, 5, 4, 6, 4],
      [6, 5, 5, 5, 4],
      [-14, -4, 3, 3, 4],
      [14, 5, 3.4, 3, 4],
    ];
    towers.forEach(([x, z, h, w, d], i) => {
      box(buildings, x, h / 2, z, w, h, d, glass);
      box(buildings, x, h + 0.1, z, w + 0.2, 0.2, d + 0.2, white);
      for (let y = 0.7; y < h; y += 0.65) {
        box(buildings, x, y, z + d / 2 + 0.02, w, 0.045, 0.035, i % 2 ? cyan : violet);
        box(buildings, x + w / 2 + 0.02, y, z, 0.035, 0.045, d, cyan);
      }
      for (let xx = x - w / 2 + 0.5; xx < x + w / 2; xx += 0.65)
        box(buildings, xx, h / 2, z + d / 2 + 0.04, 0.035, h, 0.025, white);
      box(buildings, x, h + 0.24, z, w * 0.6, 0.1, d * 0.65, base);
      for (let s = 0; s < 3; s++)
        box(energy, x - w * 0.25 + s * w * 0.24, h + 0.35, z, w * 0.19, 0.08, d * 0.55, cyan);
    });
    // Shared geometry trees keep draw calls low after batching.
    for (let i = 0; i < 34; i++) {
      const x = -15 + (i % 17) * 1.9,
        z = i < 17 ? -11.3 : 11.3;
      cylinder(root, x, 0.55, z, 0.07, 1, white);
      const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), green);
      tree.position.set(x, 1.35, z);
      root.add(tree);
    }
    cylinder(root, 0, 0.12, 4, 2.5, 0.16, base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.035, 6, 80), cyan);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.25, 4);
    root.add(ring);
    for (const x of [-15, 15])
      for (const z of [-8, 8]) {
        cylinder(security, x, 1.4, z, 0.05, 2.8, white);
        box(security, x, 2.8, z, 0.45, 0.2, 0.2, cyan);
      }
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 27),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 } },
        vertexShader:
          'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec2 v;uniform float time;void main(){float r=length((v-.5)*vec2(1.3,1.));float wave=1.-smoothstep(0.,.024,abs(r-mod(time*.065,.8)));float grid=pow(max(0.,1.-abs(sin(v.x*180.)*sin(v.y*140.))),18.);gl_FragColor=vec4(.37,.49,1.,wave*.36+grid*.035);}',
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.18;
    root.add(scan);
    line(
      root,
      [
        [-17, 0.2, -13],
        [17, 0.2, -13],
        [17, 0.2, 13],
        [-17, 0.2, 13],
        [-17, 0.2, -13],
      ],
      '#8178ff',
      0.8,
    );
    const cars = [];
    for (let i = 0; i < 7; i++) {
      const car = new THREE.Group();
      box(car, 0, 0.3, 0, 0.7, 0.35, 1.2, i % 2 ? white : violet);
      box(car, 0, 0.5, 0, 0.5, 0.15, 0.6, glass);
      root.add(car);
      cars.push(car);
    }
    batchStatic(buildings);
    batchStatic(energy);
    batchStatic(security);
    batchStatic(root, [buildings, energy, security, scan, ...cars]);
    return {
      root,
      home: [36, 31, 42],
      target: [0, 1, 0],
      labels: [
        label(
          '01 · 科创总部',
          [5, 11, -4],
          '科创总部 · 入驻企业 42 家 · 使用率 96.2% · 设备运行正常',
        ),
        label('02 · 研发中心', [-6, 8, -4], '研发中心 · 在园人员 1,286 人 · 环境温度 24.6°C'),
        label('03 · 活力中心', [6, 6, 5], '活力中心 · 今日客流 2,408 人 · 停车余位 128 个'),
      ],
      setLayer(v) {
        energy.visible = v !== 'security';
        security.visible = v !== 'energy';
        buildings.children.forEach((o) => {
          if (o.material?.color) o.material.opacity = 1;
        });
      },
      update(t, running = true) {
        if (!running) return;
        scan.material.uniforms.time.value = t;
        cars.forEach((c, i) => {
          const p = (t * 1.7 + i * 10) % 88;
          c.position.set(
            p < 28 ? -14 + p : p < 44 ? 14 : p < 72 ? 14 - (p - 44) : -14,
            0,
            p < 28 ? -8 : p < 44 ? -8 + p - 28 : p < 72 ? 8 : 8 - (p - 72),
          );
          c.rotation.y = p < 28 || (p >= 44 && p < 72) ? Math.PI / 2 : 0;
        });
      },
    };
  }

  ObservatoryScenes.builders.park = ({ root, animations, pick, state }) => {
    const model = buildPark(root);
    [
      ['headquarters', [5, 5, -4], [4.5, 10, 4.5], 'buildings'],
      ['research', [-6, 3.6, -4], [4.5, 7.2, 4.5], 'buildings'],
      ['service', [6, 2.5, 5], [5.5, 5.5, 4.5], 'energy'],
    ].forEach(([id, position, size, layer]) => pick(id, null, position, size, layer));
    model.update(0, true);
    animations.push((t) => model.update(t, true));
    return { setLayer: (value) => model.setLayer(value), root: model.root };
  };
})();
