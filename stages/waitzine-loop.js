/* LANDR Waitzine, as a 32 s loop on the landing screenshot (2026-10-18).
   The master preview is being prepared while the person pages through the Waitzine with its arrow: three production tips
   (one they learn from, one they already knew, one they'll try), each read before they react (the cursor follows the
   lines), then back to the course on the first dot. Meanwhile the header walks through its stages to 100%: the banner
   turns cyan, "Listen" replaces its menu, and the preview is ready sooner than they thought. Their thoughts, in green.
   At its end the card is the screenshot again (the banner turns back to white at 8%: a new track).
   The three tip pages are illustrative, written for this loop (the deck shows only the course page). "Detecting genre",
   "Finalizing details" (the case) and "Preview ready" (the library's tag) are LANDR's words; the three stages between are placeholders. */
import { loop, path, step, crossed } from './loop.js';

const LENGTH = 32.2;

export const SRC = 'img/landr-wait-course.jpg';
export const CARD = { x: 782, y: 285, w: 438, h: 651 };          // the page area of the card, from the header to just above the Mastering chip (937)
// the pass: the arrow turns a page (SLIDE s); the page is read for 2.5 s, the thought shows for 3 s, the arrow again
// The course page stays 3 s before the first turn, so the reader gets what they're looking at (Tommy, 2026-10-18).
const SLIDE = 0.65, TURNS = [3.2, 9.5, 15.8], LAND = TURNS.map(c => c + 0.05 + SLIDE), BACK = 22.4;   // BACK: the first dot
const READY = 27.1, AGAIN = 30.8;                       // the preview is ready; the banner turns back (a new track)
// progress, perception first: [loop time, %]; stage names by the % they end at
const PROGRESS = [[0, 8], [5, 18], [12, 41], [18, 66], [23.7, 89], [READY, 100]];
const STAGES = [['Detecting genre', 18], ['Analyzing dynamics', 41], ['Shaping the EQ', 66], ['Balancing loudness', 89], ['Finalizing details', 100]];
export const PAGES = [
  { title: ['Leave headroom', 'before you master'], text: ['Export your mix with peaks', 'around −6 dB and no limiter on', 'the master bus. Mastering needs', 'room to do its job.'], cta: 'Read the tip', art: 'headroom' },
  { title: ['Check your low', 'end in mono'], text: ['Kick and bass belong in the', 'center. If they vanish in mono,', 'they’ll vanish on phones and', 'club speakers too.'], cta: 'Read the tip', art: 'mono' },
  { title: ['Compare with a', 'song you love'], text: ['Pick a released song in your', 'genre, match the volume, and', 'switch between the two. It keeps', 'your ears honest.'], cta: 'Read the tip', art: 'reference' },
];
const ARROW = [1231, 649], DOT1 = [849, 962], CTA = [968, 698], LISTEN = [1188, 254], REST = [1010, 330];
const CLICKS = [...TURNS, BACK];
// reading (2026-10-19, Tommy: once, more slowly, not every line): on the first tip the cursor follows the title's first
// line and the paragraph's first line, slowly; on the other tips it rests by the arrow while they read
const read = (L, i) => i ? [[L, ...ARROW], [L + 3.3, ...ARROW]]
  : [[L, ...ARROW], [L + 0.45, 836, 497], [L + 1.45, 1035, 497], [L + 1.7, 836, 583], [L + 2.7, 1110, 583], [L + 3.5, ...ARROW]];
// [from, to, thought, image px lower when it reads to the left (under the arrow it clears the page's button)]; 3 s each
const THOUGHTS = [
  [LAND[0] + 2.5, LAND[0] + 5.5, 'Oh! So that’s why my tracks distort.', 80],
  [LAND[1] + 2.5, LAND[1] + 5.5, 'Mono check? I already do that.', 80],
  [LAND[2] + 2.5, LAND[2] + 5.5, 'Compare with a song I love. Smart!', 80],
  [READY - 3, READY, 'A course with Devvon? Saving it.', 0],
  [AGAIN - 3, AGAIN, 'Already? Nice!', 0],
];

