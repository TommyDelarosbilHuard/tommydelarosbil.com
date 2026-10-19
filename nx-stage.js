/* NexGen cover stage: the presentation cover, rebuilt as the landing's first piece of work.
   A 3D phone playing the prototype's first visit, the split Nex | Gen wordmark, and the dither field.
   It answers the reader: drag the phone to turn it (it springs back), it leans toward the pointer,
   the pointer uncovers signal in the noise, scrolling away pulls the wordmark apart.
   A drag that starts on the phone turns it; a click anywhere else in the block opens the case.
   Mobile: no text, the phone fills ~90% of the box.

   One stage for the whole session: route() re-renders the page, attach() moves the same node into
   the new host, so there is one WebGL context and no reloading. It renders only while on screen.
   Ported from NexGen News/presentation (geometry, materials, spring), trimmed to the cover. */

const THREE_URL = new URL('vendor/three.module.min.js', import.meta.url).href;   // three@0.160.0, served with the site (2026-10-19)
const FONT_URL = 'fonts/stage-fonts.css';   // self-hosted (2026-10-19)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/* Load smoothness (2026-10-18): every WebGL phone on the page builds through one queue (shared with stages/phone3d.js),
   one at a time, yielding to the browser between steps, so no build lands as one long task under an animation. */
const idle = () => new Promise(r => window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 200 }) : setTimeout(r, 16));
const frames = n => new Promise(r => { const f = () => (--n > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
const glQueue = fn => { const q = (window.__glQueue || Promise.resolve()).then(fn); window.__glQueue = q.catch(() => {}); return q; };

/* ---------- the world (built once) ---------- */
const world = document.createElement('div');
world.className = 'nxs-world';
world.innerHTML = `
  <canvas class="nxs-field" aria-hidden="true"></canvas>
  <div class="nxs-light" aria-hidden="true"></div>
  <div class="nxs-mark" aria-hidden="true"><span class="w nex"><span class="in">Nex</span></span><span class="w gen"><span class="in">Gen</span></span></div>
  <canvas class="nxs-gl" aria-hidden="true"></canvas>
  <video class="nxs-film" src="nx/first-visit.mp4" poster="nx/cover-poster.jpg" muted loop playsinline preload="metadata" aria-hidden="true"></video>
  <div class="nxs-grain" aria-hidden="true"></div>`;
const field = world.querySelector('.nxs-field'), fctx = field.getContext('2d');
const mark = world.querySelector('.nxs-mark'), glCanvas = world.querySelector('.nxs-gl');
const film = world.querySelector('.nxs-film');
film.muted = true;

if (!document.getElementById('nxs-font')) {
  const l = document.createElement('link'); l.id = 'nxs-font'; l.rel = 'stylesheet'; l.href = FONT_URL; document.head.appendChild(l);
}

/* state shared by layout, input and the frame loop */
const S = { W: 1, H: 1, mobile: false, words: true, visible: false, px: -9, py: -9, hx: 0, hy: 0, shx: 0, shy: 0, inside: false, out: 0 };
const L = { phonePx: 400, dist: 12, cx: 0.5, cy: 0.5 };
let host = null, link = null, ro = null, io = null, gl = null, intro = null, booted = false;

/* ---------- dither field: value noise, 4×4 Bayer; the pointer uncovers signal ---------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const PERM = new Uint8Array(512), VALS = new Float32Array(256);
{ let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) VALS[i] = rnd(); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), X = xi & 255, Y = yi & 255;
  const a = VALS[PERM[X + PERM[Y]]], b = VALS[PERM[X + 1 + PERM[Y]]], c = VALS[PERM[X + PERM[Y + 1]]], d = VALS[PERM[X + 1 + PERM[Y + 1]]];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
let fw = 0, fh = 0, fimg = null, cell = 5, lens = 0;
function sizeField() {
  cell = S.mobile ? 4 : 5;
  fw = Math.max(1, Math.ceil(S.W / cell)); fh = Math.max(1, Math.ceil(S.H / cell));
  field.width = fw; field.height = fh; fimg = fctx.createImageData(fw, fh);
}
function drawField(time, yaw, pitch) {
  if (!fimg) return;
  const d = fimg.data; d.fill(0);
  const sc = 1 / (S.mobile ? 20 : 26), aspect = fw / fh;
  const ox = time * 0.018 + yaw * 1.1, oy = time * 0.009 + pitch * 0.8 + S.out * 1.2;
  const lx = S.px / cell, ly = S.py / cell, R = Math.max(10, Math.min(fw, fh) * 0.26), R2 = R * R;
  for (let y = 0; y < fh; y++) {
    const ny = y * sc + oy, dy = y / fh - L.cy, ly2 = (y - ly) * (y - ly);
    for (let x = 0; x < fw; x++) {
      const nx = x * sc + ox;
      const n = 0.66 * vnoise(nx, ny) + 0.34 * vnoise(nx * 2.13 + 5.2, ny * 2.13 - 3.1);
      const q2 = (x - lx) * (x - lx) + ly2, q = lens > 0.01 && q2 < R2 ? lens * Math.pow(1 - Math.sqrt(q2) / R, 1.6) : 0;
      let dens = (n - 0.56 + q * 0.2) / 0.3;
      if (dens <= 0) continue;
      const dx = (x / fw - L.cx) * aspect, r = Math.sqrt(dx * dx + dy * dy), m = clamp((r - 0.16) / 0.5, 0, 1);
      dens = Math.min(1, dens) * (0.12 + 0.68 * m * m * (3 - 2 * m) + q * 0.55);
      if (dens <= BAYER[((y & 3) << 2) | (x & 3)]) continue;
      const i = (y * fw + x) << 2, h = PERM[(x & 255) + PERM[y & 255]];
      // signal: rare in the noise, common under the pointer
      if ((n > 0.8 && h < 22) || (q > 0.08 && n > 0.6 && h < 14 + q * 60)) { d[i] = 255; d[i + 1] = 79; d[i + 2] = 31; d[i + 3] = 120 + q * 135; }
      else { d[i] = 238; d[i + 1] = 234; d[i + 2] = 225; d[i + 3] = 12 + dens * 30 + q * 40; }
    }
  }
  fctx.putImageData(fimg, 0, 0);
}

/* ---------- wordmark ---------- */
const ratio = { nex: 1.9, gen: 1.95 };
function measureWords() {
  const p = document.createElement('span');
  p.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:500 100px/1 'Space Grotesk','Helvetica Neue',Arial,sans-serif;letter-spacing:-0.065em";
  document.body.appendChild(p);
  p.textContent = 'Nex'; ratio.nex = p.getBoundingClientRect().width / 100;
  p.textContent = 'Gen'; ratio.gen = p.getBoundingClientRect().width / 100;
  p.remove();
}

/* ---------- phone (same proportions as the presentation) ---------- */
const BODY_H = 3.0, SCREEN_ASPECT = 600 / 1298, BEZEL = 0.058;
const SCREEN_H = BODY_H - 2 * BEZEL, SCREEN_W = SCREEN_H * SCREEN_ASPECT;
const BODY_W = SCREEN_W + 2 * BEZEL, DEPTH = 0.165, RADIUS = BODY_W * 0.165, BEV = 0.044, SCREEN_R = RADIUS - BEZEL * 0.85;
const FOV = 26, TAN = Math.tan((FOV / 2) * Math.PI / 180), BODY_RATIO = BODY_W / BODY_H;
const POSE = { yaw: -0.4, pitch: -0.07, roll: -0.035 };

// Some styles lay the case title over the featured work. Find that text, and compose the phone in
// the free part of the box: right of the text, or above it. The style's type then carries the words.
function freeRegion() {
  const feat = host.closest('.feat'); if (!feat) return null;
  const hr = host.getBoundingClientRect();
  let top = Infinity, right = -Infinity, any = false;
  feat.querySelectorAll('.row-meta > *').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const ix = Math.min(r.right, hr.right) - Math.max(r.left, hr.left), iy = Math.min(r.bottom, hr.bottom) - Math.max(r.top, hr.top);
    if (ix > 4 && iy > 4) { any = true; top = Math.min(top, r.top - hr.top); right = Math.max(right, r.right - hr.left); }
  });
  if (!any) return null;
  const pad = Math.max(16, S.W * 0.03);
  if (right < S.W * 0.62) return { x0: right + pad, x1: S.W - pad, y0: pad, y1: S.H - pad };
  if (top > S.H * 0.38) return { x0: pad, x1: S.W - pad, y0: pad * 1.5, y1: top - pad };
  return { x0: right < S.W * 0.8 ? right + pad : S.W * 0.55, x1: S.W - pad, y0: pad, y1: S.H - pad };
}
let compose = '';
function layout() {
  if (!host) return;
  S.W = Math.max(1, host.clientWidth); S.H = Math.max(1, host.clientHeight);
  S.mobile = S.W < 600 || S.W / S.H < 0.95;
  const free = freeRegion();
  compose = free ? [free.x0, free.x1, free.y0, free.y1].map(Math.round).join() : '';
  L.cx = 0.5; L.cy = 0.5;
  if (free) {
    L.cx = (free.x0 + free.x1) / 2 / S.W; L.cy = (free.y0 + free.y1) / 2 / S.H;
    L.phonePx = Math.min((free.y1 - free.y0) * 0.9, ((free.x1 - free.x0) * 0.86) / BODY_RATIO);
    S.words = false;
  } else if (S.mobile) {
    // the phone takes ~83% of the box (8% under the original 90%, 2026-10-17); no text
    L.phonePx = Math.min(S.H * 0.828, (S.W * 0.828) / BODY_RATIO);
    S.words = false;
  } else {
    L.phonePx = Math.min(S.H * 0.8, (S.W * 0.34) / BODY_RATIO);
    const gutter = Math.max(16, S.W * 0.034), gap = L.phonePx * BODY_RATIO * 1.34;
    const size = Math.min((S.W - gap - 2 * gutter) / 2 / Math.max(ratio.nex, ratio.gen), S.H * 0.34);
    S.words = size > S.H * 0.12;
    mark.style.setProperty('--size', size.toFixed(1) + 'px');
    mark.style.setProperty('--gap', gap.toFixed(1) + 'px');
    mark.style.setProperty('--gutter', gutter.toFixed(1) + 'px');
  }
  world.classList.toggle('no-words', !S.words);
  world.style.setProperty('--pcx', (L.cx * 100).toFixed(1) + '%');
  world.style.setProperty('--pcy', (L.cy * 100).toFixed(1) + '%');
  sizeField();
  if (gl) {
    L.dist = (BODY_H / (L.phonePx / S.H)) / (2 * TAN);
    gl.camera.aspect = S.W / S.H; gl.camera.position.set(0, 0, L.dist); gl.camera.lookAt(0, 0, 0); gl.camera.updateProjectionMatrix();
    gl.renderer.setSize(S.W, S.H, false);
  }
  drawField(performance.now() / 1000, POSE.yaw, POSE.pitch);
}

/* ---------- three.js scene ---------- */
async function buildGL() {
  let THREE;
  try { THREE = await import(THREE_URL); } catch (e) { return null; }
  await idle();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.debug.checkShaderErrors = false;   // the check reads shader logs back from the GPU: a stall per program
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);
  const aniso = renderer.capabilities.getMaxAnisotropy();

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
  const studio = () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x050505);
    s.add(new THREE.Mesh(new THREE.BoxGeometry(16, 11, 16), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.BackSide })));
    const panel = (w, h, rgb, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m); };
    panel(7, 2.2, [3.2, 3.1, 3.0], [0, 5, 1.6]); panel(0.7, 7, [5.2, 5.1, 5.0], [-5.6, 0.4, 2.2]);
    panel(0.7, 6, [6.4, 1.55, 0.42], [5.3, 0.2, -3.6]); panel(0.45, 5, [2.3, 2.3, 2.4], [4.9, 0.6, 3.6]); panel(5, 3, [0.45, 0.45, 0.47], [0, 0.4, 6.6]);
    return s;
  };
  const backTexture = () => {
    const cw = 1024, ch = Math.round(cw * BODY_H / BODY_W), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true }), grad = g.createLinearGradient(0, 0, cw * 0.3, ch);   // CPU canvas: no GPU readback
    grad.addColorStop(0, '#E84B1F'); grad.addColorStop(1, '#D53F17'); g.fillStyle = grad; g.fillRect(0, 0, cw, ch);
    const img = g.getImageData(0, 0, cw, ch), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
    const cx = cw / 2, cy = ch * 0.5, step = 13, blobs = [[cx - 62, cy, 92], [cx + 70, cy - 8, 104]];
    for (let y = cy - 240; y < cy + 240; y += step) for (let x = cx - 300; x < cx + 300; x += step) {
      let f = 0; for (const [bx, by, br] of blobs) f += (br * br) / ((x - bx) ** 2 + (y - by) ** 2 + 1);
      const v = clamp((f - 0.55) / 0.75, 0, 1), bi = (((y / step) & 3) << 2) | ((x / step) & 3);
      if (v > BAYER[bi]) { g.fillStyle = '#100F0E'; g.fillRect(Math.round(x), Math.round(y), step - 2, step - 2); }
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
    return tex;
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studio(), 0.03).texture;
  await idle();
  scene.add(new THREE.AmbientLight(0xffffff, 0.06));
  const key = new THREE.DirectionalLight(0xfff3e8, 1.25); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff5a24, 2.6); rim.position.set(4, 1.5, -4); scene.add(rim);

  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x4a4844, metalness: 1, roughness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.3, envMapIntensity: 1.15 });
  const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x2c2b29, metalness: 1, roughness: 0.24, envMapIntensity: 1.1 });
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x040404, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.85 });
  const islandMat = new THREE.MeshPhysicalMaterial({ color: 0x010101, roughness: 0.22, clearcoat: 1 });

  // the screen: poster first, the film once it has a real frame; shown pixel for pixel
  const crisp = t => { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = aniso; return t; };
  const vtex = crisp(new THREE.VideoTexture(film));
  const screenMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: null }, uBright: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform sampler2D t; uniform float uBright; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb * uBright, 1.0); }',
    toneMapped: false });
  const poster = new Promise(done => new THREE.TextureLoader().load('nx/cover-poster.jpg',
    t => { crisp(t); renderer.initTexture(t); if (!filmLive) screenMat.uniforms.t.value = t; done(); }, undefined, done));

  const phone = new THREE.Group(); phone.rotation.order = 'YXZ';
  phone.add(new THREE.Mesh(slab(BODY_W, BODY_H, RADIUS, DEPTH, BEV, 40, 10), [blackGlass, frameMat]));
  const screen = new THREE.Mesh(flatPanel(SCREEN_W, SCREEN_H, SCREEN_R, 48), screenMat); screen.position.z = DEPTH / 2 + 0.0012; phone.add(screen);
  const islandW = SCREEN_W * 0.32, islandH = SCREEN_H * 0.0434;
  const island = new THREE.Mesh(flatPanel(islandW, islandH, islandH / 2, 24), islandMat); island.position.set(0, SCREEN_H / 2 - SCREEN_H * 0.0346, DEPTH / 2 + 0.0022); phone.add(island);
  const btn = { s: slab(0.07, 0.13, 0.035, 0.024, 0.008, 16, 4), m: slab(0.07, 0.27, 0.035, 0.024, 0.008, 16, 4), l: slab(0.07, 0.42, 0.035, 0.024, 0.008, 16, 4) };
  [['s', 0.96, -1], ['m', 0.63, -1], ['m', 0.28, -1], ['l', 0.55, 1]].forEach(([k, y, side]) => {
    const m = new THREE.Mesh(btn[k], frameMat); m.rotation.y = Math.PI / 2; m.position.set(side * (BODY_W / 2 - 0.001), y, 0); phone.add(m);
  });
  // the back: signal orange, dithered blobs, the camera plateau
  const back = new THREE.Group(); back.rotation.y = Math.PI; back.position.z = -DEPTH / 2;
  await idle();
  const backTex = backTexture();
  const backPanel = new THREE.Mesh(flatPanel(BODY_W - 2 * BEV + 0.012, BODY_H - 2 * BEV + 0.012, RADIUS - BEV + 0.006, 48),
    new THREE.MeshPhysicalMaterial({ map: backTex, roughness: 0.46, clearcoat: 0.55, clearcoatRoughness: 0.32, envMapIntensity: 0.9 }));
  backPanel.position.z = 0.0012; back.add(backPanel);
  const MW = BODY_W * 0.44, MT = 0.042;
  const plateau = new THREE.Mesh(slab(MW, MW, 0.16, MT, 0.012, 24, 5), new THREE.MeshPhysicalMaterial({ color: 0xD8461D, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }));
  const mx = -(BODY_W / 2 - 0.085 - MW / 2), my = BODY_H / 2 - 0.085 - MW / 2;
  plateau.position.set(mx, my, MT / 2 + 0.001); back.add(plateau);
  const lensAt = (lx, ly) => {
    const g = new THREE.Group(); g.position.set(mx + lx, my + ly, MT);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.046, 56), darkMetal); ring.rotation.x = Math.PI / 2; ring.position.z = 0.023; g.add(ring);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.048, 56), blackGlass); glass.rotation.x = Math.PI / 2; glass.position.z = 0.024; g.add(glass);
    const coat = new THREE.Mesh(new THREE.CircleGeometry(0.058, 48), new THREE.MeshPhysicalMaterial({ color: 0x0a0c14, metalness: 0.3, roughness: 0.05, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [280, 820], envMapIntensity: 1.4 }));
    coat.position.z = 0.0486; g.add(coat); back.add(g);
  };
  lensAt(-0.14, 0.14); lensAt(-0.14, -0.14); lensAt(0.15, 0);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.036, 32), new THREE.MeshStandardMaterial({ color: 0xf1e7d0, emissive: 0x2a2216, roughness: 0.4 }));
  flash.position.set(mx + 0.15, my + 0.175, MT + 0.0008); back.add(flash);
  phone.add(back);
  const rig = new THREE.Group(); rig.add(phone); scene.add(rig);

  // warm up before the first visible frame: shaders compile in parallel, the back print uploads now
  await idle();
  renderer.initTexture(backTex);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
  await Promise.race([poster, new Promise(r => setTimeout(r, 1500))]);   // the poster's upload lands before the intro, not in it
  return { THREE, renderer, scene, camera, phone, rig, rim, screenMat, vtex };
}

