/* Stages: the landing's live images. One engine, one world per case.
   Principles carried over from the NexGen cover (not its look):
   - each image is a world in the product's own brand;
   - the screens are rebuilt live (crisp at any size) and replay the real journey;
   - the reader can take over: phones turn under the hand, controls in the screens answer;
   - calm motion (one easing, staggered entrances), paused off screen, reduced motion respected;
   - a click that isn't a drag or a control opens the case (each stage sits inside its row link). */

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;
export function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export const $ = (root, s) => root.querySelector(s);
export const $$ = (root, s) => [...root.querySelectorAll(s)];
export const ABORT = Symbol('abort');

/* ---------- fonts: one request for every stage ---------- */
if (!document.getElementById('stg-fonts')) {
  const l = document.createElement('link'); l.id = 'stg-fonts'; l.rel = 'stylesheet';
  l.href = new URL('../fonts/stage-fonts.css', import.meta.url).href;   // self-hosted (2026-10-19)
  document.head.appendChild(l);
}

/* each case brings its own stylesheet */
export function css(name) {
  if (document.getElementById('stg-css-' + name)) return;
  const l = document.createElement('link'); l.id = 'stg-css-' + name; l.rel = 'stylesheet'; l.href = new URL(name + '.css', import.meta.url).href;
  document.head.appendChild(l);
}
css('stages');

