/* System first (white-label): make the rules executable.
   Two hands on one artifact. The reader, and an agent (its cursor is labelled) that tends the system:
   it tunes, checks, and repairs. It never replays a script. Every step it takes is planned from the
   artifact as it is right now: which room is open, every token's current value, which checks fail.
   When the reader touches anything, the agent lets go at once, waits, says it saw the change, and plans
   again from the new state. If the reader breaks a rule, the agent's next move is to fix it, in the open.

   One source of truth (T). Stage, Tokens, System, the header count and the panel all read from it, every
   frame it changes, so a value can never be one thing in one room and another elsewhere. */
import { $, $$, desk, clamp, css, ABORT } from './core.js';
css('enterprise');

const spark = '<svg viewBox="0 0 24 24"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" fill="currentColor"/></svg>';
const lockI = '<svg class="cs-lk" viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" rx="1.4"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/></svg>';
const hsl2hex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const CARD = '#211836';              // the card's surface, where the accent is actually used
const AA_LARGE = 3;                  // the headline and the bars: large text and graphics, WCAG 3:1
const SCALE = [2.4, 4.0];            // the H1 type scale
const RANGE = { hue: [0, 360], lit: [20, 85], h1: [2.2, 4.2], r: [4, 32] };
const START = { hue: 272, lit: 62, h1: 3.35, r: 24 };

const fader = (k, label, unit) => `<div class="cs-row live"><span>${label}</span><div class="cs-fader" data-drag data-k="${k}"><i class="trk"></i><i class="fill"></i><i class="knob"></i></div><em class="cs-val" data-k="${k}"></em><small>${unit}</small></div>`;
const off = (label, ctrl, val, unit = '') => `<div class="cs-row off" data-off title="Read-only in this demo"><span>${label}</span>${ctrl}<em>${val}</em><small>${unit || lockI}</small></div>`;
const offFader = t => `<div class="cs-fader ro"><i class="trk"></i><i class="fill" style="width:${t}%"></i><i class="knob" style="left:${t}%"></i></div>`;

