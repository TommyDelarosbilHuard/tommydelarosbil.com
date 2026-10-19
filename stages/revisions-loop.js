/* LANDR Mastering Revisions, as a 20 s loop on the landing screenshot (2026-10-18).
   The master keeps playing; answers don't change what you hear, you answer while you listen. The person drags the
   playhead back to hear a part again, hesitates on Loudness ("Good", then back to "Too loud"), confirms the Distortion
   filter, scrolls to "The lows are:" and picks "Boomy", then scrolls back. Their thoughts, in green and plain words:
   no mastering jargon, the questions already speak their language. At 20 s the modal is the screenshot again. */
import { loop, path, step, crossed, LOOP } from './loop.js';

const SRC = 'img/landr-master-revision.jpg';
// the player's bars, measured on the screenshot: [centre x, top, bottom] in image px
const BARS = [[773,896,899],[778,896,899],[782.5,895,900],[787.5,893,902],[792.5,893,902],[797.5,893,902],[802.5,895,900],[807,891,904],[812,891,904],[817,895,900],[822,893,902],[826.5,890,905],[831.5,891,904],[836.5,890,905],[841.5,888,907],[846.5,889,906],[851,888,907],[856,888,907],[861,884,911],[865.5,884,911],[871,884,911],[875.5,883,912],[880,884,911],[885,886,909],[890,887,908],[895,887,908],[900,888,907],[905,888,907],[910,887,908],[915,888,907],[919,887,908],[924,890,904],[929,890,904],[934,890,905],[939,892,903],[944,895,900],[949,892,903],[954,893,902],[958.5,895,900],[963,892,903],[968,895,900],[973,893,902],[978,893,902],[983,893,902],[988,895,900],[993,895,900]];
const PITCH = 4.89;
// the playhead: 20 bars played at 0:47, 1.5 s a bar
const barAt = s => 20 + (s - 47.2) / 1.5, xAt = s => BARS[0][0] + (barAt(s) - 0.5) * PITCH;
// the clock: plays from 0:47, the drag takes it back to 0:29 (1.5 → 2.3 s), and it plays on to 0:47 at 20 s
const DRAG = [1.5, 2.3], FROM = 47 + DRAG[0], TO = 47 - (LOOP - DRAG[1]);
const clock = t => t < DRAG[0] ? 47 + t : t < DRAG[1] ? FROM + (TO - FROM) * step(t, DRAG[0], DRAG[1] - DRAG[0]) : TO + (t - DRAG[1]);
// the modal's body scrolls D px to show the lows, then back (its header and the player stay)
const BODY = { x: 672, y: 330, w: 658, h: 514 }, D = 90;
const scroll = t => step(t, 14.4, 0.8) - step(t, 18.3, 0.8);
const THUMB = Math.round(BODY.h * BODY.h / (BODY.h + D)) - 6, TRAVEL = BODY.h - THUMB - 6;
// the lows, below the screenshot's edge: [answer, left, width] in image px; chips from LOW_Y, 44 px tall
const LOWS = [['Good', 717, 95], ['Boomy', 822, 110], ['Thin', 942, 87]], LOW_Y = 865;
// the cursor's tip sits past each word, inside its control
const GOOD = [918, 489], LOUD = [1058, 488], TOGGLE = [805, 607], BOOMY = [913, LOW_Y + 25 - D], REST = [1060, 790];
const CLICKS = [5.1, 8.6, 16.1], [GOOD_AT, LOUD_AT, BOOMY_AT] = CLICKS;
// three seconds each, so they can be read
const THOUGHTS = [
  [1.9, 4.9, 'Wait, let me hear that part again.'],
  [5.3, 8.3, 'Hmm, I think the volume is good…'],
  [8.8, 11.8, '…but maybe it’s still a bit too loud?'],
  [12.2, 15.2, 'There’s a little crackle. Yes, filter it.'],
  [16.3, 19.3, 'Boomy bass. That one I know!'],
];