/* ---------- the stage ---------- */
export function mountStage(host, load) {
  const world = el(`<div class="stg-world stg-${host.dataset.stage}"></div>`);
  host.prepend(world);
  const S = {
    host, world, W: 1, H: 1, mobile: false, visible: false, running: false,
    px: 0, py: 0, hx: 0, hy: 0, shx: 0, shy: 0, inside: false,
    t: 0, ft: 0, paused: 0, gen: 0, waiters: [], frames: new Set(), resizers: new Set(), acts: {}, drags: [],
    entered: false, destroyed: false, inst: null,
  };

  /* clock: frames run on real time; the flow's waits only advance when the reader isn't driving */
  let raf = 0, last = 0;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    S.t += dt;
    if (S.t >= S.paused) S.ft += dt;
    S.shx += ((S.inside ? S.hx : 0) - S.shx) * Math.min(1, dt * 3);
    S.shy += ((S.inside ? S.hy : 0) - S.shy) * Math.min(1, dt * 3);
    for (let i = S.waiters.length - 1; i >= 0; i--) {
      const w = S.waiters[i];
      if (w.gen !== S.gen) { S.waiters.splice(i, 1); w.rej(ABORT); }
      else if (S.ft >= w.due) { S.waiters.splice(i, 1); w.res(); }
    }
    for (const f of S.frames) f(dt, S.t);
  };
  const run = on => {
    on = on && !S.destroyed;
    if (on === S.running) return; S.running = on;
    if (on) { last = 0; raf = requestAnimationFrame(loop); world.classList.add('on'); }
    else { cancelAnimationFrame(raf); raf = 0; world.classList.remove('on'); }
    world.querySelectorAll('video').forEach(v => { try { on ? v.play().catch(() => {}) : v.pause(); } catch (_) {} });
  };

  const api = {
    S, world, host, reduce, hold: 7,
    wait: ms => new Promise((res, rej) => S.waiters.push({ due: S.ft + (reduce ? Math.min(ms, 600) : ms) / 1000, res, rej, gen: S.gen })),
    frame: fn => { S.frames.add(fn); return () => S.frames.delete(fn); },
    resize: fn => { S.resizers.add(fn); fn(S); return fn; },
    act: (name, fn) => { S.acts[name] = fn; },
    drag: (sel, d) => { S.drags.push({ sel, ...d }); },   // a control the reader drags (sliders, the table)
    takeover: (s = 7) => { S.paused = S.t + s; },   // the reader drives; the film waits
    // jump the film to its next beat (a tap on a phone button that the film would have pressed anyway)
    skip: () => { const d = S.waiters.filter(w => w.gen === S.gen).map(w => w.due); S.paused = 0; if (d.length) S.ft = Math.max(S.ft, Math.min(...d)); },
    /* a looping flow. restart() aborts the running pass at its next wait. */
    flow(fn) {
      const go = async () => {
        while (!S.destroyed) {
          const g = S.gen;
          try { await fn(api); } catch (e) { if (e !== ABORT) { console.error(e); return; } }
          if (g === S.gen) await api.wait(300).catch(() => {});
        }
      };
      api.restart = () => { S.gen++; };
      go();
    },
  };

  /* size */
  const measure = () => {
    S.W = Math.max(1, host.clientWidth); S.H = Math.max(1, host.clientHeight);
    S.mobile = S.W < 560;
    world.style.setProperty('--W', S.W + 'px'); world.style.setProperty('--H', S.H + 'px');
    world.classList.toggle('is-small', S.mobile);
    for (const f of S.resizers) f(S);
  };
  const ro = new ResizeObserver(measure); ro.observe(host);
  const io = new IntersectionObserver(es => {
    S.visible = es[es.length - 1].isIntersecting;
    run(S.visible && !document.hidden);
    if (S.visible && !S.entered) { S.entered = true; requestAnimationFrame(() => world.classList.add('in')); }
  }, { threshold: 0.12 });
  io.observe(host);
  const vis = () => run(S.visible && !document.hidden);
  document.addEventListener('visibilitychange', vis);

  /* input. The work answers only where it is interactive: the phone turns under a drag that starts on it, controls
     ([data-act], [data-drag], [data-off]) and declared zones ([data-zone], e.g. a tuning panel) keep their own clicks.
     A click anywhere else in the block opens the case (2026-10-17). */
  let down = null;
  const local = e => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onPhone = e => !!(e.target.closest && e.target.closest('.g3-scr')) || !!(api.hitPhone && api.hitPhone(e.clientX, e.clientY));
  const inZone = e => !!(e.target.closest && e.target.closest('[data-zone],[data-drag],[data-act],[data-off]')) || onPhone(e);
  let hoverQ = 0, lastHover = null;
  const hover = () => { hoverQ = 0; if (!lastHover) return; const p = onPhone(lastHover); world.classList.toggle('on-phone', p); world.classList.toggle('on-zone', p || inZone(lastHover)); };
  world.addEventListener('pointermove', e => {
    const [x, y] = local(e); S.px = x; S.py = y; S.hx = (x / S.W) * 2 - 1; S.hy = (y / S.H) * 2 - 1; S.inside = true;
    lastHover = e; if (!hoverQ && !down) hoverQ = requestAnimationFrame(hover);   // the cursor says what a click will do
    if (down && down.id === e.pointerId) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) > 5) down.moved = true;
      if (down.moved && down.turn) down.turn(e.clientX - down.lx, e.clientY - down.ly, e);
      down.lx = e.clientX; down.ly = e.clientY;
    }
  });
  world.addEventListener('pointerleave', () => { S.inside = false; });
  world.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const dragEl = e.target.closest('[data-drag]');
    e.preventDefault();
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, turn: null };
    if (dragEl && S.drags.length) {
      const d = S.drags.find(d => dragEl.matches(d.sel)); if (d) { down.turn = (dx, dy, ev) => d.move(dx, dy, ev, dragEl); down.moved = true; d.start && d.start(e, dragEl); api.takeover(api.hold); }
    } else if (api.turner && onPhone(e)) down.turn = api.turner.drag;   // only the phone turns
    if (down.turn) { try { world.setPointerCapture(e.pointerId); } catch (_) {} world.classList.add('grabbing'); api.turner && !dragEl && api.turner.grab(true); }
  });
  const up = e => {
    if (!down || down.id !== e.pointerId) return;
    world.classList.remove('grabbing'); api.turner && api.turner.grab(false);
    S.lastMoved = down.moved; down = null;
  };
  world.addEventListener('pointerup', up); world.addEventListener('pointercancel', up);
  world.addEventListener('dragstart', e => e.preventDefault());
  // Inside the artifact a click is never navigation: it works a control, or it points the reader to the
  // "View case study" button under the image.
  world.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (S.lastMoved) { S.lastMoved = false; return; }
    const a = e.target.closest('[data-act]');
    if (a && S.acts[a.dataset.act]) { if (S.acts[a.dataset.act](a, e) !== 'go') api.takeover(api.hold); return; }
    if (e.target.closest('[data-off]')) { const o = e.target.closest('[data-off]'); o.classList.remove('deny'); void o.offsetWidth; o.classList.add('deny'); return; }
    if (inZone(e)) { nudge(e); return; }
    open(e);
  }, true);
  // outside the interactive work: go to the case (not while editing the site, not to the page already open)
  const open = e => {
    const href = host.closest('.row,.feat')?.querySelector('.row-cta')?.getAttribute('href') || '#c-' + host.dataset.stage;
    if (document.body.classList.contains('editing') || location.hash === href) { nudge(e); return; }
    location.hash = href;
  };
  const link = host; host.tabIndex = 0;   // arrows turn a phone while the stage has focus
  let nt = 0;
  const nudge = e => {
    const r = host.getBoundingClientRect();
    const rp = el(`<i class="stg-ripple" style="left:${e.clientX - r.left}px;top:${e.clientY - r.top}px"></i>`); host.appendChild(rp); setTimeout(() => rp.remove(), 700);
    const b = host.closest('.row,.feat')?.querySelector('.row-cta'); if (!b) return;   // point to the way in
    b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); clearTimeout(nt); nt = setTimeout(() => b.classList.remove('nudge'), 1400);
  };
  const onKey = e => { const k = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (k && api.turner) { e.preventDefault(); api.turner.kick(k); } };
  link && link.addEventListener('keydown', onKey);

  measure();
  load().then(m => { if (!S.destroyed) S.inst = m.mount(api) || {}; measure(); });

  return {
    destroy() {
      S.destroyed = true; S.gen++; run(false); ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', vis); link && link.removeEventListener('keydown', onKey);
      S.inst && S.inst.destroy && S.inst.destroy();
    },
  };
}