// The tip pages keep the course page's rhythm: title, text and button in the same places, and in the band above the title
// a crisp diagram that teaches the tip at a glance, over a soft glow (the course page's waveform does the same).
// Page px: 438 × 655. One padding all round (Tommy, 2026-10-18): the text's left margin, 49 px, also sets the diagram's top
// and right edges and the gap down to the title, so on these pages the text sits DY lower than on the course page.
const L = 49, R = 438 - 49, T = 49, B = 131, DY = Math.round(B + L - (177 - 31 * 0.708));   // 177: the title's baseline, 31 px type
// a waveform's bar heights (0…1): a song's shape with a fixed texture
const wave = (n, seed) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return (0.42 + 0.58 * Math.sin(Math.PI * Math.min(1, t * 1.06)) ** 0.8) * (0.6 + 0.4 * Math.abs(Math.sin(seed * (i + 1) * 12.9898) % 1)); });
// a sector of the stereo field, from a to b degrees (0 = right, clockwise; 270 = straight up)
const sector = (cx, cy, r, a, b) => { const p = d => `${(cx + r * Math.cos(d * Math.PI / 180)).toFixed(2)} ${(cy + r * Math.sin(d * Math.PI / 180)).toFixed(2)}`; return `M${cx} ${cy}L${p(a)}A${r} ${r} 0 0 1 ${p(b)}Z`; };
const glow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#35C2C6" opacity=".16" filter="url(#lp-haze)"/>`;
const CAP = 7.6;   // cap height of the 10.5 px labels: a label's top sits at its baseline − CAP
const ART = {
  // the mix peaks under −6 dB: the band up to 0 dB is the headroom
  headroom: () => {
    const six = T + 22, bars = wave(29, 3).map((v, i) => `<rect x="${(L + i * 9.8).toFixed(1)}" y="${(B - v * 56).toFixed(1)}" width="4.6" height="${(v * 56).toFixed(1)}" rx="2.3"/>`).join('');
    return `${glow(200, 104, 170, 36)}<rect x="${L}" y="${T}" width="${R - L}" height="${six - T}" fill="#35C2C6" opacity=".09"/>
      <line x1="${L}" x2="${R}" y1="${T}" y2="${T}" stroke="#fff" stroke-opacity=".28"/><line x1="${L}" x2="${R}" y1="${six}" y2="${six}" stroke="#35C2C6" stroke-width="1.4" stroke-dasharray="4 4"/>
      <text class="lp-art-t" x="190" y="${T + 11 + CAP / 2}" text-anchor="middle">HEADROOM</text>
      <text class="lp-art-n" x="${R}" y="${T + 11 + CAP / 2}" text-anchor="end" fill-opacity=".55">0 dB</text><text class="lp-art-n teal" x="${R}" y="${six + 15}" text-anchor="end">−6 dB</text>
      <g fill="#35C2C6" opacity=".5" filter="url(#lp-soft)">${bars}</g><g fill="url(#lp-bar)">${bars}</g>`;
  },
  // the stereo field from above: kick and bass in a narrow centre, the rest spread wide
  mono: () => {
    const cx = 219, cy = B, r = B - T;
    return `${glow(cx, cy - 34, 140, 42)}${[r / 3, (2 * r) / 3, r].map((k, i) => `<path d="M${cx - k} ${cy}A${k} ${k} 0 0 1 ${cx + k} ${cy}" fill="none" stroke="#fff" stroke-opacity="${i === 2 ? 0.24 : 0.12}"/>`).join('')}
      <line x1="${cx - r - 4}" x2="${cx + r + 4}" y1="${cy}" y2="${cy}" stroke="#fff" stroke-opacity=".14"/>
      <path d="${sector(cx, cy, r, 206, 334)}" fill="#fff" opacity=".06"/>
      <path d="${sector(cx, cy, r, 261, 279)}" fill="#35C2C6" opacity=".6" filter="url(#lp-soft)"/><path d="${sector(cx, cy, r, 262, 278)}" fill="url(#lp-bar)"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="#fff"/>
      <text class="lp-art-t" x="${cx + 18}" y="${T + 20}">KICK · BASS</text>
      <text class="lp-art-t dim" x="${cx - r * 0.74}" y="${cy - r * 0.44}" text-anchor="end">PADS</text><text class="lp-art-t dim" x="${cx + r * 0.74}" y="${cy - r * 0.44}">FX</text>
      <text class="lp-art-n" x="${cx - r - 10}" y="${cy}" text-anchor="end" fill-opacity=".55">L</text><text class="lp-art-n" x="${cx + r + 10}" y="${cy}" fill-opacity=".55">R</text>`;
  },
  // A/B: your mix and a reference, the same moment, one click apart
  reference: () => {
    const x0 = 88, a = T + CAP + 18, b = B - 12;   // the two lanes' centres
    const lane = (cy, seed, on, off) => wave(31, seed).map((v, i) => { const x = x0 + i * 9.8, h = Math.max(3, v * 24); return `<rect x="${x.toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="4.4" height="${h.toFixed(1)}" rx="2.2" fill="${x < 270 ? on : off}"/>`; }).join('');
    return `${glow(230, 100, 160, 34)}<text class="lp-art-t dim" x="${x0}" y="${T + CAP}">YOUR MIX</text>${lane(a, 5, 'rgba(255,255,255,.8)', 'rgba(255,255,255,.28)')}
      <text class="lp-art-t" x="${x0}" y="${b - 18}">REFERENCE</text>${lane(b, 3, '#35C2C6', 'rgba(53,194,198,.4)')}
      <circle cx="${L + 11}" cy="${a}" r="11" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/><text class="lp-ab" x="${L + 11}" y="${a + 4.5}" text-anchor="middle">A</text>
      <circle cx="${L + 11}" cy="${b}" r="11" fill="#35C2C6"/><text class="lp-ab on" x="${L + 11}" y="${b + 4.5}" text-anchor="middle">B</text>
      <line x1="270" x2="270" y1="${a - 14}" y2="${B}" stroke="#CFF7F8" stroke-width="1.4"/><circle cx="270" cy="${a - 14}" r="3.5" fill="#CFF7F8"/>`;
  },
};
export const page = pg => `<div class="lp-page"><svg viewBox="0 0 438 655" width="438" height="655">
  <defs><linearGradient id="lp-bg-${pg.art}" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#22314A"/><stop offset=".145" stop-color="#273E52"/><stop offset=".22" stop-color="#284E6C"/>
    <stop offset=".298" stop-color="#223E5A"/><stop offset=".368" stop-color="#1D2D43"/><stop offset=".48" stop-color="#15212F"/>
    <stop offset=".588" stop-color="#0F1924"/><stop offset=".698" stop-color="#0B131A"/><stop offset=".808" stop-color="#070C11"/>
    <stop offset=".918" stop-color="#03080A"/><stop offset="1" stop-color="#020303"/></linearGradient>
    <radialGradient id="lp-halo-${pg.art}" cx=".5" cy=".12" r=".55"><stop offset="0" stop-color="#2E6F8E" stop-opacity=".5"/><stop offset="1" stop-color="#2E6F8E" stop-opacity="0"/></radialGradient></defs>
  <rect width="438" height="655" fill="url(#lp-bg-${pg.art})"/><rect width="438" height="655" fill="url(#lp-halo-${pg.art})"/>
  ${ART[pg.art]()}
  ${pg.title.map((l, i) => `<text x="${L}" y="${177 + DY + i * 43.5}" class="lp-h">${l}</text>`).join('')}
  ${pg.text.map((l, i) => `<text x="${L}" y="${265 + DY + i * 29}" class="lp-p">${l}</text>`).join('')}
  <rect x="48" y="${378 + DY}" width="${pg.cta.length * 9.6 + 34}" height="43" rx="21.5" fill="#33CBCC"/><text x="${48 + (pg.cta.length * 9.6 + 34) / 2}" y="${405 + DY}" class="lp-cta" text-anchor="middle">${pg.cta}</text>
</svg></div>`;
// an arc of a spinner: from a to b degrees (0 = right, clockwise), radius r
const arc = (r, a, b) => { const p = d => [r * Math.cos(d * Math.PI / 180), r * Math.sin(d * Math.PI / 180)].map(v => v.toFixed(2)).join(' '); return `M${p(a)} A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${p(b)}`; };
const progress = t => {
  const i = PROGRESS.findIndex(([at]) => at > t);
  if (i < 0) return 100;
  const [t0, a] = PROGRESS[i - 1], [t1, b] = PROGRESS[i];
  return a + (b - a) * (t - t0) / (t1 - t0);
};

