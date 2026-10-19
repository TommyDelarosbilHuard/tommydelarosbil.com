/* William J. Walter, Quebec City — the table at 45 degrees. One shop, rendered twice: before and after.
   ─────────────────────────────────────────────────────────────────────────────────────────────────────────
   HOW TO CHANGE IT
   • Words on the image → STORY below. The site draws them on top of the render: no re-bake.
   • Move a pin or a label → PINS below, then  node tools/bake_scene.mjs beer-table --anchors   (seconds)
   • Move furniture, people, paths, light → PLAN / BEFORE / AFTER / LOOK, then
       node tools/bake_scene.mjs beer-table --raster     (5 s layout check, writes the image too)
       node tools/bake_scene.mjs beer-table              (final path-traced bake, a few minutes)
   • A new image from the same shop (Observe, Friction…) → add a framing or a third layout; build() takes any layout.
   Plan units are metres, measured from Tommy's sketches: x runs along the counter (west → east),
   z runs from the back wall towards the street (north → south). The site never loads this file's 3D part. */

export const STORY = {
  heads: { before: ['Before', 'Square table'], after: ['After', 'Table turned 45°'] },
  result: ['+15%', 'beer sales', ''],
  before: ['Straight to the counter, like a corridor', 'Beer noticed only after paying', 'Left without beer'],
  after: ['Beer at the door: they stop and look', 'The table works like a stop sign', 'Beer beside the sausages: a beer first', 'Left with both'],
};

// the room and what never moves
export const PLAN = {
  w: 6.0, d: 7.2, wallH: 2.7, wall: 0.16, knee: 0.34, slab: 0.26,
  door: [0.16, 1.92],                                   // the entrance: a gap in the street wall (x from → to)
  counter: { x: 0.0, z: 0.46, w: 4.02, d: 0.98, h: 0.94 },
  cashier: { x: 4.13, z: 0.46, w: 1.63, d: 0.98, h: 0.98 },
  beam: { x: 3.36, z: 2.3, w: 0.62, d: 0.62 },
  fridge: { x: 5.12, z: 2.75, w: 0.88, d: 2.28, h: 2.05 },
  bench: { x: 2.03, z: 6.62, w: 3.97, d: 0.5, h: 1.04 },
  benchStools: [[2.84, 6.22], [3.91, 6.22], [5.09, 6.22]],
  sconces: [0.75, 1.95, 3.15],
  plant: [5.6, 5.55],
  window: [5.3, 6.95],                                  // a tall window in the east wall (z from → to)
  clerk: [1.9, 0.24],
};

// what Tommy changed
export const BEFORE = {
  table: { x: 2.61, z: 4.2, turn: 0 },
  stools: [[1.73, 3.67], [1.73, 4.75], [3.49, 3.67], [3.49, 4.75]],
  people: [{ at: [1.06, 4.9], face: 0 }, { at: [2.3, 1.72], face: 0 }, { at: [2.6, 5.7], face: 270 }],
  path: { style: 'dots', pts: [[1.06, 7.75], [1.06, 1.85], [4.94, 1.85], [4.58, 2.21], [4.58, 5.7], [1.25, 5.7], [1.25, 7.75]] },
  beerAtDoor: false, beerOnCounter: [],
};
export const AFTER = {
  table: { x: 2.51, z: 4.1, turn: 45 },
  stools: [[2.83, 3.02], [3.59, 3.78], [1.45, 4.38], [2.21, 5.14]],
  people: [{ at: [1.02, 6.45], face: 300 }, { at: [1.72, 1.72], face: 0, beer: true }, { at: [2.6, 5.76], face: 270, beer: true }],
  path: { style: 'glow', pts: [[0.98, 7.75], [0.98, 6.2], [0.86, 5.3], [0.8, 4.3], [0.92, 3.2], [1.2, 2.25], [1.7, 1.86], [3.2, 1.84], [4.62, 1.88], [4.58, 2.6], [4.55, 4.6], [4.4, 5.55], [3.8, 5.78], [1.3, 5.78], [1.24, 7.75]] },
  beerAtDoor: true, beerOnCounter: [0.37, 0.94, 3.05, 3.62],
};

// numbered pins (plan x, z) — the legends in STORY follow the same order
export const PINS = {
  before: [[1.06, 3.9], [4.58, 3.7], [2.9, 5.7]],
  after: [[0.98, 6.75], [0.84, 3.75], [1.45, 1.86], [2.9, 5.78]],
};