const HTML = `
<div class="cs" data-room="stage">
  <header class="cs-bar"><span class="cs-brand">${spark}<b>Foundation</b><small>v0.4</small></span>
    <nav class="cs-rooms"><span data-act="cs-room" data-r="stage">Stage</span><span data-act="cs-room" data-r="tokens">Tokens</span><span data-act="cs-room" data-r="system">System</span></nav>
    <span class="cs-lint"><i></i><b class="cs-count">0 problems</b></span></header>
  <div class="cs-rooms-wrap">
    <section class="cs-room stage">
      <div class="cs-photo"></div>
      <article class="cs-card">
        <div class="cs-ch"><span class="cs-ct">${spark}LUNCH TRAFFIC</span><span class="cs-live"><i></i>LIVE · <b class="cs-clock">3:15</b> PM</span></div>
        <h2 class="cs-h1">GUEST TRAFFIC IS <em>RUNNING<br>ABOVE</em> THE FRIDAY AVERAGE</h2>
        <p class="cs-p">The lunch rush peaked at 12:15 PM. Higher flow is continuing around the Main Dining pickup area.</p>
        <div class="cs-panel"><div class="cs-m"><span>Current traffic</span><b class="cs-now">84</b></div><div class="cs-bar1"><i class="cs-nowbar"></i></div>
          <div class="cs-m mut"><span>Typical at this time</span><b>72 (avg)</b></div><div class="cs-bar2"><i></i></div></div>
      </article>
    </section>
    <section class="cs-room tokens">
      <div class="cs-sheet">
        <div><h5>Primitives</h5>
          <div class="cs-sw"><i style="background:#061b3d"></i><span>ink</span><code>#061b3d</code></div>
          <div class="cs-sw"><i style="background:#fafcff;box-shadow:inset 0 0 0 1px #dde1e8"></i><span>paper</span><code>#fafcff</code></div>
          <div class="cs-sw hot" data-t="acc"><i class="acc"></i><span>accent</span><code class="v-acc"></code></div>
          <div class="cs-sw"><i style="background:${CARD}"></i><span>card</span><code>${CARD}</code></div>
          <div class="cs-sw"><i style="background:#dde1e8"></i><span>hairline</span><code>12% ink</code></div></div>
        <div><h5>Radius</h5><dl><dt>shell</dt><dd class="v-r hot-t"></dd><dt>nested</dt><dd class="v-rn hot-t"></dd><dt>control</dt><dd>4px</dd></dl><h5 class="mt">Space</h5><dl><dt>inline</dt><dd>12px</dd><dt>group</dt><dd>32px</dd></dl></div>
        <div><h5>Type roles</h5><dl class="wide"><dt>H1</dt><dd>Barlow Cond.</dd><dd class="v-h1 hot-t"></dd><dt>H2</dt><dd>Instrument Serif</dd><dd>1.9rem</dd><dt>Body</dt><dd>Space Grotesk</dd><dd>1rem</dd><dt>Mono</dt><dd>Geist Mono</dd><dd>.75rem</dd></dl>
          <div class="cs-scale"><span class="lo">2.4</span><i><b class="cs-sc-ok"></b><b class="cs-sc-dot"></b></i><span class="hi">4.0</span></div></div>
        <div><h5>Contrast pairs</h5>
          <div class="cs-aa"><i style="background:#061b3d"></i><span>ink on paper</span><code>16.9:1</code><b class="ok">✓</b></div>
          <div class="cs-aa"><i style="background:#67758b"></i><span>muted on paper</span><code>4.7:1</code><b class="ok">✓</b></div>
          <div class="cs-aa hot" data-t="aa"><i class="acc"></i><span>accent on card</span><code class="v-ratio"></code><b class="v-aa"></b></div>
          <p class="cs-note">Accent is used on the card: headline and bars, so AA large (3:1).</p></div>
      </div>
    </section>
    <section class="cs-room system">
      <div class="cs-sys">
        <div class="cs-code"><div class="cs-file">tokens.json <span>written back from Tune</span></div>
<pre>{
  <span class="k">"accent"</span>: <span class="s v-acc-q"></span>,
  <span class="k">"type.h1"</span>: <span class="s v-h1-q"></span>,
  <span class="k">"radius.shell"</span>: <span class="s v-r-q"></span>,
  <span class="k">"radius.nested"</span>: <span class="s v-rn-q"></span>
}</pre></div>
        <div class="cs-checks"><h5>Checks <small>run on every change</small></h5>
          <div class="cs-ck" data-c="contrast"><i></i><div><b>Contrast</b><span class="v-ck-contrast"></span></div></div>
          <div class="cs-ck" data-c="scale"><i></i><div><b>Type scale</b><span class="v-ck-scale"></span></div></div>
          <div class="cs-ck ok"><i></i><div><b>Tokens only</b><span>No raw values in components.</span></div></div>
          <div class="cs-ck ok"><i></i><div><b>Five kinds</b><span>primitive · semantic · catalog · example · recipe</span></div></div></div>
      </div>
    </section>
  </div>
  <aside class="cs-leva" data-zone>
    <div class="cs-lh"><span>Tune</span><em>live</em></div>
    <div class="cs-grp">Colors</div>
    ${off('ink', '<i class="cs-chip" style="background:#061b3d"></i>', '#061b3d')}
    ${off('paper', '<i class="cs-chip" style="background:#fafcff"></i>', '#fafcff')}
    ${fader('hue', 'accent hue', '°')}
    ${fader('lit', 'accent light', '%')}
    <div class="cs-grp">Type</div>
    ${off('H1 font', '<i class="cs-sel">Barlow Cond.</i>', '')}
    ${fader('h1', 'H1 size', 'rem')}
    <div class="cs-grp">Layout</div>
    ${fader('r', 'radius shell', 'px')}
    ${off('inline pad', offFader(40), '12', 'px')}
    <div class="cs-grp">Motion</div>
    ${off('quick', offFader(30), '160', 'ms')}
  </aside>
</div>`;

