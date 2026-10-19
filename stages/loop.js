/* LANDR loops (2026-10-18): the two LANDR screenshots on the landing, brought to life in place.
   The screenshot stays the stage. A plate the size of the image (2000 × 1125) lies exactly over the <img> (cover, focus and
   the phone zoom are read from the image's own CSS), and only what moves is redrawn on it, in image pixels.
   One timeline per case (20 s by default), evaluated every frame from the stage clock: at its start and its end the
   plate is the screenshot, so the loop has no seam. A cursor plays the person; what they think sits beside it, in green.
   A replaced image (Change image) or reduced motion leaves the plain screenshot. */
import { el, clamp, reduce, css } from './core.js';
css('loop');

export const LOOP = 20, IW = 2000, IH = 1125;
export const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const out = t => 1 - Math.pow(1 - t, 3);
/* 0 before t0, 1 after t0 + d, eased between */
export const step = (t, t0, d = 0.2) => ease(clamp((t - t0) / d, 0, 1));
/* eased path through [t, x, y] keys; holds before the first key and after the last */
export function path(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, ...a] = keys[i - 1], [t1, ...b] = keys[i], k = ease((t - t0) / (t1 - t0 || 1));
    return a.map((v, j) => v + (b[j] - v) * k);
  }
  return keys[keys.length - 1].slice(1);
}

/* loop(api, src, build, length): build({ add, person }) draws the layers on the plate (add(html) appends one, in image px)
   and returns tick(t, last, total): t is the loop time (0…length),
   last the previous frame's, total the time the stage has run (for what outlasts a pass, like a progress bar) */
export function loop(api, src, build, length = LOOP) {
  const { world, host } = api;
  const img = host.querySelector(':scope > img');
  if (reduce || !img) return;
  window.siteImage(src).then(shown => {
    if (shown.split('?')[0] !== src || api.S.destroyed) return;   // a replacement image: the overlays would not match it (?v= is only the file's version)
    world.classList.add('lp');
    const P = el(`<div class="lp-plate"><div class="lp-pic"></div></div>`);
    P.firstChild.style.backgroundImage = `url("${shown}")`;
    world.appendChild(P);

    /* image px → block px, exactly as the <img> under the plate is drawn */
    const map = { s: 1, x: 0, y: 0 };
    api.resize(() => {
      const W = host.clientWidth, H = host.clientHeight, cs = getComputedStyle(img), s0 = Math.max(W / IW, H / IH);
      const [ox0, oy0] = cs.objectPosition.split(' ');
      const off = (v, room) => (v && v.endsWith('%') ? room * parseFloat(v) / 100 : parseFloat(v) || room / 2);
      const offX = off(ox0, W - IW * s0), offY = off(oy0, H - IH * s0);
      const m = cs.transform && cs.transform !== 'none' ? cs.transform.match(/-?[\d.]+(e-?\d+)?/g).map(Number) : [1, 0, 0, 1, 0, 0];
      const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
      map.s = m[0] * s0; map.x = ox + m[0] * (offX - ox) + m[4]; map.y = oy + m[3] * (offY - oy) + m[5];
      P.style.transform = `translate(${map.x.toFixed(2)}px, ${map.y.toFixed(2)}px) scale(${map.s.toFixed(5)})`;
    });

    /* the person: a cursor, a press, a click ring, and a thought beside it */
    const cur = el(`<i class="lp-cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.5L16 19l-2.6 1.3-3.2-6.4L5 18z"/></svg></i>`);
    const th = el(`<span class="lp-think"><b></b></span>`), thb = th.firstChild;
    world.append(cur, th);
    let said = null, thW = 0, thH = 0, thDy = 0;
    const person = {
      at(x, y, down) {
        const X = map.x + x * map.s, Y = map.y + y * map.s;
        cur.style.transform = `translate(${X.toFixed(1)}px, ${Y.toFixed(1)}px)`;
        cur.classList.toggle('down', !!down);
        // the thought reads to the right of the cursor, or to its left near the block's edge; it never leaves the block
        const W = host.clientWidth, H = host.clientHeight;
        const left = X + 18 + thW > W - 8, tx = left ? X - 8 - thW : X + 18, ty = clamp(Y + 20 + (left ? thDy * map.s : 0), 6, H - thH - 6);
        th.classList.toggle('l', left);
        th.style.transform = `translate(${Math.max(6, tx).toFixed(1)}px, ${ty.toFixed(1)}px)`;
        person.X = X; person.Y = Y;
      },
      think(text, dy = 0) {   // dy: image px further down when it reads to the left, to clear what sits beside the cursor
        if (text === said) return; said = text; thDy = dy;
        if (text) { thb.textContent = text; thW = th.offsetWidth; thH = th.offsetHeight; }
        th.classList.toggle('on', !!text);
      },
      ring() { const r = el(`<i class="click-ring lp-ring" style="left:${person.X}px;top:${person.Y}px"></i>`); world.appendChild(r); setTimeout(() => r.remove(), 700); },
    };

    const tick = build({ add: html => { const n = el(html); P.appendChild(n); return n; }, person });
    let total = 0, last = -1;
    api.frame(dt => {
      total += dt;
      const T = typeof window.__loopAt === 'number' ? window.__loopAt : total % length;   // a frozen moment, for review shots
      if (T < last) person.think(null);   // a new pass
      tick(T, last, total);
      last = T;
    });
    tick(0, -1, 0);
    const pic = new Image(); pic.src = src;
    (pic.decode ? pic.decode() : Promise.resolve()).catch(() => {}).then(() => world.classList.add('ready'));
  });
}

/* the clicks a pass makes: true when the loop time crossed t since the last frame */
export const crossed = (t, last, at) => last >= 0 && last < at && t >= at;