/* ---------- 3D phone (CSS): layered titanium edge, glass, live screen, glare that follows the turn ---------- */
const LAYERS = 14;
export function phone({ back = '', ui = '', cls = '' } = {}) {
  const edge = Array.from({ length: LAYERS }, (_, i) => `<i class="p3-edge" style="--k:${(i / (LAYERS - 1)).toFixed(3)}"></i>`).join('');
  return el(`<div class="p3 ${cls}"><div class="p3-body">${edge}
    <div class="p3-back">${back}<span class="p3-cam"><i></i><i></i><i></i></span></div>
    <div class="p3-front"><div class="p3-glass"><div class="p3-screen"><div class="p3-ui">${ui}</div></div><span class="p3-island"></span><span class="p3-glare"></span></div>
</div>
  </div></div>`);
}
export const UI_W = 390;
/* fit a phone in the stage: height share of the box, centre as box fractions; returns the px height */
export function placePhone(p, S, { h = 0.86, cx = 0.5, cy = 0.5, maxW = 0.9 } = {}) {
  const ph = Math.min(S.H * h, (S.W * maxW) / 0.485);
  p.style.setProperty('--ph', ph.toFixed(1) + 'px');
  p.style.left = (S.W * cx - ph * 0.485 / 2).toFixed(1) + 'px';
  p.style.top = (S.H * cy - ph / 2).toFixed(1) + 'px';
  const sw = ph * 0.485 - 2 * ph * 0.026;  // screen width in px
  p.style.setProperty('--s', (sw / UI_W).toFixed(4));
  p.style.setProperty('--uih', ((ph - 2 * ph * 0.026) / (sw / UI_W)).toFixed(1) + 'px');
  return ph;
}

