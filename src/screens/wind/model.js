/* Procedural wind turbine digital twin. Three.js r160, custom glass and flow shaders. */
(() => {
  'use strict';
  const T = window.THREE,
    TAU = Math.PI * 2;
  window.WindTwin = {
    create(host, onPart) {
      const scene = new T.Scene(),
        camera = new T.PerspectiveCamera(32, 1, 0.1, 150),
        renderer = new T.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
      renderer.setClearColor(0, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.23;
      const canvas = renderer.domElement;
      canvas.id = 'wind-3d-canvas';
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', '三维风机模型：拖动旋转，滚轮缩放，点击部件查看详情');
      host.replaceChildren(canvas);
      const studio = document.createElement('canvas');
      studio.width = 512;
      studio.height = 256;
      const sx = studio.getContext('2d'),
        sg = sx.createLinearGradient(0, 0, 0, 256);
      sg.addColorStop(0, '#b8c9e5');
      sg.addColorStop(0.28, '#3d526b');
      sg.addColorStop(0.48, '#1c293c');
      sg.addColorStop(0.7, '#17212e');
      sg.addColorStop(1, '#263746');
      sx.fillStyle = sg;
      sx.fillRect(0, 0, 512, 256);
      sx.fillStyle = '#dce7ef';
      sx.fillRect(90, 30, 30, 100);
      sx.fillStyle = '#819cae';
      sx.fillRect(350, 45, 45, 85);
      const envTex = new T.CanvasTexture(studio);
      envTex.mapping = T.EquirectangularReflectionMapping;
      const pmrem = new T.PMREMGenerator(renderer),
        envTarget = pmrem.fromEquirectangular(envTex);
      scene.environment = envTarget.texture;
      envTex.dispose();
      pmrem.dispose();
      scene.add(new T.HemisphereLight(0xdceeff, 0x24314a, 2));
      const key = new T.DirectionalLight(0xf4f5ff, 3.7);
      key.position.set(-9, 12, 10);
      scene.add(key);
      const fill = new T.DirectionalLight(0x7fbed0, 2.5);
      fill.position.set(4, 2, -9);
      scene.add(fill);
      const rim = new T.DirectionalLight(0xaaa5d5, 1.8);
      rim.position.set(9, 9, 3);
      scene.add(rim);
      const root = new T.Group();
      scene.add(root);
      const casing = new T.Group(),
        internals = new T.Group(),
        rotor = new T.Group(),
        tower = new T.Group(),
        flowGroup = new T.Group(),
        technical = new T.Group();
      root.add(casing, internals, rotor, tower, flowGroup, technical);
      rotor.position.x = -3.15;
      const materials = {
        alloy: new T.MeshStandardMaterial({ color: 0xb5c2ca, metalness: 0.8, roughness: 0.3 }),
        silver: new T.MeshStandardMaterial({ color: 0xd6e1df, metalness: 0.6, roughness: 0.26 }),
        dark: new T.MeshStandardMaterial({ color: 0x304351, metalness: 0.78, roughness: 0.38 }),
        black: new T.MeshStandardMaterial({ color: 0x17232e, metalness: 0.55, roughness: 0.48 }),
        bronze: new T.MeshStandardMaterial({ color: 0xb1a98a, metalness: 0.74, roughness: 0.34 }),
        teal: new T.MeshStandardMaterial({
          color: 0x61c4cd,
          metalness: 0.58,
          roughness: 0.3,
          emissive: 0x0c343c,
          emissiveIntensity: 0.5,
        }),
        ceramic: new T.MeshStandardMaterial({ color: 0xc2d6df, metalness: 0.34, roughness: 0.38 }),
        copper: new T.MeshStandardMaterial({ color: 0xc38960, metalness: 0.8, roughness: 0.3 }),
      };
      const glassUniforms = {
        uTime: { value: 0 },
        uOpacity: { value: 0.25 },
        uWire: { value: 0 },
        uCool: { value: 0 },
      };
      const glass = new T.ShaderMaterial({
        uniforms: glassUniforms,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        extensions: { derivatives: true },
        vertexShader: `varying vec3 vN,vV,vP;varying vec2 vUv;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=-p.xyz;vP=position;gl_Position=projectionMatrix*p;}`,
        fragmentShader: `uniform float uTime,uOpacity,uWire,uCool;varying vec3 vN,vV,vP;varying vec2 vUv;
 float line(vec2 q){vec2 d=abs(fract(q+.5)-.5)/max(fwidth(q),vec2(.0001));return 1.-smoothstep(0.,.65,min(d.x,d.y));}
 void main(){vec3 N=normalize(vN),V=normalize(vV);float f=pow(1.-abs(dot(N,V)),2.6);float grid=line(vUv*vec2(22.,14.));float stripe=pow(max(0.,dot(N,normalize(vec3(-.2,.9,.4)))),14.);float angle=dot(N,V);vec3 tint=mix(vec3(.47,.57,.68),vec3(.09,.58,.7),uCool);vec3 c=tint*.48+vec3(.79,.9,1.)*f*.9+vec3(.54,.66,.77)*grid*.28+stripe*.32;float a=uOpacity+f*.43+grid*.09+stripe*.12;float wireAlpha=grid*.4+f*.35;c=mix(c,vec3(.2,.75,.86)*(grid+f),uWire);a=mix(a,wireAlpha,uWire);gl_FragColor=vec4(c,a);}`,
      });
      const bladeGlass = glass.clone();
      bladeGlass.uniforms = { ...glassUniforms, uOpacity: { value: 0.16 } };
      const wireMaterial = new T.LineBasicMaterial({
        color: 0xa0c3d2,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      const outlineMat = new T.LineBasicMaterial({
        color: 0xcbe6ee,
        transparent: true,
        opacity: 0.54,
      });
      const partMeshes = [],
        spinParts = [],
        exploded = [];
      let running = true,
        wire = false,
        explodeTarget = 0,
        explosion = 0,
        energy = false,
        cool = false,
        auto = false,
        paused = false,
        frame,
        disposed = false;
      function mesh(geo, mat, parent, x = 0, y = 0, z = 0, part) {
        const o = new T.Mesh(geo, mat);
        o.position.set(x, y, z);
        parent.add(o);
        if (part) {
          o.userData.part = part;
          partMeshes.push(o);
        }
        return o;
      }
      const geometryCache = new Map();
      function sharedGeometry(key, create) {
        if (!geometryCache.has(key)) geometryCache.set(key, create());
        return geometryCache.get(key);
      }
      function box(x, y, z, sx, sy, sz, mat = materials.alloy, parent = internals, part) {
        const o = mesh(
          sharedGeometry('box', () => new T.BoxGeometry(1, 1, 1)),
          mat,
          parent,
          x,
          y,
          z,
          part,
        );
        o.scale.set(sx, sy, sz);
        return o;
      }
      function cyl(
        x,
        y,
        z,
        r,
        len,
        mat = materials.alloy,
        parent = internals,
        part,
        segments = 56,
      ) {
        const o = mesh(
          sharedGeometry(
            'cylinder:' + segments,
            () => new T.CylinderGeometry(1, 1, 1, segments, 1),
          ),
          mat,
          parent,
          x,
          y,
          z,
          part,
        );
        o.scale.set(r, len, r);
        o.rotation.z = Math.PI / 2;
        return o;
      }
      function ring(x, y, z, r, tube, mat = materials.silver, parent = internals, part) {
        const o = mesh(
          sharedGeometry(`torus:${r}:${tube}`, () => new T.TorusGeometry(r, tube, 8, 80)),
          mat,
          parent,
          x,
          y,
          z,
          part,
        );
        o.rotation.y = Math.PI / 2;
        return o;
      }
      function link(a, b, r, mat = materials.silver, parent = internals) {
        const av = new T.Vector3(...a),
          bv = new T.Vector3(...b),
          d = bv.clone().sub(av),
          o = mesh(new T.CylinderGeometry(r, r, d.length(), 10), mat, parent);
        o.position.copy(av.add(bv).multiplyScalar(0.5));
        o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
        return o;
      }
      function tube(points, r, mat, parent = internals) {
        return mesh(
          new T.TubeGeometry(
            new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
            40,
            r,
            7,
            false,
          ),
          mat,
          parent,
        );
      }
      function outline(o, mat = outlineMat) {
        const l = new T.LineSegments(new T.EdgesGeometry(o.geometry, 25), mat);
        o.add(l);
        return l;
      }
      function bolts(x, r, count, parent = internals) {
        const geo = sharedGeometry('bolt', () => new T.CylinderGeometry(0.045, 0.045, 0.07, 6));
        for (let i = 0; i < count; i++) {
          const a = (i * TAU) / count;
          const b = mesh(geo, materials.dark, parent, x, Math.cos(a) * r, Math.sin(a) * r);
          b.rotation.z = Math.PI / 2;
        }
      }
      function groupPart(name, offset) {
        const g = new T.Group();
        g.userData.part = name;
        internals.add(g);
        exploded.push({ o: g, base: g.position.clone(), offset: new T.Vector3(...offset) });
        return g;
      }
      // Bedplate, support rails and the longitudinal drivetrain.
      const bed = groupPart('bedplate', [0, -1.1, 0]);
      box(1.7, -1.15, 0, 8.5, 0.27, 2.22, materials.dark, bed, 'bedplate');
      for (let z of [-0.94, 0.94]) {
        box(1.55, -0.92, z, 8.3, 0.22, 0.17, materials.alloy, bed);
        for (let x = -2; x < 6; x += 0.72)
          box(x, -0.73, z, 0.16, 0.25, 0.26, materials.silver, bed);
      }
      const shaft = groupPart('shaft', [-1.2, 0, 0]);
      cyl(-1.9, 0, 0, 0.43, 2.6, materials.alloy, shaft, 'shaft');
      for (let x of [-2.6, -1.85, -0.87]) {
        cyl(x, 0, 0, 0.75, 0.27, materials.silver, shaft, 'shaft');
        ring(x - 0.14, 0, 0, 0.64, 0.07, materials.bronze, shaft);
        bolts(x - 0.16, 0.62, 16, shaft);
        box(x, -0.68, 0, 0.42, 0.62, 1.45, materials.dark, shaft);
      }
      const gear = groupPart('gearbox', [0, 0, 1.2]);
      cyl(0.25, 0, 0, 1.06, 1.7, materials.alloy, gear, 'gearbox');
      cyl(-0.65, 0, 0, 1.16, 0.17, materials.silver, gear, 'gearbox');
      cyl(1.13, 0, 0, 0.9, 0.15, materials.dark, gear, 'gearbox');
      bolts(-0.75, 0.98, 28, gear);
      for (let x = -0.48; x < 1.1; x += 0.12) ring(x, 0, 0, 1.065, 0.025, materials.dark, gear);
      const gearRotor = new T.Group();
      gear.add(gearRotor);
      spinParts.push(gearRotor);
      cyl(-0.81, 0, 0, 0.45, 0.12, materials.bronze, gearRotor);
      for (let i = 0; i < 48; i++) {
        const a = (TAU * i) / 48;
        const t = box(
          -0.84,
          Math.cos(a) * 0.58,
          Math.sin(a) * 0.58,
          0.1,
          0.13,
          0.1,
          materials.silver,
          gearRotor,
        );
        t.rotation.x = -a;
      }
      for (let a = 0; a < TAU; a += TAU / 3) {
        const y = Math.cos(a) * 0.72,
          z = Math.sin(a) * 0.72;
        cyl(-0.88, y, z, 0.27, 0.15, materials.bronze, gearRotor);
        ring(-0.99, y, z, 0.2, 0.025, materials.silver, gearRotor);
      }
      for (let z of [-0.9, 0.9]) box(0.25, -0.86, z, 1.8, 0.46, 0.38, materials.dark, gear);
      const coupling = groupPart('coupling', [0.8, 0, 0]);
      cyl(1.55, 0, 0, 0.3, 1.4, materials.dark, coupling, 'coupling');
      for (let x of [1.15, 1.4, 1.65, 1.9]) {
        cyl(x, 0, 0, 0.48, 0.12, materials.silver, coupling);
        ring(x, 0, 0, 0.47, 0.025, materials.teal, coupling);
      }
      const gen = groupPart('generator', [2.0, 0, 0]);
      cyl(3.45, 0, 0, 0.86, 2.85, materials.alloy, gen, 'generator');
      cyl(2.02, 0, 0, 0.94, 0.18, materials.dark, gen, 'generator');
      cyl(4.9, 0, 0, 0.89, 0.16, materials.silver, gen, 'generator');
      bolts(2.13, 0.76, 22, gen);
      bolts(5, 0.73, 22, gen);
      for (let i = 0; i < 52; i++) {
        const a = (TAU * i) / 52;
        const o = box(
          3.5,
          Math.cos(a) * 0.88,
          Math.sin(a) * 0.88,
          2.5,
          0.075,
          0.055,
          i % 5 === 0 ? materials.dark : materials.alloy,
          gen,
        );
        o.rotation.x = a;
      }
      for (let x of [2.35, 4.65]) ring(x, 0, 0, 0.9, 0.07, materials.dark, gen);
      box(3.6, 0.98, -0.15, 1.4, 0.42, 1.0, materials.silver, gen, 'generator');
      outline(box(3.6, 1.2, -0.15, 1.42, 0.06, 1.02, materials.ceramic, gen));
      for (let z of [-0.65, 0.65]) {
        box(3.4, -0.9, z, 2.1, 0.32, 0.31, materials.dark, gen);
        link([2.9, -1, z], [2.8, -0.55, z], 0.09, materials.alloy, gen);
      }
      // Copper winding, cooling ducts, service hydraulics, cabinets and cable looms.
      for (let i = 0; i < 24; i++) {
        const a = (TAU * i) / 24;
        ring(4.99, Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0.105, 0.026, materials.copper, gen);
      }
      const rear = groupPart('converter', [1.8, 0, -1.2]);
      box(5.5, 0.2, 0, 1.0, 1.7, 1.9, materials.alloy, rear, 'converter');
      for (let z of [-0.97, 0.97]) {
        const face = box(5.5, 0.2, z, 1.02, 1.65, 0.03, materials.dark, rear);
        outline(face);
        for (let y = -0.37; y < 0.8; y += 0.13)
          box(5.52, y, z * 1.01, 0.68, 0.035, 0.024, materials.alloy, rear);
      }
      box(5.56, 1.13, 0, 1.2, 0.22, 2.0, materials.silver, rear);
      for (let z of [-1.05, 1.05]) {
        tube(
          [
            [-1.2, -0.55, z],
            [-0.8, -0.9, z],
            [2, -0.9, z],
            [3.8, -0.6, z],
            [5.2, -0.55, z],
          ],
          0.045,
          materials.teal,
        );
        tube(
          [
            [-1, -0.65, z],
            [0, -0.65, z],
            [1.3, -0.8, z],
            [5, -0.8, z],
          ],
          0.035,
          materials.black,
        );
      }
      for (let x of [-1.3, 0.2, 1.7, 3.2, 4.7])
        for (let z of [-1.15, 1.15]) {
          link([x, -1, z], [x, 1.2, z], 0.026, materials.dark);
          link([x, -1, z], [x + 0.65, 1.2, z], 0.015, materials.alloy);
        }
      // Yaw bearing and transparent tower neck.
      const yaw = mesh(
        new T.CylinderGeometry(0.95, 1.02, 0.42, 96),
        materials.dark,
        tower,
        1.7,
        -1.52,
        0,
        'yaw',
      );
      for (let y of [-1.4, -1.64]) {
        const r = mesh(new T.TorusGeometry(0.96, 0.06, 8, 80), materials.silver, tower, 1.7, y, 0);
        r.rotation.x = Math.PI / 2;
      }
      const towerShell = mesh(
        new T.CylinderGeometry(0.81, 1.08, 6.5, 64, 12, true),
        bladeGlass,
        tower,
        1.7,
        -5.0,
        0,
        'yaw',
      );
      outline(
        towerShell,
        new T.LineBasicMaterial({ color: 0x789aaf, transparent: true, opacity: 0.1 }),
      );
      for (let i = 0; i < 6; i++) {
        const y = -2 - i;
        const o = mesh(
          new T.TorusGeometry(0.86 + i * 0.04, 0.016, 5, 64),
          wireMaterial,
          tower,
          1.7,
          y,
          0,
        );
        o.rotation.x = Math.PI / 2;
      }
      // Rounded, tapered nacelle shell, built as a loft with actual surface UVs.
      const shellPositions = [],
        shellUvs = [],
        shellIndices = [];
      const sections = 44,
        sides = 80;
      function shellPoint(t, a) {
        const x = -2.6 + t * 9.05;
        const nose = 0.72 + 0.28 * Math.sin((Math.min(t / 0.16, 1) * Math.PI) / 2),
          tail = 1 - 0.16 * Math.pow(t, 5);
        const h = 1.46 * nose * tail,
          w = 1.3 * nose * tail;
        const sn = Math.sin(a),
          cs = Math.cos(a);
        return [
          x,
          0.15 + Math.sign(cs) * Math.pow(Math.abs(cs), 0.54) * h,
          Math.sign(sn) * Math.pow(Math.abs(sn), 0.54) * w,
        ];
      }
      for (let i = 0; i <= sections; i++)
        for (let j = 0; j <= sides; j++) {
          const t = i / sections,
            a = (j / sides) * TAU;
          shellPositions.push(...shellPoint(t, a));
          shellUvs.push(t, j / sides);
          if (i < sections && j < sides) {
            const n = i * (sides + 1) + j;
            shellIndices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2);
          }
        }
      const shellGeo = new T.BufferGeometry();
      shellGeo.setAttribute('position', new T.Float32BufferAttribute(shellPositions, 3));
      shellGeo.setAttribute('uv', new T.Float32BufferAttribute(shellUvs, 2));
      shellGeo.setIndex(shellIndices);
      shellGeo.computeVertexNormals();
      const shell = mesh(shellGeo, glass, casing, 0, 0, 0, 'casing');
      shell.renderOrder = 4;
      for (let t of [0, 0.15, 0.4, 0.68, 1]) {
        const points = [];
        for (let j = 0; j <= 80; j++) points.push(new T.Vector3(...shellPoint(t, (j / 80) * TAU)));
        const l = new T.Line(
          new T.BufferGeometry().setFromPoints(points),
          t === 0 || t === 1 ? outlineMat : wireMaterial,
        );
        casing.add(l);
      }
      for (let a of [Math.PI * 0.22, Math.PI * 0.78, Math.PI * 1.22, Math.PI * 1.78]) {
        const pts = [];
        for (let i = 0; i <= 44; i++) pts.push(new T.Vector3(...shellPoint(i / 44, a)));
        casing.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), wireMaterial));
      }
      // Original V/L monogram; no third-party logo is distributed.
      const vlA = box(1.2, -0.05, 1.315, 0.075, 0.76, 0.045, materials.teal, casing);
      vlA.rotation.z = 0.28;
      const vlB = box(1.45, -0.05, 1.315, 0.075, 0.76, 0.045, materials.teal, casing);
      vlB.rotation.z = -0.28;
      box(1.95, -0.05, 1.315, 0.075, 0.76, 0.045, materials.teal, casing);
      box(2.18, -0.4, 1.315, 0.52, 0.075, 0.045, materials.teal, casing);
      // Rear service hood raised above the housing, with a thin curved section.
      const hoodGeo = new T.PlaneGeometry(2.9, 2.68, 16, 18);
      const hp = hoodGeo.attributes.position;
      for (let i = 0; i < hp.count; i++) {
        const x = hp.getX(i),
          y = hp.getY(i);
        hp.setXYZ(i, x + 4.4, 2.0 + Math.sin((x / 2.9 + 0.5) * Math.PI) * 0.5, y);
      }
      hoodGeo.computeVertexNormals();
      const hood = mesh(hoodGeo, glass, casing, 0, 0, 0, 'casing');
      hood.renderOrder = 5;
      outline(hood);
      for (let z of [-1.3, 1.3])
        link([5.9, 1.25, z], [5.9, 2.15, z], 0.026, materials.silver, casing);
      // Hollow nose hub, pitch bearings, three shaped airfoil blades and internal actuators.
      const rotorFrame = new T.Group();
      rotor.add(rotorFrame);
      const hubShell = mesh(
        new T.SphereGeometry(1.13, 48, 24, 0, TAU, 0, Math.PI),
        glass,
        rotorFrame,
        -0.28,
        0,
        0,
        'rotor',
      );
      hubShell.scale.set(1.15, 1, 1);
      hubShell.renderOrder = 4;
      cyl(0, 0, 0, 0.56, 1.3, materials.silver, rotorFrame, 'rotor');
      cyl(-0.7, 0, 0, 0.42, 0.14, materials.dark, rotorFrame, 'rotor');
      ring(-1.05, 0, 0, 0.56, 0.035, materials.silver, rotorFrame);
      for (let a = 0; a < TAU; a += TAU / 3) {
        const arm = new T.Group();
        arm.rotation.x = a;
        rotorFrame.add(arm);
        const bearing = mesh(
          new T.CylinderGeometry(0.57, 0.57, 0.23, 64),
          materials.silver,
          arm,
          -0.1,
          0.93,
          0,
          'pitch',
        );
        for (let yy of [0.84, 1.04]) {
          const r = mesh(
            new T.TorusGeometry(0.54, 0.045, 8, 64),
            materials.bronze,
            arm,
            -0.1,
            yy,
            0,
          );
          r.rotation.x = Math.PI / 2;
        }
        for (let j = 0; j < 18; j++) {
          const b = (TAU * j) / 18;
          const o = mesh(
            sharedGeometry('pitch-bolt', () => new T.CylinderGeometry(0.028, 0.028, 0.07, 6)),
            materials.dark,
            arm,
            -0.1 + Math.cos(b) * 0.47,
            1.08,
            Math.sin(b) * 0.47,
          );
        }
        link([-0.65, 0.05, 0.1], [-0.1, 0.95, 0.2], 0.06, materials.alloy, arm);
        link([-0.7, 0.2, -0.08], [0.25, 0.87, -0.2], 0.045, materials.bronze, arm);
        link([-0.6, 0.4, 0.3], [0.12, 0.92, 0.3], 0.034, materials.silver, arm);
        box(-0.48, 0.45, 0.1, 0.38, 0.22, 0.32, materials.ceramic, arm);
        const bp = [],
          bu = [],
          bi = [],
          nr = 50,
          nc = 22;
        for (let i = 0; i <= nr; i++) {
          const t = i / nr,
            r = 1.06 + t * 7.7;
          const chord =
            (1.0 + 1.95 * Math.sin(Math.pow(t, 0.55) * Math.PI)) * (1 - 0.93 * Math.pow(t, 2.5));
          const twist = 0.4 * (1 - t) - 0.1;
          for (let j = 0; j <= nc; j++) {
            const u = j / nc,
              theta = u * TAU;
            const zz = Math.cos(theta) * chord * 0.5;
            const thickness = (0.12 * (1 - t) + 0.015) * Math.sin(theta);
            const xx =
              -0.1 + Math.sin(theta) * chord * 0.11 + Math.sin(twist) * zz - 0.45 * Math.pow(t, 2);
            bp.push(xx, r, Math.cos(twist) * zz + thickness);
            bu.push(t, u);
            if (i < nr && j < nc) {
              const n = i * (nc + 1) + j;
              bi.push(n, n + 1, n + nc + 1, n + 1, n + nc + 2, n + nc + 1);
            }
          }
        }
        const bg = new T.BufferGeometry();
        bg.setAttribute('position', new T.Float32BufferAttribute(bp, 3));
        bg.setAttribute('uv', new T.Float32BufferAttribute(bu, 2));
        bg.setIndex(bi);
        bg.computeVertexNormals();
        const b = mesh(bg, bladeGlass, arm, 0, 0, 0, 'blade');
        b.renderOrder = 3;
        const contour = [];
        for (let i = 0; i <= nr; i++) {
          const v = i * (nc + 1) * 3;
          contour.push(new T.Vector3(bp[v], bp[v + 1], bp[v + 2]));
        }
        for (let i = nr; i >= 0; i--) {
          const v = (i * (nc + 1) + nc / 2) * 3;
          contour.push(new T.Vector3(bp[v], bp[v + 1], bp[v + 2]));
        }
        const line = new T.Line(
          new T.BufferGeometry().setFromPoints(contour),
          new T.LineBasicMaterial({ color: 0xb3ccdb, transparent: true, opacity: 0.37 }),
        );
        arm.add(line);
      }
      rotor.rotation.x = -0.25;
      // Subtle technical silhouette and selection energy flows.
      const flowUniforms = { uTime: { value: 0 }, uOn: { value: 0 } };
      const flowMat = new T.ShaderMaterial({
        uniforms: flowUniforms,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        vertexShader:
          'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'uniform float uTime,uOn;varying vec2 vUv;void main(){float d=fract(vUv.x*9.-uTime*.65);float pulse=pow(max(0.,1.-d),8.);gl_FragColor=vec4(vec3(.13,.9,1.)*(.25+pulse),(.18+pulse*.8)*uOn);}',
      });
      const path = new T.CatmullRomCurve3([
        new T.Vector3(-3.5, 0, 0),
        new T.Vector3(-1.4, 0, 0),
        new T.Vector3(1.8, 0, 0),
        new T.Vector3(4.6, 0, 0),
        new T.Vector3(5.4, -0.6, 0),
        new T.Vector3(2, -1.6, 0),
        new T.Vector3(1.7, -6, 0),
      ]);
      mesh(new T.TubeGeometry(path, 150, 0.065, 10, false), flowMat, flowGroup);
      const sparkleMat = new T.PointsMaterial({
        color: 0x7be9ee,
        size: 0.05,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: T.AdditiveBlending,
      });
      const sparkPos = new Float32Array(90 * 3);
      const sparks = new T.Points(
        new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(sparkPos, 3)),
        sparkleMat,
      );
      flowGroup.add(sparks);
      const wireGroup = new T.Group(),
        wireLinks = [];
      root.add(wireGroup);
      internals.updateMatrixWorld(true);
      internals.traverse((o) => {
        if (!o.isMesh || o.geometry.type === 'TubeGeometry') return;
        const w = new T.LineSegments(
          new T.EdgesGeometry(o.geometry, 28),
          new T.LineBasicMaterial({ color: 0x67d3df, transparent: true, opacity: 0.48 }),
        );
        w.matrixAutoUpdate = false;
        w.matrix.copy(o.matrixWorld);
        wireGroup.add(w);
        wireLinks.push({ source: o, line: w });
      });
      wireGroup.visible = false;
      // Batch only static, opaque leaf meshes within the same parent. Animated groups,
      // selectable parts and glass remain separate. Hidden originals retain wire transforms.
      let instancedParts = 0,
        instanceBatches = 0;
      const parents = [];
      root.traverse((o) => {
        if (o.isGroup) parents.push(o);
      });
      for (const parent of parents) {
        const batches = new Map();
        for (const o of parent.children) {
          if (
            !o.isMesh ||
            o.userData.part ||
            o.children.length ||
            !o.visible ||
            o.material.transparent ||
            o.material.isShaderMaterial
          )
            continue;
          const key = o.geometry.uuid + ':' + o.material.uuid;
          if (!batches.has(key)) batches.set(key, []);
          batches.get(key).push(o);
        }
        for (const objects of batches.values()) {
          if (objects.length < 3) continue;
          const first = objects[0],
            batch = new T.InstancedMesh(first.geometry, first.material, objects.length);
          objects.forEach((o, i) => {
            o.updateMatrix();
            batch.setMatrixAt(i, o.matrix);
            o.visible = false;
          });
          batch.computeBoundingSphere();
          parent.add(batch);
          instancedParts += objects.length;
          instanceBatches++;
        }
      }
      canvas.dataset.instancedParts = String(instancedParts);
      canvas.dataset.instanceBatches = String(instanceBatches);
      // Orbit interaction, raycast selection and animated exploded assembly.
      let yawAngle = -0.72,
        elevation = 0.41,
        distance = 19.8,
        drag = null,
        hover = null,
        dirty = true;
      const target = new T.Vector3(0.1, -0.35, 0),
        pointer = new T.Vector2(),
        raycaster = new T.Raycaster();
      let last = performance.now(),
        clock = 0;
      function updateCamera() {
        camera.position.set(
          target.x + Math.sin(yawAngle) * Math.cos(elevation) * distance,
          target.y + Math.sin(elevation) * distance,
          target.z + Math.cos(yawAngle) * Math.cos(elevation) * distance,
        );
        camera.lookAt(target);
        camera.updateMatrixWorld();
        canvas.dataset.yaw = yawAngle.toFixed(3);
        canvas.dataset.zoom = distance.toFixed(2);
        dirty = true;
      }
      function pick(e) {
        const b = canvas.getBoundingClientRect();
        pointer.set(
          ((e.clientX - b.left) / b.width) * 2 - 1,
          (-(e.clientY - b.top) / b.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const h = raycaster
          .intersectObjects(partMeshes, false)
          .filter((x) => !['casing', 'blade'].includes(x.object.userData.part));
        return h[0]?.object.userData.part;
      }
      canvas.addEventListener('pointerdown', (e) => {
        drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        yawAngle -= (e.clientX - drag.x) * 0.006;
        elevation = T.MathUtils.clamp(elevation + (e.clientY - drag.y) * 0.004, -0.45, 0.85);
        drag.x = e.clientX;
        drag.y = e.clientY;
        updateCamera();
      });
      canvas.addEventListener('pointerup', (e) => {
        if (drag && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 5) {
          const p = pick(e);
          if (p) onPart?.(p);
        }
        drag = null;
      });
      canvas.addEventListener('pointercancel', () => (drag = null));
      canvas.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          distance = T.MathUtils.clamp(distance + e.deltaY * 0.012, 15, 37);
          updateCamera();
        },
        { passive: false },
      );
      canvas.addEventListener('dblclick', reset);
      canvas.addEventListener('keydown', (e) => {
        let handled = true;
        if (e.key === 'ArrowLeft') yawAngle -= 0.1;
        else if (e.key === 'ArrowRight') yawAngle += 0.1;
        else if (e.key === 'ArrowUp') elevation = Math.min(0.85, elevation + 0.07);
        else if (e.key === 'ArrowDown') elevation = Math.max(-0.45, elevation - 0.07);
        else if (e.key === '+' || e.key === '=') distance = Math.max(15, distance - 1);
        else if (e.key === '-') distance = Math.min(37, distance + 1);
        else if (e.key.toLowerCase() === 'r') reset();
        else handled = false;
        if (handled) {
          e.preventDefault();
          updateCamera();
        }
      });
      function reset() {
        yawAngle = -0.72;
        elevation = 0.41;
        distance = 19.8;
        target.set(0.1, -0.35, 0);
        updateCamera();
      }
      function resize() {
        const b = host.getBoundingClientRect(),
          w = Math.max(1, b.width),
          h = Math.max(1, b.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        dirty = true;
      }
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      function visibilityChanged() {
        paused = document.hidden;
        last = performance.now();
      }
      document.addEventListener('visibilitychange', visibilityChanged);
      let sampleStart = performance.now(),
        sampleFrames = 0;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      function animate(now) {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        const dt = Math.min((now - last) / 1000, 0.045);
        last = now;
        if (paused) return;
        clock += dt;
        glassUniforms.uTime.value = clock;
        flowUniforms.uTime.value = clock;
        if (running && !reduceMotion) {
          rotor.rotation.x += dt * 0.018;
          spinParts.forEach((o) => (o.rotation.x += dt * 0.18));
        }
        if (auto && !drag) {
          yawAngle += dt * 0.055;
          updateCamera();
        }
        explosion = T.MathUtils.damp(explosion, explodeTarget, 3.5, dt);
        exploded.forEach(({ o, base, offset }) =>
          o.position.copy(base).addScaledVector(offset, explosion),
        );
        casing.position.y = explosion * 2.3;
        rotor.position.x = -3.15 - explosion * 0.9;
        wireGroup.visible = wire;
        if (wire)
          wireLinks.forEach(({ source, line }) => {
            source.updateWorldMatrix(true, false);
            line.matrix.copy(source.matrixWorld);
          });
        flowUniforms.uOn.value = T.MathUtils.damp(
          flowUniforms.uOn.value,
          energy && running ? 1 : 0,
          4,
          dt,
        );
        sparkleMat.opacity = flowUniforms.uOn.value * 0.8;
        if (energy) {
          for (let i = 0; i < 90; i++) {
            const p = path.getPoint((i / 90 + clock * 0.055) % 1);
            sparkPos[i * 3] = p.x;
            sparkPos[i * 3 + 1] = p.y;
            sparkPos[i * 3 + 2] = p.z;
          }
          sparks.geometry.attributes.position.needsUpdate = true;
        }
        canvas.dataset.exploded =
          explosion > 0.97 ? 'true' : explosion < 0.03 ? 'false' : 'transition';
        canvas.dataset.running = String(running);
        canvas.dataset.wire = String(wire);
        canvas.dataset.flow = String(energy);
        renderer.render(scene, camera);
        canvas.dataset.ready = 'true';
        canvas.dataset.triangles = renderer.info.render.triangles;
        canvas.dataset.drawCalls = renderer.info.render.calls;
        canvas.dataset.geometries = renderer.info.memory.geometries;
        sampleFrames++;
        if (now - sampleStart >= 1000) {
          canvas.dataset.fps = ((sampleFrames * 1000) / (now - sampleStart)).toFixed(1);
          sampleStart = now;
          sampleFrames = 0;
        }
      }
      resize();
      updateCamera();
      frame = requestAnimationFrame(animate);
      return {
        setRunning(v) {
          running = v;
        },
        setWire(v) {
          wire = v;
          glassUniforms.uWire.value = v ? 1 : 0;
          internals.visible = !v;
        },
        setExplode(v) {
          explodeTarget = v ? 1 : 0;
        },
        setFlow(v) {
          energy = v;
        },
        setCool(v) {
          cool = v;
          glassUniforms.uCool.value = v ? 1 : 0;
          key.color.set(v ? 0x83d1ff : 0xf4f5ff);
        },
        setAuto(v) {
          auto = v;
        },
        reset,
        production() {
          yawAngle = -0.13;
          elevation = 0.12;
          distance = 30;
          target.set(1, -1.4, 0);
          updateCamera();
        },
        selectUnit(id) {
          reset();
          rotor.rotation.x = id === 'G1031' ? 0.15 : id === 'G1030' ? 0 : -0.25;
        },
        dispose() {
          if (disposed) return;
          disposed = true;
          cancelAnimationFrame(frame);
          observer.disconnect();
          document.removeEventListener('visibilitychange', visibilityChanged);
          const geometries = new Set(),
            mats = new Set();
          scene.traverse((o) => {
            if (o.geometry) geometries.add(o.geometry);
            if (o.material)
              (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
          });
          geometries.forEach((g) => g.dispose());
          mats.forEach((m) => m.dispose());
          envTarget.dispose();
          renderer.dispose();
          canvas.remove();
        },
      };
    },
  };
})();