/* ---------- motion: the presentation's spring, plus the cover's answers to input ---------- */
const st = { yaw: POSE.yaw, pitch: POSE.pitch, vy: 0, vp: 0, dragging: false, released: -1e9, moved: false };
const STIFF = 24, DAMP = 8.4;
let screenOn = 0, filmLive = false, prev = 0, fieldClock = 0, words = 0;

const local = e => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
let lastX = 0, lastY = 0, lastT = 0, downX = 0, downY = 0, pid = null;
// The phone is the handle: a drag that starts on it turns it. A click anywhere else in the block opens the case
// (2026-10-17). preventDefault keeps the browser from dragging the block or selecting text.
let ray = null;
const onPhone = e => {
  if (!gl) return !!(e.target.closest && e.target.closest('.nxs-film'));          // no WebGL: the film in a CSS phone
  const r = glCanvas.getBoundingClientRect(); if (!r.width) return false;
  ray = ray || new gl.THREE.Raycaster();
  ray.setFromCamera(new gl.THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), gl.camera);
  return ray.intersectObject(gl.phone, true).length > 0;
};
let hoverQ = 0, lastHover = null;
glCanvas.addEventListener('pointermove', e => { lastHover = e; if (!hoverQ && !st.dragging) hoverQ = requestAnimationFrame(() => { hoverQ = 0; world.classList.toggle('on-phone', onPhone(lastHover)); }); });
glCanvas.addEventListener('pointerdown', e => {
  if (!host || (e.pointerType === 'mouse' && e.button !== 0)) return;
  e.preventDefault();
  st.moved = false;
  if (!onPhone(e)) return;                                                        // off the phone: a click, not a turn
  st.dragging = true; pid = e.pointerId; try { glCanvas.setPointerCapture(pid); } catch (_) {}
  lastX = downX = e.clientX; lastY = downY = e.clientY; lastT = performance.now(); st.vy = 0; st.vp = 0;
  world.classList.add('grabbing');
});
glCanvas.addEventListener('pointermove', e => {
  if (!host) return;
  const [x, y] = local(e);
  S.px = x; S.py = y; S.hx = (x / S.W) * 2 - 1; S.hy = (y / S.H) * 2 - 1; S.inside = true;
  if (st.dragging && e.pointerId === pid) {
    const now = performance.now(), dt = Math.max(1, now - lastT) / 1000, k = 3.4 / Math.max(260, L.phonePx);
    const dyaw = (e.clientX - lastX) * k * 1.4, dpitch = (e.clientY - lastY) * k;
    st.yaw += dyaw; st.pitch = clamp(st.pitch + dpitch, -1.15, 1.15);
    st.vy = st.vy * 0.4 + (dyaw / dt) * 0.6; st.vp = st.vp * 0.4 + (dpitch / dt) * 0.6;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) st.moved = true;
  }
});
const release = e => {
  if (!st.dragging || (e && e.pointerId !== pid)) return;
  st.dragging = false; st.released = performance.now() / 1000;
  if (performance.now() - lastT > 90) { st.vy = 0; st.vp = 0; }
  st.vy = clamp(st.vy, -14, 14); st.vp = clamp(st.vp, -8, 8);
  world.classList.remove('grabbing');
};
glCanvas.addEventListener('pointerup', release);
glCanvas.addEventListener('pointercancel', release);
glCanvas.addEventListener('pointerleave', () => { S.inside = false; });
world.addEventListener('dragstart', e => e.preventDefault());
// A drag is not a click: keep the featured link from opening after a turn.
// Inside the artifact a click is never navigation; the "View case study" button under it is.
let nt = 0;
world.addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation();
  if (st.moved) { st.moved = false; return; }
  if (!host) return;
  // off the phone: open the case (not while editing the site, not the page already open)
  const href = host.closest('.feat,.row')?.querySelector('.row-cta')?.getAttribute('href') || '#c-nexgen';
  if (!onPhone(e) && !document.body.classList.contains('editing') && location.hash !== href) { location.hash = href; return; }
  const r = host.getBoundingClientRect(), rp = document.createElement('i');
  rp.className = 'stg-ripple'; rp.style.left = (e.clientX - r.left) + 'px'; rp.style.top = (e.clientY - r.top) + 'px'; host.appendChild(rp); setTimeout(() => rp.remove(), 700);
  const b = host.closest('.feat')?.querySelector('.row-cta'); if (!b) return;
  b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); clearTimeout(nt); nt = setTimeout(() => b.classList.remove('nudge'), 1400);
}, true);
// The featured link keeps focus; arrows turn the phone, Enter still opens the case.
const onKey = e => {
  const kick = { ArrowLeft: -4.2, ArrowRight: 4.2 }[e.key];
  if (kick && !e.altKey && !e.metaKey && !e.ctrlKey) { e.preventDefault(); st.vy += kick; st.released = performance.now() / 1000; }
};