/* drag-to-turn with the NexGen spring: phones lean to the pointer, float, and come back after a turn */
export function turner(api, phones, { pose = { yaw: -0.32, pitch: -0.06, roll: -0.03 }, lean = 0.16 } = {}) {
  const S = api.S, st = { yaw: pose.yaw, pitch: pose.pitch, vy: 0, vp: 0, drag: false, rel: -1e9, intro: null };
  const STIFF = 24, DAMP = 8.4;
  const T = {
    st,
    grab(on) { st.drag = on; if (!on) { st.rel = S.t; st.vy = clamp(st.vy, -14, 14); st.vp = clamp(st.vp, -8, 8); } else { st.vy = 0; st.vp = 0; } },
    drag(dx, dy) {
      const k = 3.4 / Math.max(260, S.H * 0.86);
      st.yaw += dx * k * 1.4; st.pitch = clamp(st.pitch + dy * k * 0.7, -0.9, 0.9);
      st.vy = st.vy * 0.4 + dx * k * 1.4 * 60 * 0.6; st.vp = st.vp * 0.4 + dy * k * 0.7 * 60 * 0.6;
    },
    kick(dir) { st.vy += dir * 4.2; st.rel = S.t; },
  };
  api.turner = T;
  api.frame((dt, t) => {
    if (!st.drag) {
      const k = smooth(1.2, 2.2, t - st.rel);
      const ty0 = pose.yaw + (reduce ? 0 : S.shx * lean), ty = ty0 + TAU * Math.round((st.yaw - ty0) / TAU);
      const tp = pose.pitch + (reduce ? 0 : S.shy * lean * 0.5);
      st.vy += (k * (STIFF * (ty - st.yaw) - DAMP * st.vy) - (1 - k) * 1.9 * st.vy) * dt;
      st.vp += (k * (STIFF * (tp - st.pitch) - DAMP * st.vp) - (1 - k) * 2.6 * st.vp) * dt;
      st.yaw += st.vy * dt; st.pitch = clamp(st.pitch + st.vp * dt, -0.9, 0.9);
    }
    if (st.intro === null && S.world.classList.contains('in')) st.intro = t;
    const p = st.intro === null ? 0 : reduce ? 1 : clamp((t - st.intro) / 1.8, 0, 1);
    const turn = Math.PI * 0.55 * Math.pow(1 - p, 4), rise = Math.pow(1 - p, 3) * 0.5;
    phones.forEach((ph, i) => {
      const o = ph._off || { yaw: 0, pitch: 0, roll: 0, z: 0 };
      const fl = reduce ? 0 : Math.sin(t * 0.9 + i * 1.7) * 0.012;
      const yaw = st.yaw + o.yaw + turn, pitch = st.pitch + o.pitch;
      ph.style.setProperty('--rot', `translate3d(0, ${((fl + rise) * 100).toFixed(2)}%, ${o.z || 0}px) rotateX(${(-pitch).toFixed(4)}rad) rotateY(${yaw.toFixed(4)}rad) rotateZ(${(pose.roll + (o.roll || 0)).toFixed(4)}rad)`);
      ph.style.setProperty('--gl', (50 + Math.sin(yaw) * 70).toFixed(1) + '%');
      ph.style.setProperty('--sh', Math.sin(yaw).toFixed(3));
      ph.style.setProperty('--op', p.toFixed(3));
    });
  });
  return T;
}

/* tap: a soft touch ring where the finger lands inside a phone UI (UI coordinates) */
export async function tap(api, ui, target, { hold = 160 } = {}) {
  if (!target) return;
  // Measure in the screen's own plane: on the 3D phone the rects are perspective projections, so lift the phone's
  // transforms for this synchronous read (nothing paints in between), then put them back.
  const lifted = [];
  for (let a = ui.parentElement; a && a !== document.documentElement; a = a.parentElement)
    if (getComputedStyle(a).transform !== 'none') { lifted.push([a, a.style.transform, a.style.transition]); a.style.transition = 'none'; a.style.transform = 'none'; }
  // A wrapped link is tapped on its first line, not in the gap between its lines.
  const r = target.getClientRects()[0] || target.getBoundingClientRect(), u = ui.getBoundingClientRect(), s = u.width / UI_W || 1;
  lifted.forEach(([a, t]) => { a.style.transform = t; }); if (lifted.length) void ui.offsetWidth;
  lifted.forEach(([a, , tr]) => { a.style.transition = tr; });
  const dot = el(`<i class="tap-dot" style="left:${((r.left + r.width / 2 - u.left) / s).toFixed(1)}px;top:${((r.top + r.height / 2 - u.top) / s).toFixed(1)}px"></i>`);
  ui.appendChild(dot);
  target.classList.add('is-pressed');
  await api.wait(hold);
  target.classList.remove('is-pressed');
  setTimeout(() => dot.remove(), 700);
}

