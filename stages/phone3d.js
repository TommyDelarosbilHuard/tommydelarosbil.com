/* The NexGen phone, for every case: the same three.js body, materials, studio light and spring as the cover.
   The screen stays live HTML: it is projected onto the phone's glass with the camera's own matrices
   (the CSS3DRenderer technique), so taps, scrolling and annotations work on a real 3D phone.
   glPhone(api, { ui, back, place, pose, rim }) → { ui, ready } */
import { el, $, clamp, smooth, reduce, TAU } from './core.js';

const THREE_URL = new URL('../vendor/three.module.min.js', import.meta.url).href;   // three@0.160.0, served with the site (2026-10-19)
let threeP = null;
const three = () => threeP || (threeP = import(THREE_URL));
/* Load smoothness (2026-10-18): every WebGL phone on the page builds through one queue (shared with nx-stage.js),
   one at a time, yielding to the browser between steps, so no build lands as one long task under an animation. */
const idle = () => new Promise(r => window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 200 }) : setTimeout(r, 16));
const glQueue = fn => { const q = (window.__glQueue || Promise.resolve()).then(fn); window.__glQueue = q.catch(() => {}); return q; };

// the cover's proportions; the screen is iPhone 390 × 844 points
const BODY_H = 3.0, SCREEN_ASPECT = 390 / 844, BEZEL = 0.058;
const SCREEN_H = BODY_H - 2 * BEZEL, SCREEN_W = SCREEN_H * SCREEN_ASPECT;
const BODY_W = SCREEN_W + 2 * BEZEL, DEPTH = 0.165, RADIUS = BODY_W * 0.165, BEV = 0.044, SCREEN_R = RADIUS - BEZEL * 0.85;
const FOV = 26, TAN = Math.tan((FOV / 2) * Math.PI / 180), BODY_RATIO = BODY_W / BODY_H;
export const UI_W = 390, UI_H = 844, PX = SCREEN_W / UI_W;     // world units per CSS pixel on the glass
const n6 = v => (Math.abs(v) < 1e-10 ? 0 : +v.toFixed(8));
const camCSS = e => `matrix3d(${n6(e[0])},${n6(-e[1])},${n6(e[2])},${n6(e[3])},${n6(e[4])},${n6(-e[5])},${n6(e[6])},${n6(e[7])},${n6(e[8])},${n6(-e[9])},${n6(e[10])},${n6(e[11])},${n6(e[12])},${n6(-e[13])},${n6(e[14])},${n6(e[15])})`;
const objCSS = e => `translate(-50%,-50%) matrix3d(${n6(e[0])},${n6(e[1])},${n6(e[2])},${n6(e[3])},${n6(-e[4])},${n6(-e[5])},${n6(-e[6])},${n6(-e[7])},${n6(e[8])},${n6(e[9])},${n6(e[10])},${n6(e[11])},${n6(e[12])},${n6(e[13])},${n6(e[14])},${n6(e[15])})`;

function geometry(THREE) {
  const rrShape = (w, h, r, step = 0) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    const line = (x1, y1) => { const x0 = s.currentPoint.x, y0 = s.currentPoint.y, n = step > 0 ? Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)) : 1;
      for (let i = 1; i <= n; i++) s.lineTo(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); };
    s.moveTo(x + w / 2, y);
    line(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    line(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    line(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    line(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    line(x + w / 2, y);
    return s;
  };
  const flatPanel = (w, h, r, segs = 40) => {
    const g = new THREE.ShapeGeometry(rrShape(w, h, r), segs), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
    return g;
  };
  const slab = (w, h, r, depth, bev, curveSegs = 28, bevelSegs = 8) => {
    const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * bev, h - 2 * bev, Math.max(0.001, r - bev), Math.max(0.01, Math.min(w, h) / 24)), {
      depth: Math.max(0.0001, depth - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: bevelSegs, curveSegments: curveSegs });
    g.translate(0, 0, -(depth - 2 * bev) / 2);
    const p = g.attributes.position, map = new Map(), pos = [], idx = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
      let j = map.get(k); if (j === undefined) { j = pos.length / 3; pos.push(x, y, z); map.set(k, j); } idx.push(j);
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setIndex(idx);
    for (const gr of g.groups) out.addGroup(gr.start, gr.count, gr.materialIndex);
    out.computeVertexNormals(); g.dispose();
    return out;
  };
  const studio = (neutral = false, rim = 0xff5a24) => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x050505);
    s.add(new THREE.Mesh(new THREE.BoxGeometry(16, 11, 16), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide })));
    const panel = (w, h, rgb, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
    panel(7, 2.2, neutral ? [3.2, 3.2, 3.2] : [3.2, 3.1, 3.0], [0, 5, 1.6]); panel(0.7, 7, neutral ? [5.2, 5.2, 5.2] : [5.2, 5.1, 5.0], [-5.6, 0.4, 2.2]);
    panel(0.7, 6, neutral ? new THREE.Color(rim).multiplyScalar(5).toArray() : [6.4, 1.55, 0.42], [5.3, 0.2, -3.6]); panel(0.45, 5, neutral ? [2.3, 2.3, 2.3] : [2.3, 2.3, 2.4], [4.9, 0.6, 3.6]); panel(5, 3, neutral ? [0.45, 0.45, 0.45] : [0.45, 0.45, 0.47], [0, 0.4, 6.6]);
    return s;
  };
  return { flatPanel, slab, studio };
}