let recheck = 0;
function frameLoop() {
  const now = performance.now() / 1000, dt = Math.min(0.05, now - (prev || now)); prev = now;
  if (++recheck > 40) { recheck = 0; const f = freeRegion(), c = f ? [f.x0, f.x1, f.y0, f.y1].map(Math.round).join() : ''; if (c !== compose) layout(); }
  const g = gl;
  // pointer lean and the uncovering lens ease in and out
  S.shx += ((S.inside ? S.hx : 0) - S.shx) * Math.min(1, dt * 3);
  S.shy += ((S.inside ? S.hy : 0) - S.shy) * Math.min(1, dt * 3);
  lens += ((S.inside && !reduce ? 1 : 0) - lens) * Math.min(1, dt * 4);
  // scrolling the stage away pulls the wordmark apart and turns the phone
  const r = host.getBoundingClientRect(), fr = (host.closest('.frame') || document.documentElement).getBoundingClientRect();
  S.out = reduce ? 0 : clamp((fr.top - r.top) / (S.H * 0.9), 0, 1);

  if (!st.dragging) {
    const k = smooth(1.4, 2.5, now - st.released);
    const tYaw0 = POSE.yaw + (reduce ? 0 : S.shx * 0.18) + S.out * 0.7, tYaw = tYaw0 + TAU * Math.round((st.yaw - tYaw0) / TAU);
    const tPitch = POSE.pitch + (reduce ? 0 : S.shy * 0.1) - S.out * 0.12;
    const ay = k * (STIFF * (tYaw - st.yaw) - DAMP * st.vy) - (1 - k) * 1.9 * st.vy;
    const ap = k * (STIFF * (tPitch - st.pitch) - DAMP * st.vp) - (1 - k) * 2.6 * st.vp;
    st.vy += ay * dt; st.vp += ap * dt;
    st.yaw += st.vy * dt; st.pitch = clamp(st.pitch + st.vp * dt, -1.15, 1.15);
  }
  // first reveal: the phone rises and turns from its back
  if (intro === null && booted === 'ready') { intro = reduce ? -10 : now; world.classList.add('in'); }
  const p = intro === null ? 0 : clamp((now - intro) / 2.2, 0, 1);
  const turn = Math.PI * Math.pow(1 - p, 4), rise = -BODY_H * 1.2 * Math.pow(1 - p, 3), wordsIn = smooth(0.25, 0.85, p);
  words += (wordsIn - words) * Math.min(1, dt * 6);
  const yaw = st.yaw + turn, float = reduce ? 0 : Math.sin(now * 0.9) * 0.035;
  if (g) {
    const visH = 2 * L.dist * TAN, visW = visH * (S.W / S.H);
    g.rig.position.set((L.cx - 0.5) * visW, (0.5 - L.cy) * visH + float + rise + S.out * 0.25, 0);
    g.phone.rotation.set(st.pitch, yaw, POSE.roll + (reduce ? 0 : Math.sin(now * 0.55) * 0.018));
    g.rim.position.set(4 + S.shx * 2.2, 1.5 - S.shy * 1.2, -4);
    if (!filmLive && film.readyState >= 2 && film.currentTime > 0.05) { filmLive = true; g.screenMat.uniforms.t.value = g.vtex; }
    screenOn += ((g.screenMat.uniforms.t.value ? 1 : 0) - screenOn) * Math.min(1, dt * 2.2);
    g.screenMat.uniforms.uBright.value = screenOn;
    g.renderer.render(g.scene, g.camera);
  }
  // wordmark: unclips outward, rides the pointer for depth, its orange edge follows the phone's light
  const spread = S.out * 0.18 * S.W, par = reduce ? 0 : -S.shx * 10;
  mark.style.setProperty('--nx', (-spread + par).toFixed(1) + 'px');
  mark.style.setProperty('--gx', (spread + par).toFixed(1) + 'px');
  mark.style.setProperty('--clip', ((1 - words) * 100).toFixed(1) + '%');
  mark.style.setProperty('--edge', (-0.02 + Math.sin(yaw - POSE.yaw) * 0.03).toFixed(4) + 'em');
  world.style.setProperty('--fade', (1 - S.out * 0.8).toFixed(3));
  if (!reduce) { fieldClock += dt; if (fieldClock > 1 / 30) { fieldClock = 0; drawField(now, yaw, st.pitch); } }
}
let rafId = 0, filmOK = false;
const tick = () => { rafId = requestAnimationFrame(tick); if (host) frameLoop(); };
const playFilm = () => { const p = film.play(); if (p) p.catch(() => {}); };
function run(on) {
  if (on && !rafId) { prev = 0; rafId = requestAnimationFrame(tick); if (filmOK) playFilm(); }
  if (!on && rafId) { cancelAnimationFrame(rafId); rafId = 0; film.pause(); }
}

