/* Scene geometry adapted with owner permission from big-screen-astra; MIT in this distribution. */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;
  function buildAgriculture(scene) {
    const root = new THREE.Group();
    scene.add(root);
    const plants = new THREE.Group(),
      waterSystem = new THREE.Group(),
      sensors = new THREE.Group();
    root.add(plants, waterSystem, sensors);
    const earth = standard('#263e2b'),
      edge = standard('#16281f'),
      path = standard('#748075'),
      soil = standard('#354732'),
      mint = glow('#88e7a0'),
      glass = standard('#72bca0', {
        transparent: true,
        opacity: 0.28,
        metalness: 0.55,
        roughness: 0.15,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    box(root, 0, -0.65, 0, 32, 1.3, 25, edge);
    box(root, 0, 0.03, 0, 31.8, 0.15, 24.8, earth);
    // A beveled-looking floating landscape with luminous survey edges.
    for (const y of [-0.7, -0.15])
      line(
        root,
        [
          [-16, y, -12.5],
          [16, y, -12.5],
          [16, y, 12.5],
          [-16, y, 12.5],
          [-16, y, -12.5],
        ],
        y === -0.7 ? '#365a47' : '#94c580',
        0.65,
      );
    for (const x of [-15, -4, 7, 15]) box(root, x, 0.14, 0, x === -4 ? 1 : 0.45, 0.12, 24.7, path);
    for (const z of [-11.5, -1, 10.8]) box(root, 0, 0.14, z, 31.7, 0.12, 0.6, path);
    const cropGeo = new THREE.ConeGeometry(0.15, 0.55, 5);
    const cropMat = standard('#8db955', { roughness: 0.9 });
    const crop = new THREE.InstancedMesh(cropGeo, cropMat, 1500);
    crop.castShadow = true;
    const d = new THREE.Object3D();
    let n = 0;
    const fields = [
      [-10, 5, 8, 9, '#8ea757'],
      [1.5, 5, 8.5, 9, '#b5b45e'],
      [-10, -6, 8, 8, '#5e9a62'],
    ];
    fields.forEach(([x, z, w, dep, col], f) => {
      box(plants, x, 0.2, z, w, 0.24, dep, soil);
      for (let r = 0; r < 14; r++) {
        const zz = z - dep * 0.45 + (r * dep * 0.9) / 13;
        box(plants, x, 0.33, zz, w - 0.4, 0.08, 0.15, standard('#526640'));
        for (let k = 0; k < 27; k++) {
          const xx = x - w * 0.46 + (k * w * 0.92) / 26;
          d.position.set(xx, 0.64 + seed(n) * 0.09, zz);
          d.scale.setScalar(0.85 + seed(n + 33) * 0.35);
          d.rotation.y = seed(n + 7) * 3;
          d.updateMatrix();
          crop.setMatrixAt(n, d.matrix);
          crop.setColorAt(n, new THREE.Color(col).multiplyScalar(0.8 + seed(n) * 0.4));
          n++;
        }
      }
    });
    crop.count = n;
    plants.add(crop);
    // Four framed, translucent vaulted greenhouses with visible planted beds.
    for (let g = 0; g < 3; g++) {
      const x = -0.7 + g * 2.8,
        z = -6.5;
      box(root, x, 0.38, z, 2.5, 0.4, 8, standard('#879d86'));
      for (let k = 0; k < 3; k++)
        box(plants, x - 0.75 + k * 0.75, 0.71, z, 0.4, 0.3, 7.3, standard('#6ca66d'));
      const roofGeo = new THREE.CylinderGeometry(1.23, 1.23, 8, 20, 1, true, 0, Math.PI);
      roofGeo.rotateZ(Math.PI / 2);
      roofGeo.rotateY(Math.PI / 2);
      const roof = new THREE.Mesh(roofGeo, glass);
      roof.position.set(x, 1.35, z);
      root.add(roof);
      for (let q = 0; q < 6; q++) {
        const zz = z - 4 + q * 1.6;
        const pts = [];
        for (let a = 0; a <= 20; a++) {
          const angle = (a / 20) * Math.PI;
          pts.push([x + Math.cos(angle) * 1.25, 1.35 + Math.sin(angle) * 1.25, zz]);
        }
        line(root, pts, '#b0d9c0', 0.8);
        line(
          root,
          [
            [x - 1.25, 0.6, zz],
            [x - 1.25, 1.35, zz],
          ],
          '#96c7ab',
        );
        line(
          root,
          [
            [x + 1.25, 0.6, zz],
            [x + 1.25, 1.35, zz],
          ],
          '#96c7ab',
        );
      }
      box(root, x - 1.24, 0.97, z, 0.045, 0.75, 8, glass);
      box(root, x + 1.24, 0.97, z, 0.045, 0.75, 8, glass);
      line(
        root,
        [
          [x, 2.6, z - 4],
          [x, 2.6, z + 4],
        ],
        '#d4ebd5',
        0.8,
      );
    }
    // Reservoir: genuine time-dependent fragment shader, not a backdrop image.
    box(waterSystem, 11, 0, 5, 6.7, 0.45, 9.7, standard('#456557'));
    const waterMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader:
        'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'uniform float uTime;varying vec2 v;void main(){float a=sin(v.x*75.+v.y*32.+uTime*1.4)*.5+.5;float b=sin(v.y*97.-uTime)*.5+.5;vec3 c=mix(vec3(.035,.22,.20),vec3(.23,.57,.43),a*b*.6);gl_FragColor=vec4(c,1.);}',
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 9.2), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(11, 0.26, 5);
    waterSystem.add(water);
    for (let i = 0; i < 3; i++)
      line(
        waterSystem,
        [
          [7.7 + i * 0.15, 0.42, 5],
          [6.2, 0.42, 5],
          [6.2, 0.42, -0.7],
          [-14, 0.42, -0.7],
        ],
        '#65d7b6',
        0.5,
      );
    // Small service center, solar panels, trees and turbine.
    box(root, 11, 1.1, -7, 5, 2, 6, standard('#c2d2bc'));
    box(root, 11, 2.18, -7, 5.3, 0.2, 6.3, standard('#647b70'));
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        const panel = box(
          root,
          9.4 + i * 1.05,
          2.4,
          -8.8 + j * 1.6,
          0.93,
          0.08,
          1.4,
          standard('#244b53', { metalness: 0.7, roughness: 0.2 }),
        );
        panel.rotation.x = -0.18;
        line(
          root,
          [
            [8.98 + i * 1.05, 2.53, -8.8 + j * 1.6],
            [9.83 + i * 1.05, 2.53, -8.8 + j * 1.6],
          ],
          '#698f96',
        );
      }
    box(root, 11, 1, -3.97, 1.2, 1.8, 0.06, standard('#204644'));
    for (const x of [9.2, 12.8]) box(root, x, 1.25, -3.96, 1.2, 0.85, 0.06, glow('#a3dac4', 0.7));
    for (let i = 0; i < 17; i++) {
      const x = -15.2 + i * 1.88;
      cylinder(root, x, 0.55, 12, 0.09, 0.7, standard('#5c6450'));
      const t = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.58, 1),
        standard(i % 2 ? '#6a9770' : '#527954'),
      );
      t.position.set(x, 1.12, 12);
      t.castShadow = true;
      root.add(t);
    }
    const turbines = [];
    for (const [x, z] of [
      [-14, -10],
      [14, -10],
    ]) {
      cylinder(root, x, 2.5, z, 0.13, 4.6, standard('#d8dfce'), 0.07);
      const rotor = new THREE.Group();
      rotor.position.set(x, 4.8, z);
      root.add(rotor);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), standard('#cedec7'));
      rotor.add(hub);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Group();
        blade.rotation.z = (b * Math.PI * 2) / 3;
        box(blade, 0, 1.05, 0, 0.12, 1.85, 0.065, standard('#c5d7c0'));
        rotor.add(blade);
      }
      turbines.push(rotor);
    }
    const drone = new THREE.Group();
    root.add(drone);
    box(drone, 0, 0, 0, 0.6, 0.2, 0.4, standard('#d5e5c8'));
    const props = [];
    for (const x of [-0.6, 0.6])
      for (const z of [-0.6, 0.6]) {
        line(
          drone,
          [
            [0, 0, 0],
            [x, 0, z],
          ],
          '#c6d5c3',
        );
        const p = box(drone, x, 0.1, z, 0.7, 0.025, 0.09, standard('#bcc5ac'));
        props.push(p);
      }
    for (const [x, z] of [
      [-9, 5],
      [1, 5],
      [-9, -6],
      [3, -6],
      [11, 5],
    ]) {
      cylinder(sensors, x, 1.1, z, 0.045, 1.6, standard('#abd6ac'));
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mint);
      orb.position.set(x, 1.95, z);
      sensors.add(orb);
      halo(sensors, x, z, '#86e4a0', 1.6);
    }
    const points = [];
    for (let i = 0; i < 90; i++)
      points.push((seed(i) - 0.5) * 33, seed(i + 100) * 7, (seed(i + 200) - 0.5) * 25);
    const motes = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(points, 3),
      ),
      new THREE.PointsMaterial({ color: '#c8e9a6', size: 0.045, transparent: true, opacity: 0.6 }),
    );
    root.add(motes);
    batchStatic(plants);
    batchStatic(waterSystem);
    batchStatic(sensors);
    batchStatic(root, [plants, waterSystem, sensors, drone, ...turbines]);
    return {
      root,
      home: [32, 30, 38],
      target: [0, 0, 0],
      labels: [
        label('A01 · 智慧温室', [3, 3, -6], '温度 24.6°C · 湿度 68% · 生长正常'),
        label('B02 · 高标准农田', [-9, 1, 5], '水稻长势优良 · 土壤墒情 72%'),
        label('智能蓄水池', [11, 1, 5], '蓄水量 2,840 m³ · 水质达标'),
      ],
      update(t, running) {
        if (!running) return;
        waterMat.uniforms.uTime.value = t;
        const speed = 1;
        for (const r of turbines) r.rotation.z = t * 0.6 * speed;
        drone.position.set(
          Math.sin(t * 0.15) * 10,
          5.5 + Math.sin(t) * 0.15,
          Math.cos(t * 0.15) * 6,
        );
        drone.rotation.y = -t * 0.15;
        for (const p of props) p.rotation.y = t * 30;
        motes.rotation.y = Math.sin(t * 0.1) * 0.005;
      },
      setLayer(layer) {
        plants.visible = layer !== 'infrastructure';
        waterSystem.visible = layer !== 'crops';
        sensors.visible = layer !== 'crops';
      },
    };
  }

  ObservatoryScenes.builders.agriculture = ({ root, animations, pick, state }) => {
    const model = buildAgriculture(root);
    [
      ['greenhouse', [2, 1.7, -6.5], [8, 3.5, 8], 'crops'],
      ['field', [-10, 0.7, 5], [8, 1, 9], 'crops'],
      ['reservoir', [11, 0.6, 5], [6.7, 1.2, 9.7], 'infrastructure'],
    ].forEach(([id, position, size, layer]) => pick(id, null, position, size, layer));
    model.update(0, true);
    animations.push((t) => model.update(t, true));
    return { setLayer: (value) => model.setLayer(value), root: model.root };
  };
})();
