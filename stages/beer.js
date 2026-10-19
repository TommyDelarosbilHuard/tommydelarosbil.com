/* Field: the table at 45 degrees. The shop as a scale model, before and after, path-traced offline
   (scenes/beer-table.js, baked by tools/bake_scene.mjs into img/scenes/). Before, the square table makes a corridor:
   straight to the counter, beer noticed only after paying. After, the table turned 45° works like a stop sign, beer
   waits at the door and beside the sausages, and people leave with both.
   The page only shows the baked image; the words are HTML on top (STORY in the scene file), placed where the bake
   measured each label's anchor. Change words there without re-baking. Paths and figures are illustrative. */
import { css } from './core.js';
import { STORY } from '../scenes/beer-table.js';
css('beer');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const caption = (k, cls) => `<div class="bt-cap ${cls}" data-a="lg${k}"><h4><b>${esc(STORY.heads[cls === 'b' ? 'before' : 'after'][0])}</b><span>${esc(STORY.heads[cls === 'b' ? 'before' : 'after'][1])}</span></h4>
  <ol>${STORY[cls === 'b' ? 'before' : 'after'].map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
const HTML = `<div class="bt-wrap"><img class="bt-img" alt="" decoding="async"><div class="bt-ov">
  ${caption('A', 'b')}${caption('B', 'a')}
  <div class="bt-mid" data-a="mid"><b>${esc(STORY.result[0])}</b><span>${esc(STORY.result[1])}</span>${STORY.result[2] ? `<small>${esc(STORY.result[2])}</small>` : ''}</div>
  ${STORY.before.map((_, i) => `<i class="bt-pin b" data-a="a${i + 1}">${i + 1}</i>`).join('')}${STORY.after.map((_, i) => `<i class="bt-pin a" data-a="b${i + 1}">${i + 1}</i>`).join('')}
</div></div>`;

export async function mount(api) {
  const { world } = api;
  world.innerHTML = HTML;
  const img = world.querySelector('.bt-img'), ov = world.querySelector('.bt-ov');
  const man = await fetch('img/scenes/beer-table.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => null);
  if (!man || api.S.destroyed) return;
  // "Change image" can replace the render. The wide picture serves desktop; the compact one serves small screens
  // (falling back to the wide one). A replacement carries its own words: no labels on it, shown whole and centred,
  // on bands that match its edges. A tall mobile picture also sets the block's proportions (capped by the window).
  const KEYS = { wide: 'img/scenes/beer-table-wide.jpg', compact: 'img/scenes/beer-table-compact.jpg' };
  const load = async key => { const src = window.siteImage ? await window.siteImage(key) : key; if (src.split('?')[0] === key) return null;
    return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); };
  const own = { wide: await load(KEYS.wide), compact: await load(KEYS.compact) };
  if (api.S.destroyed) return;
  const edges = im => { if (im._edges) return im._edges;
    try { const n = 24, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, n, n);
      const d = g.getImageData(0, 0, n, n).data, avg = f => { const m = [0, 0, 0]; for (let i = 0; i < n; i++) { const [x, y] = f(i); for (let k = 0; k < 3; k++) m[k] += d[(y * n + x) * 4 + k] / n; } return `rgb(${m.map(Math.round).join(',')})`; };
      return (im._edges = { top: avg(i => [i, 0]), bottom: avg(i => [i, n - 1]), left: avg(i => [0, i]), right: avg(i => [n - 1, i]) }); } catch (_) { return (im._edges = null); } };

  let last = '';
  const draw = () => {
    const W = world.clientWidth, H = world.clientHeight; if (!W || !H) return;
    const small = W < 620, key = (small ? 'compact' : 'wide');
    const pic = small ? own.compact || own.wide : own.wide;
    api.host.dataset.image = KEYS[key];                         // Change image replaces the version on screen
    const tall = small && !!own.compact;
    api.host.classList.toggle('bt-tall', tall);
    if (tall) api.host.style.setProperty('--bt-ar', (own.compact.naturalWidth / own.compact.naturalHeight).toFixed(4));
    ov.hidden = !!pic; world.classList.toggle('bt-own', !!pic); world.classList.toggle('bt-small', small);
    if (pic) { const e = edges(pic), side = W / H > pic.naturalWidth / pic.naturalHeight;
      world.style.background = !e ? '' : side ? `linear-gradient(90deg, ${e.left} 0 50%, ${e.right} 50% 100%)` : `linear-gradient(${e.top} 0 50%, ${e.bottom} 50% 100%)`;
      if (last !== pic.src) { img.src = pic.src; last = pic.src; }
      return; }
    world.style.background = '';
    const fr = man.framings[key] || man.framings.wide; if (!fr) return;
    const src = fr.image + '?v=' + (man.baked || '');
    if (last !== src) { img.src = src; last = src; }
    // the image covers the box; map the bake's 0..1 anchors through the same crop
    const s = Math.max(W / fr.w, H / fr.h), dx = (W - fr.w * s) / 2, dy = (H - fr.h * s) / 2;
    const P = ([u, v]) => [dx + u * fr.w * s, dy + v * fr.h * s];
    for (const n of ov.querySelectorAll('[data-a]')) {
      const a = fr.anchors[n.dataset.a]; if (!a) { n.hidden = true; continue; }
      const [x, y] = P(a); n.hidden = false; n.style.left = x.toFixed(1) + 'px'; n.style.top = y.toFixed(1) + 'px';
    }
    // captions share one line under the shops; the result sits between them on that line
    const foot = Math.max(...[...fr.anchors.footA, ...fr.anchors.footB].map(a => P(a)[1])) + (small ? 4 : 18);
    ov.querySelectorAll('.bt-cap').forEach(n => { n.style.top = Math.min(foot, H - n.offsetHeight - 10).toFixed(1) + 'px'; });
    const mid = ov.querySelector('.bt-mid'); mid.style.top = Math.min(foot - (small ? 2 : 6), H - mid.offsetHeight - 10).toFixed(1) + 'px';
  };
  api.resize(draw);
  return { destroy() {} };
}