/* ---------- mount into whatever host the current page rendered ---------- */
async function boot() {
  booted = true;
  // queued first (this module runs before the stages), so the cover's phone is built before the others
  gl = await glQueue(async () => {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]);
    measureWords();
    return buildGL();
  });
  if (!gl) world.classList.add('flat');
  layout();
  // two frames drawn in the intro's start pose (below, turned away) take the first-render cost; then the intro plays
  if (gl && S.visible) await frames(2);
  booted = 'ready';
  // the intro owns the main thread while it plays (2.2 s): the film starts and the other phones build after it
  const settled = new Promise(r => setTimeout(r, gl && S.visible && !reduce ? 2300 : 0));
  glQueue(() => settled);
  settled.then(() => { filmOK = true; if (rafId) playFilm(); });
  document.fonts.ready.then(() => { measureWords(); layout(); });
}
function attach() {
  const h = document.querySelector('.nxs[data-stage="nexgen"]');
  if (h === host) return;
  if (ro) { ro.disconnect(); ro = null; } if (io) { io.disconnect(); io = null; }
  if (link) link.removeEventListener('keydown', onKey);
  host = h; link = h; if (h) h.tabIndex = 0;
  if (!host) { run(false); return; }
  host.appendChild(world);
  if (link) link.addEventListener('keydown', onKey);
  ro = new ResizeObserver(() => layout()); ro.observe(host);
  io = new IntersectionObserver(es => {
    S.visible = es[es.length - 1].isIntersecting; run(S.visible && !document.hidden); // the newest entry wins
  }, { threshold: 0.05 });
  io.observe(host);
  if (!booted) boot(); else layout();
}
document.addEventListener('visibilitychange', () => run(S.visible && !document.hidden && !!host));
window.NXStage = { attach, state: () => ({ booted, intro, gl: !!gl, cls: world.className, compose, words: S.words, mobile: S.mobile, W: S.W, H: S.H, cx: L.cx, cy: L.cy, running: !!rafId, visible: S.visible, free: host && freeRegion() }) };
attach();