// a phone is built when its stage comes within ~a screen of view (the page scrolls inside .frame), then waits its turn
const near = host => new Promise(r => {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); r(); } },
    { root: host.closest('.frame'), rootMargin: '600px 0px' });
  io.observe(host);
});
export async function glPhone(api, opts) { await near(api.host); return glQueue(() => buildPhone(api, opts)); }

async function buildPhone(api, { ui = '', back = null, place = () => ({ h: 0.86 }), pose = { yaw: -0.36, pitch: -0.05, roll: -0.025 }, rim = 0xff5a24, lean = 0.16, neutralLighting = false } = {}) {
  const { world, S } = api;
  const R = Math.round(SCREEN_R / PX);
  const wrap = el(`<div class="g3"><canvas class="g3-gl" aria-hidden="true"></canvas><div class="g3-css"><div class="g3-cam"><div class="g3-scr" style="border-radius:${R}px"><div class="p3-ui g3-ui">${ui}</div><i class="g3-glare"></i></div></div></div></div>`);
  world.appendChild(wrap);
  const canvas = $(wrap, '.g3-gl'), cssRoot = $(wrap, '.g3-css'), cam = $(wrap, '.g3-cam'), scr = $(wrap, '.g3-scr'), uiEl = $(wrap, '.p3-ui');

  let THREE;
  try { THREE = await three(); } catch (e) { wrap.classList.add('flat'); return { ui: uiEl, flat: true }; }
  await idle();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { wrap.classList.add('flat'); return { ui: uiEl, flat: true }; }
  renderer.debug.checkShaderErrors = false;   // the check reads shader logs back from the GPU: a stall per program
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const { flatPanel, slab, studio } = geometry(THREE);

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studio(neutralLighting, rim), 0.03).texture;
  await idle();
  scene.add(new THREE.AmbientLight(0xffffff, 0.06));
  const key = new THREE.DirectionalLight(neutralLighting ? 0xffffff : 0xfff3e8, 1.25); key.position.set(-3, 4, 5); scene.add(key);
  const rimL = new THREE.DirectionalLight(rim, 2.6); rimL.position.set(4, 1.5, -4); scene.add(rimL);
  const frameMat = new THREE.MeshPhysicalMaterial({ color: neutralLighting ? 0x484848 : 0x4a4844, metalness: 1, roughness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 1.15 });
  const darkMetal = new THREE.MeshPhysicalMaterial({ color: neutralLighting ? 0x2b2b2b : 0x2c2b29, metalness: 1, roughness: 0.24, envMapIntensity: 1.1 });
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x040404, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.85 });

  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  const body = new THREE.Mesh(slab(BODY_W, BODY_H, RADIUS, DEPTH, BEV, 40, 10), [blackGlass, frameMat]); phone.add(body);
  const glass = new THREE.Mesh(flatPanel(SCREEN_W, SCREEN_H, SCREEN_R, 48), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  glass.position.z = DEPTH / 2 + 0.0012; phone.add(glass);
  const btn = { s: slab(0.07, 0.13, 0.035, 0.024, 0.008, 16, 4), m: slab(0.07, 0.27, 0.035, 0.024, 0.008, 16, 4), l: slab(0.07, 0.42, 0.035, 0.024, 0.008, 16, 4) };
  [['s', 0.96, -1], ['m', 0.63, -1], ['m', 0.28, -1], ['l', 0.55, 1]].forEach(([k, y, side]) => { const m = new THREE.Mesh(btn[k], frameMat); m.rotation.y = Math.PI / 2; m.position.set(side * (BODY_W / 2 - 0.001), y, 0); phone.add(m); });
  // the back: the case's own print, the cover's camera plateau
  await idle();
  const backG = new THREE.Group(); backG.rotation.y = Math.PI; backG.position.z = -DEPTH / 2;
  const cw = 1024, ch = Math.round(cw * BODY_H / BODY_W), c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'); g.fillStyle = '#1f2023'; g.fillRect(0, 0, cw, ch); back && back(g, cw, ch);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
  const backPanel = new THREE.Mesh(flatPanel(BODY_W - 2 * BEV + 0.012, BODY_H - 2 * BEV + 0.012, RADIUS - BEV + 0.006, 48), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.46, clearcoat: 0.55, clearcoatRoughness: 0.32, envMapIntensity: 0.9 }));
  backPanel.position.z = 0.0012; backG.add(backPanel);
  const MW = BODY_W * 0.44, MT = 0.042, mx = -(BODY_W / 2 - 0.085 - MW / 2), my = BODY_H / 2 - 0.085 - MW / 2;
  const plateau = new THREE.Mesh(slab(MW, MW, 0.16, MT, 0.012, 24, 5), new THREE.MeshPhysicalMaterial({ color: 0x2a2b2e, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }));
  plateau.position.set(mx, my, MT / 2 + 0.001); backG.add(plateau);
  const lensAt = (lx, ly) => {
    const gg = new THREE.Group(); gg.position.set(mx + lx, my + ly, MT);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.046, 56), darkMetal); ring.rotation.x = Math.PI / 2; ring.position.z = 0.023; gg.add(ring);
    const gl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.048, 56), blackGlass); gl2.rotation.x = Math.PI / 2; gl2.position.z = 0.024; gg.add(gl2);
    const coat = new THREE.Mesh(new THREE.CircleGeometry(0.058, 48), new THREE.MeshPhysicalMaterial({ color: 0x0a0c14, metalness: 0.3, roughness: 0.05, iridescence: neutralLighting ? 0 : 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [280, 820], envMapIntensity: 1.4 }));
    coat.position.z = 0.0486; gg.add(coat); backG.add(gg);
  };
  lensAt(-0.14, 0.14); lensAt(-0.14, -0.14); lensAt(0.15, 0);
  phone.add(backG);
  const anchor = new THREE.Object3D(); anchor.position.z = DEPTH / 2 + 0.0024; anchor.scale.set(PX, PX, PX); phone.add(anchor);
  const rig = new THREE.Group(); rig.add(phone); scene.add(rig);
  // the phone's outline on screen (normalised device coordinates): its body projected through the camera
  const bodyPts = [], bp = body.geometry.attributes.position, v3 = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) bodyPts.push(new THREE.Vector3(bp.getX(i), bp.getY(i), bp.getZ(i)));
  const outline = () => { rig.updateMatrixWorld(true); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const q of bodyPts) { v3.copy(q).applyMatrix4(phone.matrixWorld).project(camera); x0 = Math.min(x0, v3.x); x1 = Math.max(x1, v3.x); y0 = Math.min(y0, v3.y); y1 = Math.max(y1, v3.y); }
    return { x0, x1, y0, y1 }; };
  // is a point of the page on the phone? (its body, buttons and glass, as drawn this frame)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  api.hitPhone = (cx, cy) => { const r = canvas.getBoundingClientRect(); if (!r.width) return false;
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    return ray.intersectObject(phone, true).length > 0; };
  // warm up before the first visible frame: shaders compile in parallel, the back print uploads now
  await idle();
  renderer.initTexture(tex);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);

  /* layout: the case says how big and where; the camera keeps the phone that size */
  const L = { px: 400, dist: 12, cx: 0.5, cy: 0.5, ox: 0, oy: 0 };
  /* a turned phone seen in perspective is not centred on its own middle: at rest (the case's pose, no float or lean)
     the rig moves until the outline's centre is where the case asked for it, (cx, cy) of the block (2026-10-20) */
  const rest = () => { phone.rotation.set(pose.pitch, pose.yaw, pose.roll); rig.position.set(0, 0, 0); };
  const centre = () => {
    const visH = 2 * L.dist * TAN, visW = visH * (S.W / S.H);
    rest(); L.ox = (L.cx - 0.5) * visW; L.oy = (0.5 - L.cy) * visH;
    for (let i = 0; i < 3; i++) {
      rig.position.set(L.ox, L.oy, 0); const o = outline();
      L.ox += ((2 * L.cx - 1) - (o.x0 + o.x1) / 2) / 2 * visW; L.oy += ((1 - 2 * L.cy) - (o.y0 + o.y1) / 2) / 2 * visH;
    }
  };
  const layout = () => {
    const p = place(S) || {}, h = p.h ?? 0.86, maxW = p.maxW ?? 0.9;
    L.px = Math.min(S.H * h, (S.W * maxW) / BODY_RATIO); L.cx = p.cx ?? 0.5; L.cy = p.cy ?? 0.5;
    L.dist = (BODY_H / (L.px / S.H)) / (2 * TAN);
    camera.aspect = S.W / S.H; camera.position.set(0, 0, L.dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    renderer.setSize(S.W, S.H, false);
    cam.style.width = S.W + 'px'; cam.style.height = S.H + 'px';
    camera.updateMatrixWorld(); centre();
  };
  api.resize(layout);

  /* the cover's spring: drag anywhere to turn, lean to the pointer, come back */
  const st = { yaw: pose.yaw, pitch: pose.pitch, vy: 0, vp: 0, drag: false, rel: -1e9, intro: null };
  const STIFF = 24, DAMP = 8.4;
  api.turner = {
    grab(on) { st.drag = on; if (!on) { st.rel = S.t; st.vy = clamp(st.vy, -14, 14); st.vp = clamp(st.vp, -8, 8); } else { st.vy = 0; st.vp = 0; } },
    drag(dx, dy) { const k = 3.4 / Math.max(260, L.px); st.yaw += dx * k * 1.4; st.pitch = clamp(st.pitch + dy * k, -1.0, 1.0); st.vy = st.vy * 0.4 + dx * k * 1.4 * 36; st.vp = st.vp * 0.4 + dy * k * 36; },
    kick(dir) { st.vy += dir * 4.2; st.rel = S.t; },
  };
  api.frame((dt, t) => {
    if (!st.drag) {
      const k = smooth(1.4, 2.5, t - st.rel);
      const ty0 = pose.yaw + (reduce ? 0 : S.shx * lean), ty = ty0 + TAU * Math.round((st.yaw - ty0) / TAU), tp = pose.pitch + (reduce ? 0 : S.shy * lean * 0.6);
      st.vy += (k * (STIFF * (ty - st.yaw) - DAMP * st.vy) - (1 - k) * 1.9 * st.vy) * dt;
      st.vp += (k * (STIFF * (tp - st.pitch) - DAMP * st.vp) - (1 - k) * 2.6 * st.vp) * dt;
      st.yaw += st.vy * dt; st.pitch = clamp(st.pitch + st.vp * dt, -1.0, 1.0);
    }
    if (st.intro === null && world.classList.contains('in')) st.intro = t;
    const p = st.intro === null ? 0 : reduce ? 1 : clamp((t - st.intro) / 2.2, 0, 1);
    const turn = Math.PI * Math.pow(1 - p, 4), rise = -BODY_H * 1.2 * Math.pow(1 - p, 3);
    const visH = 2 * L.dist * TAN, visW = visH * (S.W / S.H), fl = reduce ? 0 : Math.sin(t * 0.9) * 0.035;
    rig.position.set(L.ox, L.oy + fl + rise, 0);
    const yaw = st.yaw + turn;
    phone.rotation.set(st.pitch, yaw, pose.roll + (reduce ? 0 : Math.sin(t * 0.55) * 0.018));
    rimL.position.set(4 + S.shx * 2.2, 1.5 - S.shy * 1.2, -4);
    renderer.render(scene, camera);
    // the live screen rides the glass
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    const fov = camera.projectionMatrix.elements[5] * S.H / 2;
    cssRoot.style.perspective = fov + 'px';
    // work in CSS pixels (K = px per world unit) so the screen renders at its own size: crisp text
    const K = 1 / PX, ci = camera.matrixWorldInverse.elements.slice(); ci[12] *= K; ci[13] *= K; ci[14] *= K;
    const ow = anchor.matrixWorld.elements.map((v, i) => (i === 15 ? v : v * K));
    cam.style.transform = `translateZ(${fov}px) ${camCSS(ci)} translate(${S.W / 2}px, ${S.H / 2}px)`;
    scr.style.transform = objCSS(ow);
    scr.style.setProperty('--gl', (50 + Math.sin(yaw) * 70).toFixed(1) + '%');
    if (!wrap.classList.contains('live')) wrap.classList.add('live');
  });
  layout();
  return { ui: uiEl, phone, st };
}