export const LOOK = {
  backdrop: '#F6E6D0', backdropGlow: 0.34, slabSide: '#EDE7DD', cap: '#F6F2EB', plaster: '#EEE7DC', wainscot: '#304538',
  walnut: '#4B3020', oak: '#B98A5C', steel: '#1B1B1B', figure: '#F1EDE6', ink: '#2C251F', amber: '#FF9A2E',
  sun: { color: '#FFCF96', power: 9, from: [-14, 9.5, 11] },
  sky: { top: '#FFF5E8', bottom: '#B5A794', power: 0.75 },
  key: { color: '#FFF1E2', power: 3.4 },
  sconce: { color: '#FFC98A', power: 5 },
  fridge: { color: '#FFE2B8', power: 22 },
};

export const framings = {
  wide: { w: 2560, h: 1536, spp: 256, viewH: 13.7, target: [0, 0.1, 0.95] },
  compact: { w: 1500, h: 1000, spp: 100, viewH: 14.3, target: [0, 0.2, 0.75] },
};
export const exposure = 0.84;
export const denoise = { sigma: 3, threshold: 0.07, kSigma: 1 };
export const toneMapping = 'ACESFilmicToneMapping';

const GAP = 11.4, TURN = 30;                                    // centre to centre (m); each shop turned to show its inside (°)