export function mount(api) {
  loop(api, SRC, ({ add, person }) => {
    // the carousel: page 1 is the screenshot itself (its arrow half painted over, the arrow is redrawn on top), then the tips
    const pages = add(`<div class="lp-pages" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px">
      <div class="lp-track"><div class="lp-page lp-p1" style="background-image:url('${SRC}');background-position:-${CARD.x}px -${CARD.y}px">
        <i style="left:404px;top:318px;width:34px;height:72px;background:linear-gradient(#18202F,#111A25)"></i>
        <i class="lp-hover" style="left:48px;top:378px;width:158px;height:43px"></i></div>
        ${PAGES.map(page).join('')}</div>
      <svg width="0" height="0" style="position:absolute"><defs><filter id="lp-soft" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="lp-haze" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>
        <linearGradient id="lp-bar" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#2BB3B8"/><stop offset="1" stop-color="#CFF7F8"/></linearGradient></defs></svg></div>`);
    const track = pages.querySelector('.lp-track'), hover = pages.querySelector('.lp-hover');
    // the header and the Processing panel, the dots and the arrow, redrawn over the screenshot's
    const svg = add(`<svg class="lp-svg" viewBox="0 0 2000 1125" width="2000" height="1125">
      <rect x="846" y="215" width="200" height="28" fill="#fff"/><g class="lp-words"><text class="lp-pct" x="853" y="234.5">8%</text><text class="lp-stage" x="898" y="234.5">Detecting genre</text></g>
      <circle cx="815.5" cy="241" r="21" fill="#fff"/>
      <circle cx="1458" cy="986" r="23" fill="#112232"/>
      <g class="lp-panel" opacity="0"><rect x="1494" y="991" width="170" height="24" fill="#112232"/><text class="lp-proc" x="1497" y="1008.5">Preview ready</text>
        <path d="M1449 986.5l6 6 12-12.5" fill="none" stroke="#4A5666" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
      <rect x="833" y="945" width="198" height="29" fill="#010101"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle class="lp-dot" cx="${847 + i * 24.43}" cy="959.5" r="4.7" fill="#808080"/><circle class="lp-dot-on" cx="${847 + i * 24.43}" cy="959.5" r="7.2" fill="none" stroke="#fff" stroke-width="2"/>`).join('')}
      <g class="lp-arrow"><circle cx="1220.3" cy="638" r="29.7" fill="#F9FBFC"/><path d="M1213 637.5h15.5M1221 630l7.5 7.5-7.5 7.5" fill="none" stroke="#2B323B" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="lp-ready" opacity="0"><path d="M780.8 284.6V204.8a7 7 0 0 1 7-7H1214.2a7 7 0 0 1 7 7V284.6z" fill="#33CBCC"/>
        <circle cx="815.5" cy="241" r="16" fill="#061C2D"/><path d="M808 241.5l5 5 10-10.5" fill="none" stroke="#33CBCC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <text class="lp-pct" x="853" y="234.5">100%</text><text class="lp-stage" x="898" y="234.5">Preview ready</text>
        <text class="lp-ready-sub" x="853" y="258.5" textLength="164" lengthAdjust="spacing">Arch Dela […] | Prowler</text>
        <rect x="1104" y="222" width="94" height="38" rx="19" fill="#fff"/><rect class="lp-listen-h" x="1104" y="222" width="94" height="38" rx="19" fill="#061C2D" opacity="0"/>
        <path d="M1122 234v14l11-7z" fill="#061C2D"/><text class="lp-listen-t" x="1140" y="246.5">Listen</text></g></svg>`);
    // the spinners turn on their own small layers, so the plate isn't repainted every frame
    const spinner = (cx, cy, r, a, b, stroke, w) => add(`<svg class="lp-spin" viewBox="-22 -22 44 44" style="left:${cx - 22}px;top:${cy - 22}px;width:44px;height:44px"><path d="${arc(r, a, b)}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/></svg>`);
    const spin1 = spinner(815.5, 241, 16, 52, 251, '#000', 3.4), spin2 = spinner(1458, 986, 17, 149, 425, '#4A5666', 2.6);
    const q = s => svg.querySelector(s), words = q('.lp-words'), banner = q('.lp-ready'), panel = q('.lp-panel'), arrow = q('.lp-arrow'), listen = q('.lp-listen-h');
    const pct = words.querySelector('.lp-pct'), stage = words.querySelector('.lp-stage');
    let placed = false;   // the banner's stage moves right of "100%" once its width is known (fonts are in by then)
    const dots = [...svg.querySelectorAll('.lp-dot')], rings = [...svg.querySelectorAll('.lp-dot-on')];

    return (t, last) => {
      // progress through the stages; at READY the banner turns cyan; at AGAIN it turns back, at 8% (a new track)
      const v = t >= AGAIN ? 8 : progress(t), ready = step(t, READY, 0.3) - step(t, AGAIN, 0.3);
      const n = `${Math.floor(v)}%`, label = v >= 100 ? 'Preview ready' : STAGES.find(s => v <= s[1])[0];
      if (pct.textContent !== n) {   // the stage keeps the screenshot's place unless the number grows into it
        pct.textContent = n;
        stage.setAttribute('x', (898 + Math.max(0, pct.getComputedTextLength() - 21.5)).toFixed(1));
      }
      if (stage.textContent !== label) stage.textContent = label;
      if (ready > 0 && !placed) { placed = true; const [p, l] = banner.querySelectorAll('text'); l.setAttribute('x', (898 + Math.max(0, p.getComputedTextLength() - 21.5)).toFixed(1)); }
      banner.setAttribute('opacity', ready.toFixed(3)); panel.setAttribute('opacity', ready.toFixed(3));
      listen.setAttribute('opacity', (0.08 * (step(t, AGAIN - 3, 0.2) - step(t, AGAIN, 0.25))).toFixed(3));
      spin1.style.opacity = spin2.style.opacity = (1 - ready).toFixed(3);
      // whole turns per pass (about one a second, one every 1.25 s), so the spinners meet themselves at the seam
      const turn = per => ((t / LENGTH * Math.round(LENGTH / per)) % 1 * 360).toFixed(1);
      spin1.style.transform = `rotate(${turn(1)}deg)`; spin2.style.transform = `rotate(${turn(1.25)}deg)`;

      // the pages: 1 → 2 → 3 → 4 with the arrow, back to 1 on the first dot
      const pg = TURNS.reduce((a, c) => a + step(t, c + 0.05, SLIDE), 0) - 3 * step(t, BACK + 0.05, 0.9);
      track.style.transform = `translateX(${(-pg * CARD.w).toFixed(2)}px)`;
      rings.forEach((r, i) => { const on = Math.max(0, 1 - Math.abs(pg - i)); r.style.opacity = on.toFixed(3); dots[i].style.opacity = (1 - on).toFixed(3); });
      const press = CLICKS.some(at => Math.abs(t - at - 0.03) < 0.08);
      hover.style.opacity = (step(t, READY - 3.1, 0.2) - step(t, READY, 0.25)).toFixed(3);

      // the cursor: the arrow, reading each tip, the first dot, the course's button, Listen, home
      const [x, y] = path([[0, ...REST], [2.4, ...REST], [3.1, ...ARROW], ...LAND.flatMap((L, i) => read(L, i)), [BACK - 0.7, ...ARROW], [BACK - 0.1, ...DOT1],
        [BACK + 0.9, ...DOT1], [READY - 3.1, ...CTA], [READY, ...CTA], [AGAIN - 3, ...LISTEN], [AGAIN, ...LISTEN], [LENGTH - 0.4, ...REST]], t);
      person.at(x, y, press);
      if (CLICKS.some(at => crossed(t, last, at))) person.ring();
      const say = THOUGHTS.find(([a, b]) => t >= a && t < b);
      person.think(say ? say[2] : null, say && say[3]);
    };
  }, LENGTH);
}
