/* LANDR Mastering Revisions: plain questions instead of knobs.
   The film: a Pro opens a mastered track's revision → the intro → the Master revision modal. Each plain answer
   (Too loud, Distortion filter, EQ too high, Boomy lows) reshapes the master live over a ghost of the original,
   then "Revise master" adds the revised file to the library. The reader can answer the questions too. */
import { $, $$, desk } from './core.js';
import { shell, row, tag, IC, bars } from './landr.js';

const N = 96, BASE = bars(N, 21);
const Q = [
  { k: 'loud', q: 'How is the Loudness?', o: ['Too quiet', 'Good', 'Too loud'] },
  { k: 'dist', q: 'Do you want to enable the Distortion filter?', toggle: true },
  { k: 'eq', q: 'How is the EQ intensity?', o: ['Too low', 'Good', 'Too high'] },
  { k: 'low', q: 'Adjust the EQ', sub: 'The lows are:', o: ['Good', 'Boomy', 'Thin'] },
];
const chip = (k, o, i) => `<span class="rv-chip" data-act="rv" data-k="${k}" data-v="${i}">${o}</span>`;
const MODALS = `
  <div class="rv-dim"></div>
  <div class="rv-tip">Revision</div>
  <div class="rv-intro"><span class="rv-x">${IC.x}</span><em class="rv-newtag">New</em><h3>Mastering Revisions</h3>
    <p>Drill down into the nitty gritty details of your master with Revisions. Fine-tune EQ, adjust loudness, control sibilance, shape the stereo field, and refine your sound for the perfect final master.</p>
    <span class="rv-blue">Revise master</span><a>Learn more</a></div>
  <div class="rv-modal">
    <div class="rv-mh"><b>Master revision</b><span>${IC.x}</span></div>
    <div class="rv-body"><p class="rv-lead">Tweak or refine your sound for the perfect final master.</p>
      ${Q.map(q => `<div class="rv-q" data-k="${q.k}"><b>${q.q} ${IC.info}</b>${q.sub ? `<span class="rv-sub">${q.sub}</span>` : ''}
        ${q.toggle ? `<div class="rv-tg">No <i class="rv-sw" data-act="rv" data-k="dist" data-v="t"></i> Yes</div>` : `<div class="rv-chips">${q.o.map((o, i) => chip(q.k, o, i)).join('')}</div>`}</div>`).join('')}
    </div>
    <div class="rv-fb"></div>
    <div class="rv-player"><span class="rv-pp">${IC.pause}</span>
      <div class="rv-wave"><div class="rv-ghost">${BASE.map(v => `<i style="--v:${v.toFixed(3)}"></i>`).join('')}</div><div class="rv-live">${BASE.map(v => `<i style="--v:${v.toFixed(3)}"></i>`).join('')}</div></div>
      <span class="rv-time">0:47</span><span class="rv-go">Revise master</span></div>
  </div>`;