export function mount(api) {
  loop(api, SRC, ({ add, person }) => {
    const at = (x, y) => `left:${x - BODY.x}px;top:${y - BODY.y}px`;
    // the body, as a scrolling crop of the screenshot; the lows are drawn below its edge
    const body = add(`<div class="lp-body" style="left:${BODY.x}px;top:${BODY.y}px;width:${BODY.w}px;height:${BODY.h}px"><div class="lp-scroll" style="width:${BODY.w}px;height:${BODY.h + D}px">
      <i class="lp-crop" style="width:${BODY.w}px;height:${BODY.h}px;background-image:url('${SRC}');background-position:-${BODY.x}px -${BODY.y}px"></i>
      <i class="lp-fill mul" style="${at(846.5, 458.5)};width:92px;height:41px"></i><i class="lp-ring-sel" style="${at(845, 457)};width:95px;height:44px"></i>
      <i class="lp-fill dodge" style="${at(950, 457)};width:127px;height:44px"></i><i class="lp-ring-off" style="${at(950, 457)};width:127px;height:44px"></i>
      <i style="${at(712, 831)};width:124px;height:13px;background:#fff"></i>
      <svg viewBox="0 0 ${BODY.w} ${BODY.h + D}" width="${BODY.w}" height="${BODY.h + D}" style="left:0;top:0">
        <text class="lp-sub" x="${718 - BODY.x}" y="${846.5 - BODY.y}" textLength="110.5" lengthAdjust="spacing">The lows are:</text>
        ${LOWS.map(([l, x, w]) => `<rect class="lp-chip" x="${x - BODY.x + 0.75}" y="${LOW_Y - BODY.y + 0.75}" width="${w - 1.5}" height="42.5" rx="21.25"/>
          <rect class="lp-chip-on" x="${x - BODY.x}" y="${LOW_Y - BODY.y}" width="${w}" height="44" rx="22" opacity="0"/>
          <text class="lp-chip-t" x="${x - BODY.x + w / 2}" y="${LOW_Y - BODY.y + 28}" text-anchor="middle">${l}</text>`).join('')}</svg>
    </div><i class="lp-thumb" style="left:${BODY.w - 9}px;top:3px;height:${THUMB}px"></i></div>`);
    // the cut label's last pixel row sits in the player's divider: painted over while the body is scrolled
    const seam = add(`<i class="lp-cover" style="left:712px;top:844px;width:124px;height:2px;background:linear-gradient(#E7E9EA 50%,#EEF0F3 50%);opacity:0"></i>`);
    const scroller = body.querySelector('.lp-scroll'), thumb = body.querySelector('.lp-thumb');
    const loudness = [...body.querySelectorAll('.lp-fill,.lp-ring-sel,.lp-ring-off')], boomy = body.querySelectorAll('.lp-chip-on')[1];
    // the waveform and its clock, redrawn over the screenshot's: the bars never change, only the playhead moves
    add(`<i class="lp-cover" style="left:766px;top:878px;width:234px;height:40px;background:#fff"></i>`);
    add(`<i class="lp-cover" style="left:1010px;top:887px;width:38px;height:20px;background:#fff"></i>`);
    const svg = add(`<svg class="lp-svg lp-wave" viewBox="0 0 2000 1125" width="2000" height="1125">${BARS.map(([x, top, bot]) => `<rect x="${x - 1.3}" y="${top}" width="2.6" height="${bot - top + 1}" rx="1.3"/>`).join('')}
      <text class="lp-time" x="1014.5" y="902.5">0:47</text></svg>`);
    const rects = [...svg.querySelectorAll('rect')], time = svg.querySelector('.lp-time');
    let played = -1;

    return (t, last) => {
      // Loudness: "Good" from the first click to the second, then "Too loud" again
      const g = (step(t, GOOD_AT, 0.18) - step(t, LOUD_AT, 0.18)).toFixed(3);
      loudness.forEach(n => { n.style.opacity = g; });
      boomy.setAttribute('opacity', step(t, BOOMY_AT, 0.18).toFixed(3));
      const sc = scroll(t);
      scroller.style.transform = `translateY(${(-sc * D).toFixed(2)}px)`;
      seam.style.opacity = sc > 0.001 ? '1' : '0';
      thumb.style.transform = `translateY(${(sc * TRAVEL).toFixed(2)}px)`;
      thumb.style.opacity = (step(t, 14.3, 0.2) - step(t, 15.6, 0.4) + step(t, 18.2, 0.2) - step(t, 19.4, 0.4)).toFixed(3);

      const s = clock(t), n = Math.ceil(barAt(s));   // bars before the playhead are played
      if (n !== played) { played = n; rects.forEach((r, i) => r.classList.toggle('pl', i < n)); }
      const label = `0:${String(Math.floor(s)).padStart(2, '0')}`;
      if (time.textContent !== label) time.textContent = label;

      // the cursor: to the playhead, drag it back, Good, Too loud, the filter, the lows, home
      let [x, y] = path([[0, ...REST], [0.4, ...REST], [1.4, xAt(clock(1.4)), 899], [DRAG[0], xAt(FROM), 899]], t);
      if (t >= DRAG[0] && t < DRAG[1] + 0.3) x = xAt(clock(Math.min(t, DRAG[1])));
      if (t >= DRAG[1] + 0.3) [x, y] = path([[4.2, xAt(TO), 899], [5.0, ...GOOD], [7.9, ...GOOD], [8.5, ...LOUD], [11.3, ...LOUD], [12.1, ...TOGGLE],
        [15.3, ...TOGGLE], [16.0, ...BOOMY], [18.6, ...BOOMY], [19.8, ...REST]], t);
      const down = (t > 1.42 && t < DRAG[1]) || CLICKS.some(c => Math.abs(t - c - 0.02) < 0.08);
      person.at(x, y, down);
      if (CLICKS.some(c => crossed(t, last, c))) person.ring();
      const say = THOUGHTS.find(([a, b]) => t >= a && t < b);
      person.think(say ? say[2] : null);
    };
  });
}
