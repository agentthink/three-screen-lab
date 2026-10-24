/* Scene geometry adapted with owner permission from big-screen-astra; MIT in this distribution. */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;
  function buildIndustry(scene) {
    const root = new THREE.Group();
    scene.add(root);
    const machines = new THREE.Group(),
      utilities = new THREE.Group();
    root.add(machines, utilities);
    const floor = standard('#394048', { metalness: 0.45 }),
      steel = standard('#b5bdc2', { metalness: 0.75, roughness: 0.3 }),
      dark = standard('#252d34', { metalness: 0.65 }),
      amber = standard('#e69538', { metalness: 0.4 }),
      light = glow('#ffb34e'),
      rubber = standard('#1a2026');
    box(root, 0, -0.6, 0, 34, 1.2, 26, dark);
    box(root, 0, 0.04, 0, 33.6, 0.12, 25.6, floor);
    for (let i = -16; i <= 16; i += 2)
      line(
        root,
        [
          [i, 0.12, -12.6],
          [i, 0.12, 12.6],
        ],
        '#77818b',
        0.17,
      );
    for (let i = -12; i <= 12; i += 2)
      line(
        root,
        [
          [-16.7, 0.12, i],
          [16.7, 0.12, i],
        ],
        '#77818b',
        0.17,
      );
    line(
      root,
      [
        [-17, -0.4, -13],
        [17, -0.4, -13],
        [17, -0.4, 13],
        [-17, -0.4, 13],
        [-17, -0.4, -13],
      ],
      '#9b6934',
    );
    // Roofless architectural shell makes the entire active production line readable.
    box(root, 0, 2.3, -12.5, 33.5, 4.5, 0.25, standard('#434c55'));
    box(root, -16.5, 1.3, 0, 0.25, 2.5, 25, dark);
    for (let i = -15; i <= 15; i += 3) {
      box(root, i, 2.7, -12.1, 0.25, 5.2, 0.3, steel);
      box(root, i, 4.8, -12.25, 2.3, 0.14, 0.18, glow('#bedcea'));
      box(
        root,
        i,
        2.2,
        -12.3,
        2,
        1.2,
        0.12,
        standard('#1d3945', { metalness: 0.7, roughness: 0.2 }),
      );
    }
    // Twin conveyors with visible rollers, moving pallets and inspection gates.
    const crates = [];
    for (const z of [-4, 5]) {
      box(machines, 0, 0.7, z, 26, 0.4, 2.2, dark);
      for (const zz of [z - 1.1, z + 1.1]) box(machines, 0, 1, zz, 26, 0.2, 0.13, steel);
      for (let i = 0; i < 53; i++) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.85, 8), steel);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(-12.7 + i * 0.49, 0.96, z);
        machines.add(roller);
      }
      for (let i = 0; i < 6; i++) {
        const pallet = new THREE.Group();
        box(pallet, 0, 0, 0, 1.5, 0.12, 1.3, steel);
        box(pallet, 0, 0.5, 0, 1.25, 0.9, 1.1, standard(i % 2 ? '#809097' : '#b8c3c5'));
        box(pallet, 0, 0.52, 0.56, 0.7, 0.18, 0.015, glow('#d9e6e6'));
        pallet.position.set(-10 + i * 4, 1.15, z);
        machines.add(pallet);
        crates.push({ mesh: pallet, offset: i * 4, z });
      }
      for (const x of [-7, 8]) {
        box(machines, x, 2.1, z - 1.4, 0.3, 3, 0.3, dark);
        box(machines, x, 2.1, z + 1.4, 0.3, 3, 0.3, dark);
        box(machines, x, 3.55, z, 0.4, 0.3, 3.1, steel);
        box(machines, x, 3.36, z, 0.15, 0.04, 2.6, light);
        const scan = new THREE.Mesh(
          new THREE.PlaneGeometry(2.3, 2.4),
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: { time: { value: 0 } },
            vertexShader:
              'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
            fragmentShader:
              'varying vec2 v;uniform float time;void main(){float b=pow(max(0.,1.-abs(v.y-fract(time*.3))*.9),6.);gl_FragColor=vec4(1.,.52,.13,.08+b*.1);}',
          }),
        );
        scan.rotation.y = Math.PI / 2;
        scan.position.set(x, 2.1, z);
        machines.add(scan);
      }
    }
    // Six articulated robot arms with separate shoulder and elbow pivots.
    const arms = [];
    for (const [x, z, side] of [
      [-10, -7, 1],
      [-1, -7, 1],
      [11, -7, 1],
      [-11, 8, -1],
      [0, 8, -1],
      [10, 8, -1],
    ]) {
      box(machines, x, 0.45, z, 2.2, 0.7, 2, standard('#69737a'));
      cylinder(machines, x, 0.98, z, 0.55, 0.45, dark);
      const base = new THREE.Group();
      base.position.set(x, 1.18, z);
      base.rotation.y = side > 0 ? 0 : Math.PI;
      machines.add(base);
      const shoulder = new THREE.Group();
      base.add(shoulder);
      shoulder.rotation.x = 0.35;
      box(shoulder, 0, 1.0, 0, 0.57, 2, 0.6, amber);
      const pivot = cylinder(shoulder, 0, 0.1, 0, 0.4, 0.74, steel);
      pivot.rotation.z = Math.PI / 2;
      const elbow = new THREE.Group();
      elbow.position.y = 2;
      shoulder.add(elbow);
      elbow.rotation.x = 1.2;
      box(elbow, 0, 0.9, 0, 0.4, 1.8, 0.45, amber);
      const e = cylinder(elbow, 0, 0, 0, 0.3, 0.7, dark);
      e.rotation.z = Math.PI / 2;
      const wrist = new THREE.Group();
      wrist.position.y = 1.9;
      elbow.add(wrist);
      cylinder(wrist, 0, 0, 0, 0.22, 0.5, steel);
      for (const q of [-0.2, 0.2]) box(wrist, q, 0.35, 0, 0.09, 0.5, 0.14, dark);
      arms.push({ base, shoulder, elbow });
      halo(utilities, x, z, '#ffae46', 2);
    }
    // CNC machining bay, ventilators, status bars and electrical cabinets.
    for (let i = 0; i < 3; i++) {
      const x = -10 + i * 7;
      box(machines, x, 1.7, -10, 4.5, 3.2, 2.5, standard('#85939b'));
      box(
        machines,
        x,
        1.9,
        -8.71,
        2.7,
        1.8,
        0.08,
        standard('#152e39', { roughness: 0.1, metalness: 0.8 }),
      );
      box(machines, x + 1.65, 1.8, -8.6, 0.47, 0.8, 0.15, dark);
      box(machines, x + 1.65, 1.9, -8.5, 0.3, 0.4, 0.02, glow('#83bcc6'));
      box(machines, x, 3.38, -10, 4.2, 0.12, 2.2, dark);
      cylinder(utilities, x + 1.7, 3.7, -9.2, 0.07, 0.55, dark);
      cylinder(utilities, x + 1.7, 3.95, -9.2, 0.09, 0.13, glow('#72d9a6'));
    }
    for (let i = 0; i < 4; i++) {
      box(utilities, 15, 1.1, -8 + i * 2.4, 2, 2, 1.8, standard('#687782'));
      for (let q = 0; q < 4; q++)
        box(utilities, 13.98, 1 + q * 0.15, -8 + i * 2.4, 0.02, 0.05, 1.2, dark);
    }
    // Safety lanes and a moving AGV on its own route.
    for (const z of [-0.7, 1.3])
      line(
        utilities,
        [
          [-15, 0.17, z],
          [14, 0.17, z],
        ],
        '#e5a14c',
        0.9,
      );
    for (let i = 0; i < 15; i++) {
      const b = box(utilities, -14 + i * 2, 0.15, 11.6, 0.7, 0.025, 0.32, glow('#d19948'));
      b.rotation.y = -0.5;
    }
    const agv = new THREE.Group();
    root.add(agv);
    box(agv, 0, 0.4, 0, 1.8, 0.6, 1.1, amber);
    box(agv, 0, 0.82, 0, 1.25, 0.25, 0.9, steel);
    for (const x of [-0.6, 0.6])
      for (const z of [-0.57, 0.57]) {
        const w = cylinder(agv, x, 0.3, z, 0.19, 0.1, rubber);
        w.rotation.x = Math.PI / 2;
      }
    box(agv, 0.9, 0.4, 0, 0.04, 0.1, 0.7, light);
    const cables = new THREE.Group();
    utilities.add(cables);
    for (let j = 0; j < 3; j++)
      line(
        cables,
        [
          [-15, 5 + j * 0.12, -11],
          [-15, 5 + j * 0.12, 10],
          [14, 5 + j * 0.12, 10],
        ],
        '#81939b',
        0.45,
      );
    const sweep = new THREE.Mesh(
      new THREE.PlaneGeometry(33, 25),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { time: { value: 0 } },
        vertexShader:
          'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec2 v;uniform float time;void main(){float a=pow(max(0.,1.-abs(v.x-fract(time*.05))*45.),2.);gl_FragColor=vec4(1.,.65,.2,a*.14);}',
      }),
    );
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.19;
    utilities.add(sweep);
    batchStatic(machines, [...arms.map((a) => a.base), ...crates.map((c) => c.mesh)]);
    batchStatic(utilities);
    batchStatic(root, [machines, utilities, agv]);
    const animatedMaterials = [];
    root.traverse((o) => {
      if (o.material?.uniforms?.time) animatedMaterials.push(o.material);
    });
    return {
      root,
      home: [36, 32, 42],
      target: [0, 0, 0],
      labels: [
        label('01 / 自动装配线', [-3, 3, 5], '运行中 · 节拍 24.8 s · 完成率 98.6%'),
        label('02 / 精密加工单元', [4, 4, -10], '主轴 8,600 rpm · 温度 42.1°C'),
        label('AGV 物流通道', [-3, 1, 0.3], '任务执行中 · 电量 86%'),
      ],
      update(t, running) {
        if (!running) return;
        arms.forEach((a, i) => {
          a.base.rotation.y = (i < 3 ? 0 : Math.PI) + Math.sin(t * 0.55 + i) * 0.3;
          a.shoulder.rotation.x = 0.35 + Math.sin(t * 0.7 + i) * 0.25;
          a.elbow.rotation.x = 1.2 + Math.cos(t * 0.7 + i) * 0.35;
        });
        crates.forEach((c) => (c.mesh.position.x = ((t * 0.7 + c.offset) % 25) - 12.5));
        agv.position.set(Math.sin(t * 0.12) * 12, 0, 0.3);
        agv.rotation.y = Math.cos(t * 0.12) > 0 ? 0 : Math.PI;
        animatedMaterials.forEach((m) => (m.uniforms.time.value = t));
      },
      setLayer(layer) {
        machines.visible = layer !== 'utilities';
        utilities.visible = layer !== 'machines';
      },
    };
  }

  ObservatoryScenes.builders.industry = ({ root, animations, pick, state }) => {
    const model = buildIndustry(root);
    [
      ['assembly', [-3, 1.6, 5], [25, 3, 2.8], 'machines'],
      ['cnc', [4, 2, -10], [5, 4, 3], 'machines'],
      ['logistics', [-3, 0.8, 0.3], [9, 1.5, 2], 'utilities'],
    ].forEach(([id, position, size, layer]) => pick(id, null, position, size, layer));
    model.update(0, true);
    animations.push((t) => model.update(t, true));
    return { setLayer: (value) => model.setLayer(value), root: model.root };
  };
})();
