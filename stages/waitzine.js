/* LANDR Waitzine: the wait became the product.
   Before: an upload opens the old wait, a circle crawling at 8%, "Detecting genre…", and the cursor drifts to ✕.
   After: the same wait becomes a magazine. A five-stage header says what mastering is doing while pages show
   the rest of LANDR (courses, distribution, samples, plugins). At 100% the preview plays.
   The reader can page through the magazine (arrow, dots). */
import { el, $, $$, desk, clamp } from './core.js';
import { shell, row, tag, IC, wave, bars } from './landr.js';

const STAGES = [['Detecting genre', 18], ['Analyzing dynamics', 41], ['Shaping the EQ', 66], ['Balancing loudness', 89], ['Preparing your preview', 100]];
const PAGES = [
  { k: 'course', t: 'How to Use LANDR Mastering Plugin', p: 'Learn how to get the perfect master with LANDR Mastering Plugin with audio engineer, producer and YouTube star Devvon Terrell.', c: 'Access course', chip: 'Mastering' },
  { k: 'dist', t: 'Release your music everywhere', p: 'Put this master on Spotify, Apple Music, TikTok and 150+ platforms, and keep 100% of your rights.', c: 'Start a release', chip: 'Distribution' },
  { k: 'samples', t: 'Find the sound that&rsquo;s missing', p: 'Millions of royalty-free samples, loops and presets, picked by producers for your genre.', c: 'Browse samples', chip: 'Samples' },
  { k: 'plugins', t: 'Finish the track in your DAW', p: 'Synths, effects and instruments built for the session you&rsquo;re in, with LANDR quality.', c: 'Explore plugins', chip: 'Plugins' },
];
const visual = k => k === 'course' ? `<div class="wz-v course">${wave(bars(40, 9), { w: 300, h: 150, gap: 3, cls: 'big' })}<img class="wz-av" src="img/landr-avatar.jpg" alt=""></div>`
  : k === 'dist' ? `<div class="wz-v dist">${['#F2545B,#7A2BB5', '#35C2C6,#1B4F9C', '#F5B53F,#E3502C', '#9AE36B,#16856D', '#C8A2F7,#5B3FD1'].map((g, i) => `<i style="--g:linear-gradient(140deg,${g});--i:${i}"></i>`).join('')}</div>`
  : k === 'samples' ? `<div class="wz-v samples">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`
  : `<div class="wz-v plugins"><i class="knob a"></i><i class="knob b"></i><i class="knob c"></i><span class="meter">${'<b></b>'.repeat(14)}</span></div>`;

const MODALS = `
  <div class="wz-dim"></div>
  <div class="wz-old"><span class="wz-x">${IC.x}</span><div class="wz-ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" class="trk"/><circle cx="100" cy="100" r="96" class="arc"/></svg>
    <em>Preparing Master Preview</em><b><span class="wz-pc">1</span>%</b><span class="wz-txt">Detecting genre<i>…</i></span><small>Arch Delaro - Prowler.wav</small></div></div>
  <div class="wz-card">
    <div class="wz-head"><i class="wz-spin"></i><div><b><span class="wz-pc2">8</span>%&nbsp;&nbsp;<span class="wz-stage">Detecting genre</span></b><span>Arch Dela [...] | Prowler</span></div><span class="wz-more">${IC.dots}</span>
      <span class="wz-play" data-act="wz-play">${IC.play}</span>
      <div class="wz-steps">${STAGES.map(() => '<i><b></b></i>').join('')}</div></div>
    <div class="wz-pages">${PAGES.map((pg, i) => `<article class="wz-page ${pg.k}" data-i="${i}">${visual(pg.k)}<h3>${pg.t}</h3><p>${pg.p}</p><span class="wz-cta">${pg.c}</span></article>`).join('')}</div>
    <div class="wz-foot"><span class="wz-dots">${PAGES.map((_, i) => `<i data-act="wz-dot" data-i="${i}"></i>`).join('')}</span><span class="wz-chip"><svg viewBox="0 0 32 32"><circle cx="13" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><b>Mastering</b></span></div>
    <span class="wz-next" data-act="wz-next">${IC.arrow}</span>
  </div>
  <aside class="ld-proc"><div class="ld-ph"><b>Processing (1)</b><span>Clear all ⌄</span></div><div class="ld-pi"><i class="wz-spin"></i><div><b>Arch Delaro - Prowler</b><span class="wz-pstate">Preparing preview…</span></div></div></aside>`;