export function mount(api) {
  const rows = row({ name: 'Arch Delaro - Ideological Prowler MASTER', tags: `${tag('REVISED')} WAV · Too loud · EQ high`, when: 'Just now', s: 21, cls: 'rv-new' })
    + row({ name: 'Arch Delaro - Ideological Prowler MASTER', tags: `${tag('ORIGINAL')} WAV`, when: '2 hours ago', s: 3 })
    + row({ name: 'Arch Delaro - Ideological Prowler MASTER', tags: `${tag('PREVIEW READY')} WAV`, when: '19 hours ago', s: 4 })
    + row({ name: 'Arch Delaro - Ideological Prowler', tags: 'WAV · Balanced · Medium · ' + tag('MASTER'), when: 'Dec 10, 2024', s: 21, cls: 'rv-target' })
    + row({ name: 'Arch Delaro - Ideological Prowler', tags: `${tag('PREVIEW READY')} WAV`, when: 'Dec 10, 2024', s: 8 });
  const D = desk(api, { w: 1280, minScale: 0.5, html: shell(rows, MODALS) });
  const ui = D.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  const live = qq('.rv-live i');
  const st = { loud: 1, dist: false, eq: 1, low: 0 };

  // the master answers: every choice reshapes the live waveform over the ghost of the original
  const render = () => {
    const g = [1.16, 1, 0.78][st.loud];
    live.forEach((b, i) => {
      let v = BASE[i] * g;
      if (st.dist && v > 0.62) v = 0.62 + (v - 0.62) * 0.35;                       // the filter tames the clipped peaks
      const mean = 0.55; v = mean + (v - mean) * [1.25, 1, 0.7][st.eq];              // EQ intensity: contrast between bars
      if (i < N * 0.3) v *= [1, 0.82, 1.14][st.low];                                // the lows (the intro's weight)
      b.style.setProperty('--s', Math.max(0.06, Math.min(1, v) / BASE[i]).toFixed(3));
    });
    qq('.rv-chip').forEach(c => c.classList.toggle('on', +c.dataset.v === st[c.dataset.k]));
    q('.rv-sw').classList.toggle('on', st.dist);
    ui.classList.toggle('rv-changed', st.loud !== 1 || st.dist || st.eq !== 1 || st.low !== 0);
  };
  const FB = { loud: ['Louder', 'As mastered', 'Quieter, more headroom'], dist: 'Peaks tamed', eq: ['More contrast', 'As mastered', 'Smoother EQ'], low: ['Lows as mastered', 'Tighter lows', 'Fuller lows'] };
  let fbT = 0;
  const feedback = (k, v) => { const f = q('.rv-fb'); f.textContent = k === 'dist' ? (st.dist ? FB.dist : 'Filter off') : FB[k][v]; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); clearTimeout(fbT); fbT = setTimeout(() => f.classList.remove('on'), 1600); };
  api.act('rv', c => { const k = c.dataset.k; if (k === 'dist') st.dist = !st.dist; else st[k] = +c.dataset.v; render(); feedback(k, st[k]); });

  // the player: a playhead sweeping the master, the clock counting
  let t0 = 0;
  api.frame((dt, t) => {
    if (!ui.classList.contains('rv-open')) return;
    const p = ((t - t0) / 14) % 1;
    q('.rv-wave').style.setProperty('--p', p.toFixed(4));
    const s = 47 + Math.floor(p * 14); q('.rv-time').textContent = `0:${String(s).padStart(2, '0')}`;
  });

  const reset = () => {
    ui.className = 'dsk-ui no-anim'; Object.assign(st, { loud: 1, dist: false, eq: 1, low: 0 }); render();
    requestAnimationFrame(() => requestAnimationFrame(() => ui.classList.remove('no-anim')));
  };
  const answer = async (k, v) => { const c = k === 'dist' ? q('.rv-sw') : q(`.rv-chip[data-k="${k}"][data-v="${v}"]`); await D.click(c); if (k === 'dist') st.dist = true; else st[k] = v; render(); feedback(k, v); await api.wait(1300); };

  api.flow(async () => {
    reset();
    await api.wait(900);
    const target = q('.rv-target');
    await D.move(target, { ax: 0.4 });
    target.classList.add('hover'); await api.wait(500);
    const rev = $(target, '.ld-rev'); await D.move(rev);
    rev.classList.add('hover'); ui.classList.add('rv-tipon');
    const [x, y] = D.at(rev, 0.5, 0); q('.rv-tip').style.transform = `translate(${x}px, ${y}px)`; await api.wait(900);
    await D.click(rev); ui.classList.remove('rv-tipon'); target.classList.remove('hover'); rev.classList.remove('hover');
    ui.classList.add('rv-introon'); D.look(q('.rv-intro')); await api.wait(1500);
    await D.click(q('.rv-blue'));
    ui.classList.remove('rv-introon'); ui.classList.add('rv-open'); t0 = api.S.t; D.look(q('.rv-modal')); await api.wait(1200);
    await answer('loud', 2);
    await answer('dist');
    await answer('eq', 2);
    await answer('low', 1);
    await api.wait(900);
    await D.click(q('.rv-go')); q('.rv-go').classList.add('busy'); await api.wait(1400);
    ui.classList.remove('rv-open'); ui.classList.add('rv-saved'); D.look([640, 260]); q('.rv-go').classList.remove('busy');
    await D.move(q('.rv-new'), { ax: 0.3 }); await api.wait(2600);
  });
}