/* ─────────────────────────────────────── the build ─────────────────────────────────────── */
export function build(THREE, K, f) {
  const { M, put, rbox, cyl, sphere, capsule, lathe, mat } = K;
  const V = (...a) => new THREE.Vector3(...a), deg = THREE.MathUtils.degToRad;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(LOOK.backdrop);
  scene.environment = K.sky(LOOK.sky.top, LOOK.sky.bottom, 1.6); scene.environmentIntensity = LOOK.sky.power;

  /* materials, once */
  const floorTex = K.planks({ size: 2048, rows: 16, tone: [146, 103, 70], spread: 0.24, seed: 11 });
  [floorTex.map, floorTex.roughnessMap, floorTex.normalMap].forEach(t => t.repeat.set(2, 2));
  const tiles = (() => {   // white subway tile with grey grout, and its relief
    const draw = (g, w, h, relief) => { g.fillStyle = relief ? '#3a3a3a' : '#CFCBC4'; g.fillRect(0, 0, w, h); const tw = w / 8, th = h / 16;
      for (let r = 0; r < 16; r++) for (let c = -1; c < 9; c++) { const x = c * tw + (r % 2) * tw / 2, y = r * th;
        if (relief) { const gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.2, '#e6e6e6'); gr.addColorStop(0.8, '#e6e6e6'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; }
        else g.fillStyle = `hsl(40,12%,${93 + ((r * 7 + c * 13) % 5) * 0.6}%)`;
        g.beginPath(); g.roundRect(x + 3, y + 3, tw - 6, th - 6, 6); g.fill(); } };
    const c = document.createElement('canvas'); c.width = c.height = 1024; draw(c.getContext('2d'), 1024, 1024, false);
    const h = document.createElement('canvas'); h.width = h.height = 1024; draw(h.getContext('2d'), 1024, 1024, true);
    return { map: K.tex(c), normalMap: K.tex(K.normalFrom(h, 4), { srgb: false }) };
  })();
  const W = {
    floor: mat({ ...floorTex, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    slab: M.matte(LOOK.slabSide, 0.9), cap: M.matte(LOOK.cap, 0.9), plaster: M.plaster(LOOK.plaster),
    wainscot: M.paint(LOOK.wainscot, 0.5), rail: M.wood('#6B4A31', 0.45),
    tile: mat({ ...tiles, roughness: 0.34 }),
    walnut: M.wood(LOOK.walnut, 0.42), oak: M.wood(LOOK.oak, 0.5), oakLight: M.wood('#C9A27A', 0.55),
    marble: mat({ map: K.marble({ base: [236, 233, 228], vein: [150, 146, 142], scale: 3, seed: 3 }), roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.12 }),
    steel: M.blackMetal(0.42), chrome: M.metal('#D9DADC', 0.18), brass: M.brass(0.25),
    glass: M.glass({ roughness: 0.01 }), glassBottle: M.glass({ color: '#8C4A12', roughness: 0.06 }), glassGreen: M.glass({ color: '#2F5B2A', roughness: 0.06 }),
    beer: mat({ color: '#5A2A06', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }), beerGreen: mat({ color: '#1F3A1B', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
    cap: M.gold(0.3), tray: M.ceramic('#F4F1EC'), black: M.lacquer('#121212', 0.3), screen: mat({ color: '#0b0f14', emissive: '#7FA6C8', emissiveIntensity: 0.35, roughness: 0.15 }),
    figure: M.matte(LOOK.figure, 0.6), mat: M.matte('#2B2723', 0.95), crate: M.wood('#B8875A', 0.7), card: M.matte('#F3EEE6', 0.85),
    leaf: mat({ color: '#3E5F33', roughness: 0.55, sheen: 0.4, sheenColor: '#9DBF7E' }), pot: M.ceramic('#E9E3DA', 0.35), soil: M.matte('#2B2119', 1),
    dot: M.matte('#1E1915', 0.7), glow: mat({ color: '#FFB060', emissive: LOOK.amber, emissiveIntensity: 3.4, roughness: 0.4 }),
    fridgeIn: mat({ color: '#F4ECE0', emissive: '#FFE3B8', emissiveIntensity: 7, roughness: 0.6 }), led: mat({ color: '#fff', emissive: '#FFF0D8', emissiveIntensity: 14 }),
    globe: mat({ color: '#FFF4E4', emissive: '#FFD39A', emissiveIntensity: 5, roughness: 0.4 }),
  };
  const SAUS = ['#8C3A22', '#A9472E', '#C98F6E', '#6A2B1C', '#B4623E'].map(c => mat({ color: c, roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
  const LABELS = ['#E8D9B5', '#C23B22', '#1F3B5C', '#F2EFE8', '#D99A2B', '#2E4A2E', '#7A1E2B'].map(c => mat({ color: c, roughness: 0.55 }));
  const board = K.print(1024, 256, (g, w, h) => {                 // the chalkboard menu
    g.fillStyle = '#1E201E'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(240,236,226,.85)'; g.fillStyle = 'rgba(240,236,226,.88)';
    g.font = '600 64px Georgia, serif'; g.textAlign = 'center'; g.fillText('Saucisses & bières', w / 2, 86);
    g.font = '400 30px Georgia, serif'; g.globalAlpha = 0.7; ['Toulouse · Merguez · Italienne', 'Bratwurst · Chorizo · Érable'].forEach((t, i) => g.fillText(t, w / 2, 150 + i * 46));
  });
  W.board = mat({ map: board, roughness: 0.95 });

  /* small things */
  const RNG = K.rng(42);
  // point a light along a direction in its parent's space (a light shines down its −z)
  const aim = (l, dir, parent) => { l.quaternion.setFromUnitVectors(V(0, 0, -1), V(...dir).normalize()); parent.add(l); return l; };
  const bottleGeo = lathe([[0, 0], [0.031, 0], [0.033, 0.006], [0.033, 0.15], [0.029, 0.175], [0.013, 0.205], [0.0115, 0.262], [0.013, 0.268], [0, 0.268]], 28);
  const liquidGeo = lathe([[0, 0.004], [0.03, 0.004], [0.03, 0.148], [0.026, 0.17], [0.011, 0.2], [0, 0.2]], 24);
  const labelGeo = new THREE.CylinderGeometry(0.0335, 0.0335, 0.07, 28, 1, true);
  const bottle = (x, y, z, parent, s = 1, green = false) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
    put(bottleGeo, green ? W.glassGreen : W.glassBottle, [0, 0, 0], g); put(liquidGeo, green ? W.beerGreen : W.beer, [0, 0, 0], g, { scale: [0.97, 1, 0.97] });
    put(labelGeo, LABELS[(RNG() * LABELS.length) | 0], [0, 0.085, 0], g); put(cyl(0.0135, 0.0135, 0.008, 16), W.cap, [0, 0.271, 0], g); return g;
  };
  const stool = (x, z, parent, tall = false) => {
    const h = tall ? 0.76 : 0.46, g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    put(cyl(0.17, 0.17, 0.035, 40), W.oak, [0, h, 0], g);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; put(cyl(0.011, 0.013, h, 10), W.steel, [Math.cos(a) * 0.11, h / 2, Math.sin(a) * 0.11], g, { rot: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12] }); }
    put(new THREE.TorusGeometry(0.12, 0.007, 8, 40), W.steel, [0, h * 0.35, 0], g, { rot: [Math.PI / 2, 0, 0] });
  };
  // architectural-model people: a figure, standing, facing `face` degrees (0 = towards the back wall)
  const person = (x, z, face, parent, beer = false, scale = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = deg(-face + 180); g.scale.setScalar(scale); parent.add(g);
    [[-0.075, 0.03], [0.075, -0.03]].forEach(([lx, sw]) => put(capsule(0.06, 0.74), W.figure, [lx, 0.43, sw], g));
    put(capsule(0.15, 0.42, 20), W.figure, [0, 1.13, 0], g, { scale: [1, 1, 0.68] });
    put(sphere(0.105, 28), W.figure, [0, 1.62, 0.01], g); put(cyl(0.045, 0.05, 0.09, 16), W.figure, [0, 1.49, 0], g);
    put(capsule(0.045, 0.52), W.figure, [-0.2, 1.08, 0], g, { rot: [0, 0, -0.08] });
    if (beer) { put(capsule(0.045, 0.38), W.figure, [0.21, 1.1, 0.1], g, { rot: [-0.7, 0, 0.1] }); bottle(0.23, 0.98, 0.3, g, 1.05); }
    else put(capsule(0.045, 0.52), W.figure, [0.2, 1.08, 0], g, { rot: [0, 0, 0.08] });
    return g;
  };
  const plant = (x, z, parent) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    put(lathe([[0, 0], [0.2, 0], [0.24, 0.05], [0.27, 0.5], [0.25, 0.52], [0, 0.52]], 40), W.pot, [0, 0, 0], g);
    put(cyl(0.245, 0.245, 0.02, 32), W.soil, [0, 0.49, 0], g);
    const leaf = K.surface((u, v) => { const wv = Math.sin(Math.PI * Math.pow(u, 0.75)) * 0.11 * (v - 0.5) * 2; return [wv, u * 0.32, -Math.pow(u, 2) * 0.09 + Math.abs(wv) * 0.25]; }, 14, 6);
    for (let i = 0; i < 46; i++) {
      const t = i / 46, y = 0.6 + t * 1.25, a = i * 2.39996, r = 0.06 + RNG() * 0.05;
      const L = new THREE.Mesh(leaf, W.leaf); L.position.set(Math.cos(a) * r, y, Math.sin(a) * r); L.rotation.set(-0.9 - RNG() * 0.5, a + Math.PI / 2, 0, 'YXZ'); L.scale.setScalar(0.8 + RNG() * 0.6 - t * 0.3); g.add(L);
    }
    put(cyl(0.012, 0.016, 1.3, 8), W.oak, [0, 1.15, 0], g);
  };

  /* one shop, for a layout */
  const shop = (L, cx) => {
    const G = new THREE.Group(); G.position.x = cx; G.rotation.y = deg(TURN); scene.add(G);
    const S = new THREE.Group(); S.position.set(-PLAN.w / 2, 0, -PLAN.d / 2); G.add(S);
    const { w, d, wallH: H, wall: T, knee, slab } = PLAN;
    // the slab, the floor and the walls, cut open towards us
    put(rbox(w + 2 * T, slab, d + 2 * T, 0.03), W.slab, [w / 2, -slab / 2 - 0.004, d / 2], S);
    put(new THREE.BoxGeometry(w, 0.01, d), W.floor, [w / 2, -0.004, d / 2], S);
    const wallBox = (x0, x1, z0, z1, h) => { put(new THREE.BoxGeometry(x1 - x0, h - 0.02, z1 - z0), W.plaster, [(x0 + x1) / 2, (h - 0.02) / 2, (z0 + z1) / 2], S); put(new THREE.BoxGeometry(x1 - x0, 0.02, z1 - z0), W.cap, [(x0 + x1) / 2, h - 0.01, (z0 + z1) / 2], S); };
    wallBox(-T, w + T, -T, 0, H);                                  // back wall
    wallBox(w, w + T, 0, PLAN.window[0], H); wallBox(w, w + T, PLAN.window[1], d + T, H);   // east wall, open for the window
    put(new THREE.BoxGeometry(T, 0.95, PLAN.window[1] - PLAN.window[0]), W.plaster, [w + T / 2, 0.475, (PLAN.window[0] + PLAN.window[1]) / 2], S);
    put(new THREE.BoxGeometry(T, H - 2.35 - 0.02, PLAN.window[1] - PLAN.window[0]), W.plaster, [w + T / 2, (H + 2.35) / 2 - 0.01, (PLAN.window[0] + PLAN.window[1]) / 2], S);
    put(new THREE.BoxGeometry(T, 0.02, PLAN.window[1] - PLAN.window[0]), W.cap, [w + T / 2, H - 0.01, (PLAN.window[0] + PLAN.window[1]) / 2], S);
    wallBox(-T, 0, 0, d + T, knee);                                // west, cut low
    wallBox(-T, PLAN.door[0], d, d + T, knee); wallBox(PLAN.door[1], w, d, d + T, knee);   // street wall, with the door
    put(new THREE.BoxGeometry(PLAN.door[1] - PLAN.door[0], 0.012, T), W.walnut, [(PLAN.door[0] + PLAN.door[1]) / 2, 0.006, d + T / 2], S);   // threshold
    put(rbox(1.3, 0.014, 0.8, 0.004), W.mat, [(PLAN.door[0] + PLAN.door[1]) / 2, 0.007, d - 0.5], S);
    // back wall: white tile over the counters, a chalkboard menu, brass sconces; east wall: green wainscot
    put(new THREE.BoxGeometry(w - 0.02, 1.1, 0.012), W.tile, [w / 2, 1.5, 0.006], S); W.tile.map.repeat.set(5.5, 1.6); W.tile.normalMap.repeat.set(5.5, 1.6);
    put(rbox(2.3, 0.58, 0.04, 0.008), W.board, [1.95, 2.36, 0.03], S); put(rbox(2.36, 0.64, 0.03, 0.01), W.walnut, [1.95, 2.36, 0.012], S);
    put(new THREE.BoxGeometry(0.012, 1.06, d - 0.02), W.wainscot, [w - 0.006, 0.53, d / 2], S); put(rbox(0.03, 0.04, d - 0.02, 0.006), W.rail, [w - 0.015, 1.07, d / 2], S);
    for (const x of PLAN.sconces) {
      put(cyl(0.05, 0.05, 0.02, 24), W.brass, [x, 2.0, 0.01], S, { rot: [Math.PI / 2, 0, 0] }); put(cyl(0.008, 0.008, 0.2, 8), W.brass, [x, 2.0, 0.11], S, { rot: [Math.PI / 2, 0, 0] });
      put(sphere(0.09, 32), W.globe, [x, 1.96, 0.24], S);
      S.add(K.spot(LOOK.sconce.color, LOOK.sconce.power, [x, 1.84, 0.26], [x, 0, 0.9], 0.75, 1, 0.06));
    }
    // the sausage counter: fluted walnut, marble top, a glass case full of sausages
    { const c = PLAN.counter, cx0 = c.x + c.w / 2, cz = c.z + c.d / 2;
      put(rbox(c.w, c.h - 0.04, c.d, 0.015), W.walnut, [cx0, (c.h - 0.04) / 2, cz], S);
      const reeds = Math.floor(c.w / 0.045); for (let i = 0; i < reeds; i++) put(cyl(0.02, 0.02, c.h - 0.16, 12), W.walnut, [c.x + 0.03 + i * (c.w - 0.06) / (reeds - 1), (c.h - 0.04) / 2 + 0.02, c.z + c.d + 0.004], S);
      put(rbox(c.w + 0.04, 0.035, c.d + 0.04, 0.008), W.marble, [cx0, c.h - 0.02, cz], S);
      const top = c.h;
      put(new THREE.BoxGeometry(c.w - 0.08, 0.012, c.d - 0.22), W.chrome, [cx0, top + 0.006, cz - 0.05], S);
      for (let t = 0; t < 7; t++) {                                  // ceramic trays, each with one kind of sausage
        const tx = c.x + 0.32 + t * (c.w - 0.6) / 6, tm = SAUS[t % SAUS.length];
        put(rbox(0.5, 0.03, 0.36, 0.01), W.tray, [tx, top + 0.027, cz - 0.04], S);
        for (let k = 0; k < 9; k++) { const sg = put(capsule(0.017 + (t % 3) * 0.003, 0.24, 12), tm, [tx - 0.2 + k * 0.05, top + 0.062, cz - 0.04 + (RNG() - 0.5) * 0.03], S); sg.rotation.set(Math.PI / 2, 0, (RNG() - 0.5) * 0.12); }
        put(new THREE.BoxGeometry(0.07, 0.045, 0.004), W.card, [tx, top + 0.12, cz + 0.12], S, { rot: [-0.3, 0, 0] });
      }
      // the case: sloped front glass, a glass roof, glass ends; open on the clerk's side
      const gh = 0.36, slope = 0.12;
      const front = put(new THREE.BoxGeometry(c.w - 0.04, Math.hypot(gh, slope), 0.008), W.glass, [cx0, top + gh / 2, c.z + c.d - 0.04 - slope / 2], S); front.rotation.x = -Math.atan2(slope, gh);
      put(new THREE.BoxGeometry(c.w - 0.04, 0.008, c.d - 0.42), W.glass, [cx0, top + gh, cz - 0.08], S);
      [c.x + 0.02, c.x + c.w - 0.02].forEach(x => put(new THREE.BoxGeometry(0.008, gh, c.d - 0.12), W.glass, [x, top + gh / 2, cz - 0.02], S));
      put(new THREE.BoxGeometry(c.w - 0.04, 0.012, 0.012), W.brass, [cx0, top + gh, c.z + c.d - 0.16], S);
    }
    // the cashier
    { const c = PLAN.cashier, cx0 = c.x + c.w / 2, cz = c.z + c.d / 2;
      put(rbox(c.w, c.h - 0.04, c.d, 0.015), W.walnut, [cx0, (c.h - 0.04) / 2, cz], S);
      put(rbox(c.w + 0.04, 0.035, c.d + 0.04, 0.008), W.marble, [cx0, c.h - 0.02, cz], S);
      const pos = new THREE.Group(); pos.position.set(cx0 + 0.25, c.h, cz - 0.05); S.add(pos);
      put(cyl(0.07, 0.08, 0.02, 24), W.black, [0, 0.01, 0], pos); put(cyl(0.012, 0.012, 0.16, 10), W.black, [0, 0.09, 0], pos);
      const scr = put(rbox(0.36, 0.25, 0.025, 0.01), W.black, [0, 0.27, 0], pos, { rot: [-0.32, Math.PI, 0] }); put(new THREE.PlaneGeometry(0.33, 0.22), W.screen, [0, 0.27, -0.015], pos, { rot: [0.32, Math.PI, 0] });
      put(rbox(0.08, 0.025, 0.15, 0.008), W.black, [cx0 - 0.25, c.h + 0.012, cz + 0.22], S, { rot: [0, 0.3, 0] });
      for (let i = 0; i < 4; i++) put(rbox(0.22, 0.012, 0.32, 0.003), mat({ color: '#C9A77E', roughness: 0.9 }), [cx0 - 0.45, c.h + 0.006 + i * 0.012, cz - 0.15], S);
      put(lathe([[0, 0], [0.06, 0], [0.065, 0.02], [0.065, 0.16], [0.05, 0.18], [0, 0.18]], 32), W.glass, [cx0 - 0.05, c.h, cz - 0.3], S);
    }
    // the beam
    { const b = PLAN.beam; put(rbox(b.w, H, b.d, 0.012), W.plaster, [b.x + b.w / 2, H / 2, b.z + b.d / 2], S); put(new THREE.BoxGeometry(b.w, 0.02, b.d), W.cap, [b.x + b.w / 2, H - 0.01, b.z + b.d / 2], S); }
    // the beer fridge, against the east wall: black frame, two glass doors, lit shelves of bottles
    { const fr = PLAN.fridge, x0 = fr.x, x1 = fr.x + fr.w, zc = fr.z + fr.d / 2, fh = fr.h;
      const sh = [[x1 - x0, 0.1, fr.d, 0.05], [x1 - x0, 0.22, fr.d, fh - 0.11]];
      sh.forEach(([a, b, c, y]) => put(rbox(a, b, c, 0.01), W.black, [(x0 + x1) / 2, y, zc], S));
      put(new THREE.BoxGeometry(0.04, fh, fr.d), W.black, [x1 - 0.02, fh / 2, zc], S);
      [fr.z + 0.02, fr.z + fr.d - 0.02].forEach(z => put(new THREE.BoxGeometry(fr.w, fh, 0.04), W.black, [(x0 + x1) / 2, fh / 2, z], S));
      put(new THREE.BoxGeometry(0.02, fh - 0.36, fr.d - 0.08), W.fridgeIn, [x1 - 0.05, fh / 2, zc], S);
      put(new THREE.BoxGeometry(0.03, 0.02, fr.d - 0.12), W.led, [x0 + 0.1, fh - 0.24, zc], S);
      const header = K.print(1024, 128, (g, wi, he) => { g.fillStyle = '#121212'; g.fillRect(0, 0, wi, he); g.fillStyle = '#F2E6CF'; g.font = '600 64px Georgia, serif'; g.textAlign = 'center'; if ('letterSpacing' in g) g.letterSpacing = '14px'; g.fillText('BIÈRES', wi / 2, 88); });
      put(new THREE.PlaneGeometry(fr.d * 0.7, 0.13), mat({ map: header, roughness: 0.5, emissive: '#ffffff', emissiveMap: header, emissiveIntensity: 0.25 }), [x0 - 0.002, fh - 0.11, zc], S, { rot: [0, -Math.PI / 2, 0] });
      for (let s = 0; s < 5; s++) {
        const y = 0.12 + s * 0.36; put(new THREE.BoxGeometry(fr.w - 0.12, 0.012, fr.d - 0.1), W.chrome, [(x0 + x1) / 2 - 0.02, y, zc], S);
        const n = 26; for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) bottle(x0 + 0.14 + r * 0.16, y + 0.006, fr.z + 0.1 + i * (fr.d - 0.2) / (n - 1), S, 0.95, (s + i) % 7 === 3);
      }
      // two doors: glass in a thin black frame, a steel handle
      [0, 1].forEach(k => { const zz = fr.z + 0.04 + (k + 0.5) * (fr.d - 0.08) / 2, dw = (fr.d - 0.08) / 2 - 0.01;
        put(new THREE.BoxGeometry(0.01, fh - 0.36, dw), W.glass, [x0 + 0.01, fh / 2 + 0.01, zz], S);
        [zz - dw / 2, zz + dw / 2].forEach(z2 => put(new THREE.BoxGeometry(0.03, fh - 0.36, 0.025), W.black, [x0 + 0.012, fh / 2 + 0.01, z2], S));
        put(rbox(0.025, 0.7, 0.025, 0.008), W.chrome, [x0 - 0.02, fh / 2, zz + (k ? -1 : 1) * (dw / 2 - 0.06)], S); });
      // its light on the floor (a spot: area lights would show as panels in the render)
      S.add(K.spot(LOOK.fridge.color, LOOK.fridge.power, [x0 - 0.25, fh - 0.3, zc], [x0 - 2.2, 0, zc], 0.9, 1, 0.3));
    }
    // the window bench and its tall stools
    { const b = PLAN.bench; put(rbox(b.w, 0.05, b.d, 0.01), W.oak, [b.x + b.w / 2, b.h, b.z + b.d / 2], S);
      for (const x of [b.x + 0.1, b.x + b.w - 0.1]) put(new THREE.BoxGeometry(0.04, b.h, 0.04), W.steel, [x, b.h / 2, b.z + b.d - 0.08], S);
      PLAN.benchStools.forEach(([x, z]) => stool(x, z, S, true));
      put(lathe([[0, 0], [0.06, 0], [0.065, 0.1], [0, 0.1]], 24), W.pot, [b.x + b.w - 0.4, b.h + 0.025, b.z + 0.25], S); }
    plant(...PLAN.plant, S);
    // a tall window in the east wall, by the street: oak frame, mullions, glass
    { const z0 = PLAN.window[0], z1 = PLAN.window[1], y0 = 0.95, y1 = 2.35, x = w - 0.004, zc = (z0 + z1) / 2;
      put(new THREE.BoxGeometry(0.02, y1 - y0, z1 - z0), M.glass({ roughness: 0.02 }), [w + T / 2, (y0 + y1) / 2, zc], S);
      for (const [a, b, c, d2] of [[y0, y0 + 0.05, z0, z1], [y1 - 0.05, y1, z0, z1], [y0, y1, z0, z0 + 0.05], [y0, y1, z1 - 0.05, z1], [y0, y1, zc - 0.02, zc + 0.02], [(y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02, z0, z1]])
        put(new THREE.BoxGeometry(0.06, b - a, d2 - c), W.walnut, [x - 0.01, (a + b) / 2, (c + d2) / 2], S);
      put(new THREE.BoxGeometry(0.2, 0.035, z1 - z0 + 0.1), W.oak, [w - 0.09, y0 - 0.02, zc], S);
      // cut the opening: rebuild the east wall around it
    }
    // a walnut shelf over the cashier: jars, tins, a few bottles
    { const sx0 = PLAN.cashier.x + 0.05, sx1 = PLAN.cashier.x + PLAN.cashier.w - 0.05;
      for (const y of [1.72, 2.12]) { put(rbox(sx1 - sx0, 0.035, 0.24, 0.006), W.walnut, [(sx0 + sx1) / 2, y, 0.13], S);
        let x = sx0 + 0.08; while (x < sx1 - 0.1) { const k = RNG();
          if (k < 0.45) { put(lathe([[0, 0], [0.05, 0], [0.055, 0.02], [0.055, 0.14], [0.04, 0.16], [0, 0.16]], 24), W.glass, [x, y + 0.018, 0.13], S); put(cyl(0.035, 0.035, 0.1, 16), SAUS[(k * 10 | 0) % 5], [x, y + 0.07, 0.13], S); put(cyl(0.042, 0.042, 0.025, 20), W.brass, [x, y + 0.17, 0.13], S); x += 0.15; }
          else if (k < 0.75) { bottle(x, y + 0.018, 0.13, S, 1.15, k > 0.6); x += 0.1; }
          else { put(cyl(0.045, 0.045, 0.12, 24), LABELS[(k * 20 | 0) % LABELS.length], [x, y + 0.078, 0.13], S); x += 0.12; } } } }
    // saucissons hanging from a brass rail over the counter
    { const y = 1.98, x0 = 0.25, x1 = 3.75;
      put(cyl(0.012, 0.012, x1 - x0, 12), W.brass, [(x0 + x1) / 2, y, 0.16], S, { rot: [0, 0, Math.PI / 2] });
      for (let x = x0 + 0.08; x < x1 - 0.05; x += 0.07 + RNG() * 0.05) { if (PLAN.sconces.some(sx => Math.abs(sx - x) < 0.16)) continue;
        const len = 0.22 + RNG() * 0.16, r = 0.02 + RNG() * 0.012; put(cyl(0.002, 0.002, 0.05, 4), W.card, [x, y - 0.03, 0.16], S);
        put(capsule(r, len, 12), SAUS[(RNG() * 5) | 0], [x, y - 0.06 - len / 2 - r, 0.16], S, { rot: [0, 0, (RNG() - 0.5) * 0.06] }); } }
    person(PLAN.clerk[0], PLAN.clerk[1], 180, S);
    // the table: oak top on black steel, square to the room or turned 45°
    { const T0 = new THREE.Group(); T0.position.set(L.table.x, 0, L.table.z); T0.rotation.y = deg(L.table.turn); S.add(T0);
      const tw = 1.19, tl = 2.28; put(rbox(tw, 0.05, tl, 0.012), W.oak, [0, 0.75, 0], T0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => put(new THREE.BoxGeometry(0.045, 0.725, 0.045), W.steel, [a * (tw / 2 - 0.09), 0.3625, b * (tl / 2 - 0.12)], T0));
      [-1, 1].forEach(b => put(new THREE.BoxGeometry(tw - 0.18, 0.04, 0.03), W.steel, [0, 0.7, b * (tl / 2 - 0.12)], T0));
      put(lathe([[0, 0], [0.05, 0], [0.045, 0.14], [0.02, 0.2], [0, 0.2]], 24), W.glass, [0.1, 0.775, -0.3], T0);
      L.stools.forEach(([x, z]) => stool(x, z, S)); }
    // beer where people decide
    if (L.beerAtDoor) {
      const g = new THREE.Group(); g.position.set(0.36, 0, 5.95); S.add(g);
      for (let k = 0; k < 2; k++) { const y = k * 0.3; put(rbox(0.52, 0.28, 0.4, 0.01), W.crate, [0, y + 0.14, 0], g); put(new THREE.BoxGeometry(0.46, 0.2, 0.34), W.soil, [0, y + 0.17, 0], g); }
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) bottle(-0.18 + i * 0.12, 0.6, -0.12 + j * 0.12, g, 0.95, (i + j) % 4 === 0);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) bottle(-0.14 + i * 0.12, 0.3, -0.08 + j * 0.14, g, 0.6);
    }
    L.beerOnCounter.forEach(x => { bottle(x - 0.04, PLAN.counter.h + 0.36, PLAN.counter.z + 0.55, S, 0.92); bottle(x + 0.04, PLAN.counter.h + 0.36, PLAN.counter.z + 0.6, S, 0.92, true); });
    // people
    L.people.forEach(p => person(p.at[0], p.at[1], p.face, S, p.beer));
    // the path people take: dots before, a lit line after
    const pts = L.path.pts.map(([x, z]) => V(x, 0.02, z));
    if (L.path.style === 'glow') {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      put(new THREE.TubeGeometry(curve, 600, 0.032, 12, false), W.glow, [0, 0.015, 0], S);
      const end = curve.getPoint(1), dir = curve.getTangent(1);
      const tip = put(new THREE.ConeGeometry(0.1, 0.24, 24), W.glow, [end.x, 0.05, end.z], S); tip.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    } else {
      const path = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
      const n = Math.floor(path.getLength() / 0.17); for (let i = 0; i <= n; i++) put(cyl(0.05, 0.05, 0.012, 18), W.dot, path.getPointAt(i / n).add(V(0, 0.002, 0)).toArray(), S);
      const end = pts.at(-1), dir = pts.at(-1).clone().sub(pts.at(-2)).normalize();
      const tip = put(new THREE.ConeGeometry(0.09, 0.2, 3), W.dot, [end.x, 0.02, end.z + 0.1], S); tip.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    }
    return S;
  };
  const A = shop(BEFORE, -GAP / 2), B = shop(AFTER, GAP / 2);
  scene.updateMatrixWorld(true);

  // the studio: a seamless sweep, a soft key, a low golden sun, the sky
  K.put(K.sweep({ width: 90, depth: 40, height: 40, radius: 10 }), mat({ color: LOOK.backdrop, roughness: 0.95, emissive: LOOK.backdrop, emissiveIntensity: LOOK.backdropGlow }), [0, -PLAN.slab - 0.01, -14], scene);
  scene.add(K.area(LOOK.key.color, LOOK.key.power, 14, 10, [-10, 16, 12], [0, 0, 0]));
  scene.add(K.sun(LOOK.sun.color, LOOK.sun.power, LOOK.sun.from, [0, 0, 0], 0.45, 0.6));

  // camera: an orthographic three-quarter view, like a scale model
  const camera = K.orthoCam({ target: f.target, azimuth: 0, elevation: 41, viewH: f.viewH, aspect: f.aspect });

  // label anchors (world space)
  const at = (S, x, z, y = 0) => S.localToWorld(V(x, y, z));
  const anchors = {
    hdA: at(A, PLAN.w / 2, -0.4, PLAN.wallH + 0.9), hdB: at(B, PLAN.w / 2, -0.4, PLAN.wallH + 0.9), mid: V(0, 0.6, 0.4),
    lgA: at(A, PLAN.w / 2, PLAN.d / 2), lgB: at(B, PLAN.w / 2, PLAN.d / 2),
    footA: [[0, 0], [PLAN.w, 0], [0, PLAN.d + 0.6], [PLAN.w, PLAN.d + 0.6]].map(([x, z]) => at(A, x, z)),
    footB: [[0, 0], [PLAN.w, 0], [0, PLAN.d + 0.6], [PLAN.w, PLAN.d + 0.6]].map(([x, z]) => at(B, x, z)),
  };
  PINS.before.forEach(([x, z], i) => { anchors['a' + (i + 1)] = at(A, x, z, 0.05); });
  PINS.after.forEach(([x, z], i) => { anchors['b' + (i + 1)] = at(B, x, z, 0.05); });
  return { scene, camera, anchors };
}
