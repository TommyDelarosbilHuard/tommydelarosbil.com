/* LANDR web app, rebuilt: the Library shell both LANDR stages share (Waitzine, Mastering Revisions). */
import { css } from './core.js';
css('landr');

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
/* a waveform as bars: deterministic, shaped like a song (intro, build, drop, outro) */
export function bars(n = 64, s = 3) {
  seed = s * 7919 + 1; const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), env = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.6;
    out.push(Math.max(0.08, env * (0.45 + 0.55 * rnd())));
  }
  return out;
}
export const wave = (vals, { w = 150, h = 22, gap = 1, cls = '' } = {}) => {
  const bw = (w - gap * (vals.length - 1)) / vals.length;
  return `<svg class="ld-wave ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${vals.map((v, i) => `<rect x="${(i * (bw + gap)).toFixed(2)}" y="${((h - v * h) / 2).toFixed(2)}" width="${bw.toFixed(2)}" height="${(v * h).toFixed(2)}" rx="${Math.min(1, bw / 2)}"/>`).join('')}</svg>`;
};
export const IC = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 7l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  plug: '<svg viewBox="0 0 24 24"><path d="M8 4v5M16 4v5M6 9h12v3a6 6 0 0 1-12 0zM12 18v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M5 6h14v9H10l-4 3v-3H5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M10 17V6l9-2v11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7.5" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16.5" cy="15" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><path d="M6 18V10M10 18V6M14 18v-5M18 18V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  revise: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M17.5 3.5v4h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v10M7.5 10.5L12 15l4.5-4.5M6 19h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M13 6l6 5.5-6 5.5v-3.5c-4 0-6.5 1.2-8 4 .5-5 3-8 8-8.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h13M13 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 11v5M12 8v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
};
const logo = '<svg class="ld-logo-mark" viewBox="0 0 32 32"><circle cx="13" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="19" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

export const row = ({ name, tags = '', when = '2 hours ago', dur = '4:10', s = 3, cls = '', revise = true }) => `
  <div class="ld-row ${cls}"><i class="ld-cb"></i><span class="ld-file">${IC.note}</span>
    <div class="ld-nm"><b>${name}</b><span>${tags}</span></div>
    ${wave(bars(56, s), { w: 150, h: 20 })}<span class="ld-dur">${dur}</span><span class="ld-when">${when}</span>
    <span class="ld-acts">${IC.stats}${revise ? `<span class="ld-rev">${IC.revise}</span>` : '<span></span>'}${IC.down}${IC.share}${IC.dots}</span></div>`;
export const tag = t => `<em class="ld-tag">${t}</em>`;

export const shell = (rows, extra = '') => `
<div class="ld">
  <header class="ld-top"><span class="ld-logo">${logo}<b>LANDR</b></span>
    <nav><span>Samples</span><span>Plugins</span><span>Collaboration</span><span class="on">Mastering</span><span>Distribution</span><span>Courses</span><span>Pricing</span></nav>
    <span class="ld-ics">${IC.search}${IC.plug}${IC.chat}${IC.mail}${IC.bell}<em>T</em></span></header>
  <main class="ld-main">
    <div class="ld-head"><h1>Library</h1><span class="ld-search">${IC.search}<em>Search by name, ISRC or UPC</em></span><span class="ld-new">+ New</span><span class="ld-gear">${IC.gear}</span></div>
    <div class="ld-filters"><span class="ld-pill">All files ⌄</span><span class="ld-compact">Compact view <i></i></span><span class="ld-crown"><svg viewBox="0 0 24 24"><path d="M4 8l4 4 4-6 4 6 4-4-2 10H6z" fill="#E8B931"/></svg>Get unlimited masters</span></div>
    <div class="ld-th"><span></span><span>Name ⇅</span><span></span><span></span><span>Created ↓</span><span>Channels</span></div>
    <div class="ld-rows">${rows}</div>
  </main>
  ${extra}
</div>`;