/* ---------- desktop: a flat full-bleed app canvas, scaled to the box; on small boxes the camera follows the action ---------- */
export function desk(api, { w = 1280, minScale = 0.5, smallScale = 0, fitHeight = false, keep = {}, html = '' } = {}) {   // fitHeight: on phones, the app keeps its 16:9 and fills the block's height (2026-10-19)   // smallScale: the zoom on phones
  const S = api.S;
  const wrap = el(`<div class="dsk"><div class="dsk-cam"><div class="dsk-ui">${html}<i class="cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.5L16 19l-2.6 1.3-3.2-6.4L5 18z"/></svg></i></div></div></div>`);
  api.world.appendChild(wrap);
  const cam = $(wrap, '.dsk-cam'), ui = $(wrap, '.dsk-ui'), cur = $(wrap, '.cur');
  const D = { wrap, cam, ui, cur, s: 1, zoom: false, focus: null, cx: w * 0.6, cy: 300 };
  const apply = () => {
    let fx = 0, fy = 0;
    if (D.zoom && D.focus) {
      const vw = (D.W || S.W) / D.s, vh = (D.H || S.H) / D.s, uh = ui.offsetHeight;
      fx = clamp(D.focus[0] - vw / 2, 0, w - vw); fy = clamp(D.focus[1] - vh / 2, 0, Math.max(0, uh - vh));
    }
    D.off = [fx, fy];                       // where the story wants the camera
    if (!D.zoom || !D.camAt) { D.camAt = [fx, fy]; cam.style.transform = `scale(${D.s.toFixed(4)}) translate(${(-fx).toFixed(1)}px, ${(-fy).toFixed(1)}px)`; }
  };
  const size = () => {
    const W = wrap.clientWidth || S.W, H = wrap.clientHeight || S.H;
    // fit the whole app (designed at w × 9/16 w) inside the box, whatever its shape; a wider box widens the app
    const ms = S.mobile && smallScale ? smallScale : minScale;
    const fit = Math.min(W / w, H / (w * 9 / 16)); D.zoom = W / w < ms; D.s = D.zoom ? ms : fit; D.W = W; D.H = H;
    if (fitHeight && S.mobile) {   // one 16:9 app, as tall as the block: the camera only pans sideways
      D.s = H / (w * 9 / 16); D.zoom = W / w < D.s; ui.style.width = w + 'px'; ui.style.height = (w * 9 / 16).toFixed(1) + 'px'; apply(); return;
    }
    ui.style.width = (D.zoom ? w : Math.max(w, W / D.s)).toFixed(1) + 'px'; ui.style.height = (D.zoom ? Math.max(H / D.s, (w * H) / W) : H / D.s).toFixed(1) + 'px';
    apply();
  };
  api.resize(size);
  const wro = new ResizeObserver(size); wro.observe(wrap);
  // On small boxes the camera is driven here, every frame (2026-10-17): it eases toward where the story wants it (D.off),
  // shifted so a box around the cursor, the label beside it included, stays in view (keep: UI px on each side of the tip),
  // and the tip itself can never leave the view, even during a fast drag.
  const K = { l: 60, r: 230, t: 40, b: 70, ...keep };
  /* where the camera wants to be for a cursor at (x, y): the story's view, shifted so the box around the cursor shows */
  const target = (x, y) => {
    const vw = (D.W || S.W) / D.s, vh = (D.H || S.H) / D.s, uh = ui.offsetHeight;
    const bx = v => clamp(v, 0, Math.max(0, w - vw)), by = v => clamp(v, 0, Math.max(0, uh - vh));
    const tag = cur.querySelector('.cur-tag');
    if (tag) { if (x + K.r > w) cur.classList.add('flip'); else if (x + K.r < w - 40) cur.classList.remove('flip'); }
    const flip = !!tag && cur.classList.contains('flip'), L = flip ? K.r : K.l, R = flip ? K.l : K.r;
    let [tx, ty] = D.off || [0, 0];
    if (x + R > tx + vw) tx = x + R - vw;
    if (x - L < tx) tx = x - L;
    if (y + K.b > ty + vh) ty = y + K.b - vh;
    if (y - K.t < ty) ty = y - K.t;
    return { t: [bx(tx), by(ty)], bx, by, vw, vh };
  };
  const put = ([ax, ay]) => { D.camAt = [ax, ay]; cam.style.transitionDuration = '0ms'; cam.style.transform = `scale(${D.s.toFixed(4)}) translate(${(-ax).toFixed(1)}px, ${(-ay).toFixed(1)}px)`; };
  api.frame(dt => {
    if (!D.zoom) return;
    const m = new DOMMatrixReadOnly(getComputedStyle(cur).transform), x = m.e, y = m.f;
    const { t: [gx, gy], bx, by, vw, vh } = target(x, y);
    let [ax, ay] = D.camAt || [gx, gy];
    const k = D.hold ? 1 : Math.min(1, dt * 5);   // held (D.place at the start): no easing at all
    ax += (gx - ax) * k; ay += (gy - ay) * k;
    put([bx(clamp(ax, x - vw + 40, x - 16)), by(clamp(ay, y - vh + 48, y - 16))]);
  });

  // position of an element in UI coordinates (the UI can be wider than w, so the scale comes from its own width)
  D.at = (node, ax = 0.5, ay = 0.5) => {
    const r = node.getBoundingClientRect(), u = ui.getBoundingClientRect(), s = u.width / ui.offsetWidth || 1;
    return [(r.left - u.left + r.width * ax) / s, (r.top - u.top + r.height * ay) / s];
  };
  D.look = (node, ax, ay) => { D.focus = node.nodeType ? D.at(node, ax, ay) : node; apply(); };
  D.move = async (node, { ax = 0.5, ay = 0.5, dur } = {}) => {
    const [x, y] = node.nodeType ? D.at(node, ax, ay) : node;
    const d = Math.hypot(x - D.cx, y - D.cy), ms = dur || clamp(380 + d * 0.55, 420, 1100);
    cur.style.transitionDuration = ms + 'ms';
    cur.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    D.cx = x; D.cy = y;
    if (D.zoom) {   // the camera follows only when the action leaves the middle of the view
      const vw = (D.W || S.W) / D.s, vh = (D.H || S.H) / D.s, [ox, oy] = D.off || [0, 0];
      if (x < ox + vw * 0.14 || x > ox + vw * 0.86 || y < oy + vh * 0.14 || y > oy + vh * 0.86) { D.focus = [x, y]; cam.style.transitionDuration = Math.max(ms, 900) + 'ms'; apply(); }
    }
    await api.wait(ms + 60);
  };
  D.click = async (node, opt) => {
    if (node) await D.move(node, opt);
    cur.classList.add('down'); node && node.classList && node.classList.add('is-pressed');
    const ring = el(`<i class="click-ring" style="left:${D.cx}px;top:${D.cy}px"></i>`); ui.appendChild(ring); setTimeout(() => ring.remove(), 700);
    await api.wait(140);
    cur.classList.remove('down'); node && node.classList && node.classList.remove('is-pressed');
    await api.wait(120);
  };
  D.type = async (input, text, { cps = 16, prop = 'textContent' } = {}) => {
    for (const ch of text) { input[prop] += ch; await api.wait(1000 / cps * (ch === ' ' ? 0.6 : 1) * (0.7 + Math.random() * 0.6)); }
  };
  D.erase = async (input, n, { cps = 30, prop = 'textContent' } = {}) => {
    for (let i = 0; i < n; i++) { input[prop] = input[prop].slice(0, -1); await api.wait(1000 / cps); }
  };
  D.cursor = on => cur.classList.toggle('hide', !on);
  /* the cursor at a node at once, the camera already on it: no search at the start (2026-10-19) */
  D.place = (node, ax = 0.5, ay = 0.5) => {
    const [x, y] = D.at(node, ax, ay); cur.style.transitionDuration = '0ms'; cur.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    D.cx = x; D.cy = y; D.focus = [x, y]; D.hold = true; apply();
    if (D.zoom) put(target(x, y).t);   // the camera exactly where the frame loop will want it: nothing eases at the start
  };
  return D;
}

/* iOS status bar */
export const statusBar = (time = '9:41') => `<div class="sb"><span>${time}</span><span class="ic">
  <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg viewBox="0 0 16 12"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4C5.1.4 2.5 1.5.5 3.4l1.2 1.3A8.9 8.9 0 0 1 8 2.2zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.2 7.2 0 0 0 8 4c-1.9 0-3.6.7-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4zM8 9.3l2-2.1A3 3 0 0 0 8 6.5c-.8 0-1.5.3-2 .7z" transform="translate(0 1.4)"/></svg>
  <svg viewBox="0 0 27 12"><rect x=".6" y=".6" width="22.8" height="10.8" rx="3.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45"/><rect x="2.4" y="2.4" width="19.2" height="7.2" rx="1.8"/><path d="M25 4v4c.8-.3 1.4-1.1 1.4-2S25.8 4.3 25 4z" opacity=".5"/></svg></span></div>`;

/* type into a phone field */
export async function typeInto(api, node, text, cps = 14) {
  node.classList.add('is-typing');
  for (const ch of text) { node.textContent += ch; await api.wait(1000 / cps * (0.7 + Math.random() * 0.6)); }
  node.classList.remove('is-typing');
}