export function mount(api) {
  const { S } = api;
  api.hold = 0;                                  // the agent decides when to come back, not a timer on the film
  const D = desk(api, { w: 1280, minScale: 0.52, smallScale: 0.84, fitHeight: true, keep: { r: 290 }, html: HTML });
  const ui = D.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  const cs = q('.cs');
  D.cur.classList.add('agent');
  D.cur.insertAdjacentHTML('beforeend', '<b class="cur-tag"><span>Agent</span><em></em></b>');
  const tag = $(D.cur, '.cur-tag em');
  const say = t => { tag.textContent = t; D.cur.classList.toggle('talking', !!t); };

  /* ---------- the one state, and everything that reads it ---------- */
  const T = { ...START };
  const N = {                                   // cached nodes: the render touches nothing it has to look up
    faders: Object.fromEntries(qq('.cs-fader[data-k]').map(f => [f.dataset.k, f])),
    vals: Object.fromEntries(qq('.cs-val').map(v => [v.dataset.k, v])),
    acc: qq('.v-acc'), accQ: q('.v-acc-q'), h1: q('.v-h1'), h1Q: q('.v-h1-q'), r: q('.v-r'), rQ: q('.v-r-q'), rn: q('.v-rn'), rnQ: q('.v-rn-q'),
    ratio: q('.v-ratio'), aa: q('.v-aa'), ckC: q('.v-ck-contrast'), ckS: q('.v-ck-scale'), count: q('.cs-count'),
    scDot: q('.cs-sc-dot'), now: q('.cs-now'), nowbar: q('.cs-nowbar'),
    ck: { contrast: q('.cs-ck[data-c="contrast"]'), scale: q('.cs-ck[data-c="scale"]') },
  };
  const txt = (n, v) => { if (n.textContent !== v) n.textContent = v; };
  let dirty = true, lastHot = '';
  const derive = () => {
    const acc = hsl2hex(T.hue, 80, T.lit), cr = ratio(acc, CARD), rn = Math.round(T.r * 0.66);
    const problems = [];
    if (cr < AA_LARGE) problems.push('contrast');
    if (T.h1 < SCALE[0] - 1e-6 || T.h1 > SCALE[1] + 1e-6) problems.push('scale');
    return { acc, cr, rn, problems };
  };
  const render = () => {
    if (!dirty) return; dirty = false;
    const d = derive();
    cs.style.setProperty('--acc', d.acc); cs.style.setProperty('--h1', T.h1.toFixed(3)); cs.style.setProperty('--r', T.r.toFixed(1) + 'px'); cs.style.setProperty('--rn', d.rn + 'px');
    for (const k in N.faders) { const [a, b] = RANGE[k]; N.faders[k].style.setProperty('--t', ((T[k] - a) / (b - a)).toFixed(4)); }
    txt(N.vals.hue, String(Math.round(T.hue))); txt(N.vals.lit, String(Math.round(T.lit))); txt(N.vals.h1, T.h1.toFixed(2)); txt(N.vals.r, String(Math.round(T.r)));
    N.acc.forEach(n => txt(n, d.acc)); txt(N.accQ, `"${d.acc}"`);
    txt(N.h1, T.h1.toFixed(2) + 'rem'); txt(N.h1Q, `"${T.h1.toFixed(2)}rem"`);
    txt(N.r, Math.round(T.r) + 'px'); txt(N.rQ, `"${Math.round(T.r)}px"`); txt(N.rn, d.rn + 'px'); txt(N.rnQ, `"${d.rn}px"`);
    const okC = d.cr >= AA_LARGE, okS = !d.problems.includes('scale');
    txt(N.ratio, d.cr.toFixed(1) + ':1'); txt(N.aa, okC ? '✓' : '✕'); N.aa.className = 'v-aa ' + (okC ? 'ok' : 'bad');
    txt(N.ckC, `accent on card ${d.cr.toFixed(1)}:1 ${okC ? '≥' : '<'} 3:1 (AA large)`);
    txt(N.ckS, `H1 ${T.h1.toFixed(2)}rem ${okS ? 'is within' : 'is outside'} 2.4–4.0rem`);
    N.ck.contrast.classList.toggle('bad', !okC); N.ck.contrast.classList.toggle('ok', okC);
    N.ck.scale.classList.toggle('bad', !okS); N.ck.scale.classList.toggle('ok', okS);
    const n = d.problems.length; txt(N.count, n ? `${n} problem${n > 1 ? 's' : ''}` : '0 problems');
    cs.classList.toggle('has-problems', n > 0);
    cs.classList.toggle('bad-contrast', !okC); cs.classList.toggle('bad-scale', !okS);
    const [a, b] = RANGE.h1; N.scDot.style.left = ((T.h1 - a) / (b - a) * 100).toFixed(2) + '%';
  };
  const set = (k, v) => { const [a, b] = RANGE[k]; const nv = clamp(v, a, b); if (nv !== T[k]) { T[k] = nv; dirty = true; } };
  api.frame(render);                               // one render per frame, whoever changed the state
  const room = r => { if (cs.dataset.room === r) return; cs.dataset.room = r; qq('.cs-rooms span').forEach(s => s.classList.toggle('on', s.dataset.r === r)); };
  room('stage'); qq('.cs-rooms span')[0].classList.add('on');
  const flash = sel => { const n = q(sel); if (!n) return; n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); };

  /* ---------- the reader ---------- */
  const A = { until: 0, saw: false, moves: 0 };
  const freezeCursor = () => {          // stop the agent's hand where it actually is
    const m = new DOMMatrixReadOnly(getComputedStyle(D.cur).transform);
    D.cur.style.transitionDuration = '0ms'; D.cur.style.transform = `translate(${m.e}px, ${m.f}px)`; D.cx = m.e; D.cy = m.f;
    D.cur.classList.remove('down');
  };
  const reader = () => {                // the reader touched the artifact: the agent lets go now
    A.until = S.t + 1.6; A.saw = true; A.moves++;
    if (A.agentBusy) { api.restart(); A.agentBusy = false; }
    freezeCursor(); D.cur.classList.add('yield'); say('watching');
    qq('.cs-fader.agent-on').forEach(f => f.classList.remove('agent-on'));
  };
  let grab = null;
  api.drag('.cs-fader[data-k]', {
    start: (e, f) => { reader(); const r = f.getBoundingClientRect(); grab = { f, k: f.dataset.k, left: r.left, w: r.width }; f.classList.add('on'); move(e); },
    move: (dx, dy, e) => move(e),
  });
  const move = e => { if (!grab) return; A.until = S.t + 1.6; const [a, b] = RANGE[grab.k]; set(grab.k, a + (b - a) * clamp((e.clientX - grab.left) / grab.w, 0, 1)); };
  api.world.addEventListener('pointerup', () => { if (grab) { grab.f.classList.remove('on'); grab = null; } });
  api.act('cs-room', s => { reader(); room(s.dataset.r); return 'go'; });

  /* ---------- the live card ---------- */
  let tick = 0;
  api.frame((dt, t) => {
    tick += dt; if (tick < 1.4) return; tick = 0;
    const now = Math.round(84 + Math.sin(t * 0.7) * 2 + (Math.random() - 0.5) * 2);
    txt(N.now, String(now)); N.nowbar.style.transform = `scaleX(${(now / 100).toFixed(3)})`;
  });

  /* ---------- the agent's hands: precise, frame-driven, abortable ---------- */
  const tween = (k, to, ms) => new Promise((res, rej) => {
    const g = S.gen, f = N.faders[k], [a, b] = RANGE[k], from = T[k];
    const p0 = D.at(f, 0, 0.5), p1 = D.at(f, 1, 0.5);        // measured once; the frames do no layout
    f.classList.add('agent-on'); D.cur.classList.add('down'); D.cur.style.transitionDuration = '0ms';
    let t = 0;
    const stop = api.frame(dt => {
      if (S.gen !== g) { stop(); f.classList.remove('agent-on'); rej(ABORT); return; }
      t = Math.min(1, t + dt * 1000 / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, v = from + (to - from) * e;
      set(k, v); render();                                    // the knob moves in the same frame as the hand
      const u =(T[k] - a) / (b - a), x = p0[0] + (p1[0] - p0[0]) * u, y = p0[1];
      D.cur.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; D.cx = x; D.cy = y;
      if (t >= 1) { stop(); f.classList.remove('agent-on'); D.cur.classList.remove('down'); res(); }
    });
  });
  const slide = async (k, to, ms) => {
    const f = N.faders[k], [a, b] = RANGE[k];
    to = clamp(to, a, b);
    await D.move(f, { ax: (T[k] - a) / (b - a) });           // to the knob, where it is now
    await api.wait(120);
    await tween(k, to, ms || clamp(Math.abs(to - T[k]) / (b - a) * 2600, 500, 1500));
    await api.wait(260);
  };
  const go = async r => { if (cs.dataset.room !== r) { await D.click(q(`.cs-rooms [data-r="${r}"]`)); room(r); await api.wait(450); } };
  const look = async (sel, ms = 1300) => { const n = q(sel); if (!n) return; await D.move(n, { ax: 0.35 }); flash(sel); await api.wait(ms); };
  const pick = (list, cur, tol) => { const c = list.filter(v => Math.abs(v - cur) > tol); return c[Math.floor(Math.random() * c.length)] ?? list[0]; };

  /* ---------- the agent's mind: plan from what is true now ---------- */
  const fix = {
    async contrast() {
      say('fixing contrast'); await go('stage');
      let L = T.lit; while (L < RANGE.lit[1] && ratio(hsl2hex(T.hue, 80, L), CARD) < AA_LARGE + 0.25) L += 1;   // the nearest lightness that passes, with margin
      await slide('lit', L + 2);
      say('contrast passes'); await go('tokens'); await look('.cs-aa.hot', 1500);
    },
    async scale() {
      say('back on the scale'); await go('stage');
      await slide('h1', clamp(T.h1, SCALE[0] + 0.15, SCALE[1] - 0.15));
      say('H1 on scale'); await go('system'); await look('.cs-ck[data-c="scale"]', 1400);
    },
  };
  const DEMOS = [
    async () => { say('tuning H1'); await go('stage'); await slide('h1', pick([2.7, 3.0, 3.35, 3.7], T.h1, 0.2)); },
    async () => { say('new accent'); await go('stage'); await slide('hue', pick([200, 272, 330, 20, 150], T.hue, 40)); },
    async () => { say('checking tokens'); await go('tokens'); await look('.cs-sw.hot', 1100); await look('.cs-aa.hot', 1300); },
    async () => { say('shell radius'); await go('stage'); await slide('r', pick([8, 16, 24, 30], T.r, 5)); },
    async () => { say('testing a darker accent'); await go('stage'); await slide('lit', 34, 1300); await api.wait(700); },   // breaks contrast on purpose; the checks catch it, the plan fixes it
    async () => { say('reading the checks'); await go('system'); await look('.cs-code pre', 1100); await look('.cs-ck[data-c="contrast"]', 1300); },
  ];
  let next = 0, opened = false, placedAt = 0;
  // phones: the cursor is on the stage's card from the first frame (placed once the layout exists), the camera on it
  let placed = false;
  const placeAtStart = () => { if (!S.mobile || opened) return; D.place(q('.cs-card'), 0.5, 0.4); if (!placed) { placed = true; placedAt = S.t; } };
  api.resize(() => { if (opened && D.hold) requestAnimationFrame(() => { opened = false; placeAtStart(); opened = true; }); });
  api.flow(async () => {
    // on phones the first thing seen is the cursor on the stage's card, for 1.7 s, then it goes to the tuning panel
    if (!opened && S.mobile) {
      for (let i = 0; i < 60 && getComputedStyle(q('.cs')).position !== 'absolute'; i++) await api.wait(50);   // the stage's stylesheet is in: the card is where it will be
      await document.fonts.ready; placeAtStart(); opened = true; const held = S.t - placedAt; if (held < 1.7) await api.wait((1.7 - held) * 1000); D.hold = false; }
    if (S.t < A.until) { await api.wait(150); return; }                     // the reader is working: wait
    if (A.saw) {                                                            // pick up from what the reader did
      A.saw = false; D.cur.classList.remove('yield');
      const d = derive(); say(d.problems.length ? 'sees a problem' : 'sees your change');
      await api.wait(900);
    }
    A.agentBusy = true;
    const d = derive();
    if (d.problems.length) await fix[d.problems[0]]();
    else { await DEMOS[next % DEMOS.length](); next++; }
    A.agentBusy = false; say('');
    await api.wait(500);
  });
  render();
}