export function mount(api) {
  const { world, S } = api;
  const rows = row({ name: 'Arch Delaro - Prowler', tags: `${tag('ORIGINAL')} WAV`, when: 'Just now', s: 5, cls: 'wz-new' })
    + row({ name: 'Arch Delaro - Ideological Prowler MASTER', tags: `${tag('ORIGINAL')} WAV`, when: '2 hours ago', s: 3 })
    + row({ name: 'Arch Delaro - Ideological Prowler MASTER', tags: `${tag('PREVIEW READY')} WAV`, when: '19 hours ago', s: 4 })
    + row({ name: 'Arch Delaro - Ideological Prowler', tags: 'WAV · Balanced · Medium · ' + tag('MASTER'), when: 'Dec 10, 2024', s: 6 })
    + row({ name: 'Arch Delaro - Ideological Prowler', tags: `${tag('PREVIEW READY')} WAV`, when: 'Dec 10, 2024', s: 8 });
  world.innerHTML = `<span class="wz-era rise"><i></i><b class="b">Before</b><b class="a">After</b></span>`;
  const D = desk(api, { w: 1280, minScale: 0.5, html: shell(rows, MODALS) });
  const ui = D.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  const pages = qq('.wz-page'), dots = qq('.wz-dots i');
  let page = 0, pct = 0;

  const show = i => { page = (i + PAGES.length) % PAGES.length; pages.forEach((p, k) => p.style.setProperty('--o', k - page)); dots.forEach((d, k) => d.classList.toggle('on', k === page)); q('.wz-chip b').innerHTML = PAGES[page].chip; };
  const setPct = v => {
    pct = v; const s = STAGES.findIndex(st => v <= st[1]), st = STAGES[Math.max(0, s)];
    q('.wz-pc').textContent = Math.round(v); q('.wz-pc2').textContent = Math.round(v);
    q('.wz-ring .arc').style.strokeDashoffset = (603 * (1 - v / 100)).toFixed(1);
    if (q('.wz-stage').textContent !== st[0]) { q('.wz-stage').textContent = st[0]; q('.wz-head b').animate([{ opacity: 0.2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }); }
    qq('.wz-steps i').forEach((seg, k) => { const lo = k ? STAGES[k - 1][1] : 0, hi = STAGES[k][1]; seg.style.setProperty('--f', clamp((v - lo) / (hi - lo), 0, 1).toFixed(3)); });
  };
  api.act('wz-next', () => show(page + 1));
  api.act('wz-dot', d => show(+d.dataset.i));
  api.act('wz-play', () => { ui.classList.add('wz-playing'); return 'go'; });

  const era = $(world, '.wz-era');
  const reset = () => {
    ui.classList.add('no-anim'); ui.className = 'dsk-ui no-anim';
    show(0); setPct(1);
    requestAnimationFrame(() => requestAnimationFrame(() => ui.classList.remove('no-anim')));
    era.classList.remove('after');
  };
  const crawl = async (to, ms) => { const from = pct, n = Math.max(1, Math.round(ms / 90)); for (let i = 1; i <= n; i++) { setPct(from + (to - from) * i / n); await api.wait(ms / n); } };

  api.flow(async () => {
    reset();
    await api.wait(900);
    await D.click(q('.ld-new'));
    ui.classList.add('wz-up'); await api.wait(500);           // the upload lands in the library
    ui.classList.add('wz-wait'); await api.wait(600);          // and the old wait opens
    D.look(q('.wz-ring'));
    await D.move(q('.wz-ring'), { ay: 0.3 });
    await crawl(8, 4200);                                      // a circle crawling to 8%
    await D.move(q('.wz-x'), { dur: 1400 });                   // the cursor drifts to ✕
    q('.wz-x').classList.add('hover'); await api.wait(1100); q('.wz-x').classList.remove('hover');
    era.classList.add('after');
    ui.classList.add('wz-zine'); await api.wait(900);          // the same wait, as a magazine
    D.look(q('.wz-card'));
    await D.move(q('.wz-page .wz-cta'), { dur: 900 });
    await crawl(26, 2800);
    await D.click(q('.wz-next')); show(1);
    await crawl(52, 3000);
    await D.move(q('.wz-page.dist .wz-v'), { dur: 900 });
    await crawl(70, 2200);
    await D.click(q('.wz-next')); show(2);
    await crawl(93, 3000);
    show(3); await crawl(100, 1600);
    ui.classList.add('wz-ready'); await api.wait(700);
    await D.click(q('.wz-play')); ui.classList.add('wz-playing'); await api.wait(1500);
    ui.classList.remove('wz-wait', 'wz-zine'); ui.classList.add('wz-done'); D.look([700, 300]); await api.wait(2600);
  });
}
