/* Groupe Dynamite: a new checkout in four weeks.
   The film walks the checkout as it was handed off: bag → shipping address (type the civic number, pick the
   address) → address saved → shipping method → payment, with Collectif points → the API's payment sheet. From
   there it alternates the two paths of the flow: a saved card verified by its CVV, or a new card that is declined,
   brought back to payment with the reason, then paid with the saved card. Both end on Order Placed.
   Beside the phone, one note at a time, drawn like the deck's annotations and pinned to the element it is about:
   the brief, then what changed because of the design work. Buttons show when the app is working. At the end the
   phone tumbles and the loop starts while its back is turned. Any button the film would press can be pressed by the
   reader to move on; in the payment sheet the reader picks the path. */
import { el, $, $$, css, tap, statusBar, typeInto } from './core.js';
import { glPhone } from './phone3d.js';
css('gdi');

const back = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const heart = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const okC = '<svg class="gd-okc" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.4 10.3l2.4 2.4 4.8-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const pencil = '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const mc = '<i class="gd-mc"><b></b><b></b></i>';
const card = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="currentColor"/><path d="M2.5 9.5h19" stroke="#fff" stroke-width="2"/></svg>';
const brands = '<span class="gd-brands"><i class="v">VISA</i>' + mc + '<i class="ax">AMEX</i><i class="dc"></i><i class="ds"></i><i class="jcb">JCB</i></span>';
const ICON = {
  uber: '<b class="gd-uber">Uber</b>',
  truck: '<svg viewBox="0 0 32 20"><path d="M2 4h17v11H2zM19 8h6l4 4v3H19z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="16" r="2" fill="#fff" stroke="currentColor"/><circle cx="24" cy="16" r="2" fill="#fff" stroke="currentColor"/></svg>',
  fast: '<svg viewBox="0 0 32 20"><path d="M8 4h13v11H8zM21 8h5l4 4v3h-9M1 7h5M2 10h4M3 13h3" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="16" r="2" fill="#fff" stroke="currentColor"/><circle cx="25" cy="16" r="2" fill="#fff" stroke="currentColor"/></svg>',
  store: '<svg viewBox="0 0 32 20"><path d="M6 8h20v10H6zM4 8l3-5h18l3 5M12 18v-6h8v6" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
};
const thumb = '<img src="img/gdi-dress.jpg" alt="">';
const ITEMS = [
  ['Heidi Ultra High Waisted Denim Jeans', 'Lavender', '$159.95', '$139.95', 1],
  ['Printed Satin Shorts', 'Black', '$44.95', '$29.00', 2],
];
const TOTAL = '$227.59', PAID = '$217.59';
// one stepper and one footer for every checkout screen
const steps = n => `<div class="gd-steps">${['Address', 'Shipping', 'Payment'].map((s, i) => `<span class="${i < n ? 'ok' : i === n ? 'on' : ''}">${okC}${s}</span>`).join('')}</div>`;
const foot = (label, cls = '') => `<div class="gd-foot"><div class="gd-sumline"><span>Summary</span><span><b class="gd-sumv">${TOTAL}</b> (3 items) ⌃</span></div><span class="gd-cta ${cls}" data-act="gd-go">${label}</span></div>`;
const field = (label, k, extra = '') => `<label class="gd-u" data-f="${k}"><span>${label}</span><em></em>${extra}</label>`;
const SUGG = ['5592 Hinton Street, Mississauga, ON', '5592 rue Ferrier, Laval, QC', '5592 Ferrier Street, Markham, ON', '5592 Ferris Lane, Barrie, ON'];

const UI = `
<section class="scr gd-bag">
  ${statusBar()}
  <div class="gd-nav">${back}<b>SHOPPING BAG</b>${heart}</div>
  <div class="gd-scroll">${ITEMS.map(([n, c, was, now, q]) => `<div class="gd-item"><figure>${thumb}</figure>
    <div><div class="gd-name">${n}</div><div class="gd-meta">Color: ${c}<br>Size: S<br>Length: Regular</div>
    <div class="gd-price"><s>${was}</s> ${now}</div><div class="gd-red">Final sale*</div>
    <div class="gd-qty"><i>−</i><span>${q}</span><i>+</i><em>···</em></div></div></div>`).join('')}</div>
  ${foot('CHECKOUT')}
</section>

<section class="scr gd-addr off-r">
  ${statusBar()}
  <div class="gd-nav">${back}<b>CHECKOUT</b><span></span></div>${steps(0)}
  <div class="gd-pad"><h3>SHIPPING ADDRESS</h3>
    ${field('First Name*', 'first')}${field('Last Name*', 'last')}
    <div class="gd-street">${field('Street Address*', 'street')}<div class="gd-sugg">${SUGG.map((s, i) => `<span data-i="${i}">${s}</span>`).join('')}</div></div>
    ${field('City*', 'city')}${field('Postal Code*', 'postal', '<small>Example: A9A 9A9</small>')}${field('Phone Number*', 'phone')}
  </div>
  ${foot('SAVE &amp; SELECT SHIPPING', 'off')}
</section>

<section class="scr gd-conf off-r">
  ${statusBar()}
  <div class="gd-nav">${back}<b>CHECKOUT</b><span></span></div>${steps(0)}
  <div class="gd-pad"><p class="gd-where">Where can we ship your order?</p>
    <div class="gd-box"><div class="gd-card-a"><div><b>Martine Denis</b><span>5592 rue Ferrier</span><span>Laval, QC H7P 5P9</span><span>Canada</span><span>Phone: (514) 852-6354</span></div>${pencil}<i class="gd-sel"><svg viewBox="0 0 20 20"><path d="M5.5 10.4l3 3 6-6.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></i></div>
      <span class="gd-line">ADD NEW ADDRESS</span></div>
    <p class="gd-sms"><i></i><span>By checking this box, you agree to receive recurring automated marketing text messages (e.g. cart reminders) from Dynamite at the cell number used when signing up. Consent is not a condition of any purchase. Reply STOP to cancel.</span></p>
  </div>
  ${foot('SAVE &amp; SELECT SHIPPING')}
</section>

<section class="scr gd-ship off-r">
  ${statusBar()}
  <div class="gd-nav">${back}<b>CHECKOUT</b><span></span></div>${steps(1)}
  <div class="gd-pad"><h5>SELECT YOUR SHIPPING METHOD</h5><p class="gd-note-s">Please select a shipping method from the provided choices. Data provided by Canada Post.</p>
    ${[['uber', 'Same Day Delivery', 'Orders placed after 3pm will be delivered the next day.', '$10.00'], ['truck', 'Standard Ground', '2 - 4 Business Days', '$0.00'], ['fast', 'Express Shipping', '1 - 3 Business Days', '$14.00'], ['store', 'Pick Up In Store', '', '$0.00']]
      .map(([k, a, b, p], i) => `<div class="gd-opt" data-i="${i}"><i class="gd-box-c"></i><span class="gd-ic">${ICON[k]}</span><div><b>${a}</b><small>${b}</small></div><span>${p}</span></div>`).join('')}
  </div>
  ${foot('SELECT A PAYMENT METHOD', 'off')}
</section>

<section class="scr gd-pay off-r">
  ${statusBar()}
  <div class="gd-err"><span>Credit card was not successfully authorized.</span><i>×</i></div>
  <div class="gd-nav">${back}<b>CHECKOUT</b><span></span></div>
  ${steps(2)}
  <div class="gd-pad">
    <div class="gd-points"><b>Redeem Your Dynamite Collectif Points</b><span>Available points to use: 370</span><div><span>$10 off (300 points)</span><em class="gd-apply">APPLY</em></div></div>
    <h3 class="mt">SECURE PAYMENT OPTIONS</h3>
    <div class="gd-radio" data-r="cc"><i></i><span>Credit Card</span><span class="gd-mini"><i class="v">VISA</i>${mc}<i class="ax">AMEX</i></span></div>
    <div class="gd-radio"><i></i><b class="gd-pp">PayPal</b></div>
    <div class="gd-radio"><i></i><b class="gd-ap"> Pay</b></div>
    <div class="gd-radio"><i></i><div><b class="gd-kl">Klarna.</b><small>Pay in 4 equal payments of $54.40</small></div></div>
    <div class="gd-gift">+ <span>Gift Card</span></div>
    <div class="gd-pol"><u>Privacy Policy</u><u>Shipping Policy</u><u>Return Policy</u></div>
  </div>
  ${foot('SELECT OPTION', 'gd-paycta off')}

  <i class="gd-dim"></i>
  <div class="gd-sheet gd-methods"><div class="gd-sh"><b>Payment Methods</b><i>×</i></div>
    <div class="gd-pm" data-act="gd-pick" data-p="saved">${mc}<div><b>•••• 0010</b><small>Expires 03/30</small></div><i class="gd-spin"></i></div>
    <div class="gd-pm">${mc}<div><b>•••• 1111</b><small>Expires 03/30</small></div></div>
    <small class="gd-others">OTHERS</small>
    <div class="gd-pm add" data-act="gd-pick" data-p="new"><span class="gd-cardi">${card}</span><div><b>Add New Credit Card</b></div></div>
  </div>
  <div class="gd-alert"><b>Verify your card</b><span>Please enter the CVV code for<br>•••• 0010</span><em class="gd-cvv"></em><div><span>Cancel</span><span class="gd-alpay" data-act="gd-go">Pay ${PAID}</span></div></div>
  <div class="gd-sheet gd-newcard"><div class="gd-sh"><b>Pay With Credit Card</b><i>×</i></div>
    <div class="gd-cf wide" data-f="num"><span>Card number</span><em data-ph="1234 5678 9012 3456"></em><i class="gd-ck">✓</i></div>${brands}
    <div class="gd-two"><div class="gd-cf" data-f="exp"><span>Expiry date</span><em data-ph="MM/YY"></em><i class="gd-ck">✓</i></div><div class="gd-cf" data-f="cvv"><span>CVV</span><em data-ph="3 digits"></em><i class="gd-ck">✓</i></div></div>
    <div class="gd-rem"><span>Remember for next time</span><i></i></div>
    <span class="gd-blue" data-act="gd-go">Pay ${PAID}</span>
  </div>
</section>

<section class="scr gd-proc off-r">
  ${statusBar()}
  <div class="gd-procbox"><i class="gd-spin on"></i><p>Your order is currently being processed.<br><b>Please, do not navigate away from this screen.</b></p></div>
</section>

<section class="scr gd-done off-r">
  ${statusBar()}
  <div class="gd-placed">
    <svg class="gd-big" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="#1E9E4A" stroke-width="2"/><path d="M21 33l8 8 15-17" fill="none" stroke="#1E9E4A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h3>Order Placed</h3><span>Estimated Delivery</span><b>3 to 7 business days</b><small>Order # 765075020504</small>
    <div class="gd-earn">You will earn <b><span class="gd-pts">0</span> points</b> once your order is shipped.</div>
    <p>You will soon receive an email confirmation at this address: <b>martine.denis@email.com</b></p>
    <div class="gd-btns"><span class="gd-ghost">SHOP</span><span class="gd-cta">SEE MY REWARDS</span></div>
  </div>
</section>`;

// [key, label, statement]; a note about one element is wired to it, a note about the whole project is not
const NOTES = [
  ['brief', 'The brief', 'A new payment API in four weeks. No user testing. Most leaders expected failure.'],
  ['ship', 'Decision', 'Daily refinements replaced testing. Every trade-off settled with the PM and developers.'],
  ['sheet', 'Constraint', 'The API’s payment sheet came as-is. We changed only what the date allowed.'],
  ['fixed', 'Opportunity', 'The refactor reopened checkout. We fixed what we already knew was broken.'],
  ['error', 'Decision', 'Every path specced, errors included. A declined card comes back with the reason, nothing lost.'],
  ['releases', 'Decision', 'Two releases instead of one: the API first, without hurting conversion. Then the gaps.'],
  ['done', 'Impact', 'Handed off on time: 100+ wireframes, 80+ mockups and 25+ user flows in four weeks.'],
];
// Parked 2026-10-18 (Tommy): few people read notes while turning the phone. true brings them back as they were.
const SHOW_NOTES = false;
const SCREENS = ['bag', 'addr', 'conf', 'ship', 'pay', 'proc', 'done'];
export { UI as GDI_UI, TOTAL as GDI_TOTAL, PAID as GDI_PAID };   // the case page's flat screenshots render these (tools/case_shots/payment-gateway.js)

export async function mount(api) {
  const { world } = api;
  world.classList.toggle('gd-parked', !SHOW_NOTES);
  // the world: a dressing table at night, with a soft halo centred behind the phone (gdi.css --halo)
  world.innerHTML = `<div class="gd-env"><i class="gd-env-img"></i></div>
    <div class="gd-notes">${NOTES.map(([k, h, t]) => `<div class="gd-note" data-k="${k}"><b>${h}</b><span>${t}</span></div>`).join('')}</div>
    <svg class="gd-wires" aria-hidden="true"><path class="w"/><rect class="d1" width="9" height="9"/><rect class="d2" width="9" height="9"/></svg>`;
  const P = await glPhone(api, {
    ui: UI, pose: { yaw: 0.34, pitch: -0.05, roll: 0.02 }, rim: 0xff4fc8,
    back: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b1b1c'); gr.addColorStop(1, '#070707'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f2f2f2'; g.font = "500 52px Jost, 'Futura PT', sans-serif"; g.textAlign = 'center'; if ('letterSpacing' in g) g.letterSpacing = '22px'; g.fillText('DYNAMITE', w / 2 + 11, h * 0.56); },
    // the phone sits in the middle; the notes start just right of it, when there is room for them (never on phones)
    place: S => {
      const h = S.mobile ? 0.828 : 0.86, pw = Math.min(S.H * h, S.W * 0.9 / 0.483) * 0.483;   // phones: 8% smaller on small screens
      const left = S.W / 2 + pw / 2 + Math.max(48, S.W * 0.045), room = S.W - left - Math.max(24, S.W * 0.03);
      const wide = !S.mobile && room >= 250;
      world.classList.toggle('gd-narrow', !wide);
      world.style.setProperty('--nl', left.toFixed(0) + 'px'); world.style.setProperty('--nw', Math.min(330, room).toFixed(0) + 'px');
      return S.mobile ? { h, maxW: 0.828 } : { h };
    },
  });
  // the environment: a vanity at night (img/gdi-env.jpg, Tommy's image), fading in once loaded, a little parallax under the pointer
  { const key = 'img/gdi-env.jpg'; api.host.dataset.image = key;               // "Change image" replaces this one
    const im = new Image(); im.onload = () => { $(world, '.gd-env-img').style.setProperty('--img', `url(${im.src})`); world.classList.add('gd-has-env'); };
    im.src = window.siteImage ? await window.siteImage(key) : key; }
  api.frame(() => { world.style.setProperty('--mx', api.S.shx.toFixed(3)); world.style.setProperty('--my', api.S.shy.toFixed(3)); });
  const ui = P.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  const notes = $$(world, '.gd-note'), wire = $(world, '.gd-wires'), path = $(wire, '.w'), d1 = $(wire, '.d1'), d2 = $(wire, '.d2');
  let active = null;   // [noteKey, targetElement]

  // the annotation wire: from the note's diamond to the live element in the phone, elbowed like the deck
  api.frame(() => {
    if (!active || world.classList.contains('gd-narrow')) { wire.classList.remove('on'); return; }
    const [k, t] = active, n = notes.find(n => n.dataset.k === k); if (!n || !t) { wire.classList.remove('on'); return; }   // a global note points at nothing
    const w = world.getBoundingClientRect(), a = n.getBoundingClientRect(), b = t.getBoundingClientRect();
    const x1 = a.left - w.left - 14, y1 = a.top - w.top + 11, x2 = b.right - w.left + 4, y2 = b.top - w.top + b.height / 2;
    const mx = x2 + (x1 - x2) * 0.45;
    path.setAttribute('d', `M${x1},${y1} H${mx} V${y2} H${x2}`);
    d1.setAttribute('transform', `translate(${x1 - 4.5},${y1 - 4.5}) rotate(45 4.5 4.5)`);
    d2.setAttribute('transform', `translate(${x2 - 4.5},${y2 - 4.5}) rotate(45 4.5 4.5)`);
    wire.classList.add('on');
  });
  const annotate = (k, t) => { active = k ? [k, t] : null; notes.forEach(n => n.classList.toggle('on', n.dataset.k === k)); };

  api.act('gd-go', () => { api.skip(); return 'go'; });
  let pick = null;                                   // the reader's choice in the payment sheet
  api.act('gd-pick', b => { if (!q('.gd-methods.up')) return; pick = b.dataset.p; api.skip(); return 'go'; });

  let current = 'bag';
  // forward pushes from the right; back (a declined card returning to payment) pops to the right
  const show = (n, back = false) => {
    const from = current; current = n;
    SCREENS.forEach(k => { if (k !== n && k !== from) q('.gd-' + k).className = `scr gd-${k} off-r snap`; });   // out of sight: no slide
    q('.gd-' + from).className = `scr gd-${from} ${back ? 'off-r' : 'off-l'}`; q('.gd-' + n).className = `scr gd-${n}`;
  };
  const type = async (node, text, cps = 22) => { node.closest('label, .gd-cf')?.classList.add('focus', 'has'); await typeInto(api, node, text, cps); node.closest('label, .gd-cf')?.classList.remove('focus'); };
  const typeField = (k, text, cps) => type(q(`.gd-u[data-f="${k}"] em`), text, cps);
  const set = (k, text) => { const f = q(`.gd-u[data-f="${k}"]`); $(f, 'em').textContent = text; f.classList.add('has', 'filled'); };
  const busy = async (node, ms) => { node.classList.add('busy'); await api.wait(ms); node.classList.remove('busy'); };   // the app is working
  const sheet = (sel, on) => { q(sel).classList.toggle('up', on); q('.gd-pay').classList.toggle('dim', !!qq('.gd-pay .up').length); };

  const reset = () => {
    ui.classList.add('no-anim'); current = 'bag';
    SCREENS.forEach(k => q('.gd-' + k).className = `scr gd-${k}${k === 'bag' ? '' : ' off-r'}`);
    qq('.gd-u').forEach(f => { f.classList.remove('has', 'focus', 'filled'); $(f, 'em').textContent = ''; });
    qq('.gd-cf').forEach(f => { f.classList.remove('has', 'focus', 'ok'); $(f, 'em').textContent = ''; });
    qq('.gd-sugg, .gd-sugg span, .gd-opt, .gd-radio, .gd-apply, .gd-points, .gd-sel, .gd-spin, .gd-err, .gd-methods, .gd-newcard, .gd-alert, .gd-pay, .gd-placed, .gd-cvv').forEach(n => n.classList.remove('on', 'up', 'dim', 'pick'));
    q('.gd-cvv').textContent = ''; qq('.gd-sumv').forEach(v => v.textContent = TOTAL); q('.gd-apply').textContent = 'APPLY'; q('.gd-pts').textContent = '0';
    qq('.busy').forEach(n => n.classList.remove('busy'));
    qq('.gd-addr .gd-cta, .gd-ship .gd-cta, .gd-paycta').forEach(b => b.classList.add('off'));
    q('.gd-paycta').textContent = 'SELECT OPTION';
    pick = null; annotate(null);
    requestAnimationFrame(() => requestAnimationFrame(() => ui.classList.remove('no-anim')));
  };

  // the payment sheet → the saved card, verified by its CVV
  const saved = async () => {
    const row = q('.gd-pm[data-p="saved"]');
    if (!pick) await tap(api, ui, row);
    q('.gd-spin').classList.add('on'); await api.wait(900);
    q('.gd-alert').classList.add('on'); await api.wait(700);
    await type(q('.gd-cvv'), '444', 8); await api.wait(500);
    await tap(api, ui, q('.gd-alpay')); await busy(q('.gd-alpay'), 900);
    q('.gd-alert').classList.remove('on'); sheet('.gd-methods', false); q('.gd-spin').classList.remove('on');
  };
  // → a new card, typed into the API's form
  const fresh = async () => {
    if (!pick) await tap(api, ui, q('.gd-pm.add'));
    sheet('.gd-methods', false); await api.wait(250);
    sheet('.gd-newcard', true); await api.wait(800);
    for (const [k, v] of [['num', '4242 4242 4242 4242'], ['exp', '11 / 34'], ['cvv', '222']]) {
      const f = q(`.gd-cf[data-f="${k}"]`); await type($(f, 'em'), v, 20); f.classList.add('ok'); await api.wait(200);
    }
    await api.wait(500); await tap(api, ui, q('.gd-blue')); await busy(q('.gd-blue'), 900);
    sheet('.gd-newcard', false);
  };
  // the sheet's note plays once per loop; its counterpart (what the refactor let us fix) follows while the phone works
  const paySheet = async (first = true) => {
    await tap(api, ui, q('.gd-paycta')); pick = null;
    sheet('.gd-methods', true); await api.wait(first ? 600 : 1400);
    if (first) { await note('sheet', q('.gd-methods .gd-sh b')); await say('fixed'); }
  };

  // every note gets its full reading time; a global note can play while the phone keeps working
  const READ = 4.7; let noteAt = -1e9;
  const hold = async () => { const left = READ - (api.S.t - noteAt); if (left > 0) await api.wait(left * 1000); };
  const say = async (k, target = null) => { if (!SHOW_NOTES) return; await hold(); annotate(k, target); noteAt = api.S.t; };
  // parked notes: the screen a note held still gets a short look
  const note = async (k, target) => { if (!SHOW_NOTES) { await api.wait(1400); return; } await say(k, target); await hold(); };
  const countUp = async (node, to, ms) => { const t0 = api.S.t; while (api.S.t - t0 < ms / 1000) { node.textContent = Math.round(to * Math.min(1, (api.S.t - t0) * 1000 / ms)); await api.wait(40); } node.textContent = to; };

  let round = 0;
  api.flow(async () => {
    if (round) {                                                    // the loop turns over while the phone's back is to us
      if (P.st && !api.reduce) { P.st.vy -= 16; P.st.vp += 4.5; P.st.rel = api.S.t; }
      await api.wait(250);                                          // back to us: swap now
    }
    reset(); noteAt = -1e9;
    const declineFirst = round++ % 2 === 1;
    await api.wait(round > 1 ? 1300 : 900);
    await note('brief');                                            // the brief stays up through the address
    await api.wait(1100);                                          // the bag, as it is: nothing to scroll to
    await tap(api, ui, q('.gd-bag .gd-cta')); show('addr'); await api.wait(800);
    // the address: names, then a civic number brings up the address
    await typeField('first', 'Martine'); await typeField('last', 'Denis');
    await typeField('street', '5592', 9); q('.gd-sugg').classList.add('on'); await api.wait(1800);
    const s = q('.gd-sugg span[data-i="1"]'); await tap(api, ui, s); s.classList.add('pick'); await api.wait(250);
    q('.gd-sugg').classList.remove('on'); set('street', '5592 rue Ferrier'); set('city', 'Laval'); set('postal', 'H7P 5P9'); await api.wait(600);
    await typeField('phone', '(514) 852-6354'); q('.gd-addr .gd-cta').classList.remove('off'); await api.wait(400);
    await tap(api, ui, q('.gd-addr .gd-cta')); await busy(q('.gd-addr .gd-cta'), 800);   // validating the address
    show('conf'); await api.wait(700);
    q('.gd-sel').classList.add('on'); await api.wait(2200);
    await tap(api, ui, q('.gd-conf .gd-cta')); show('ship'); await api.wait(1200);
    await say('ship');
    await tap(api, ui, q('.gd-opt[data-i="1"]')); q('.gd-opt[data-i="1"]').classList.add('on'); q('.gd-ship .gd-cta').classList.remove('off'); await api.wait(1400);
    await tap(api, ui, q('.gd-ship .gd-cta')); show('pay'); await api.wait(900);
    // payment: points first, then the option
    await api.wait(1200);
    await tap(api, ui, q('.gd-apply')); await busy(q('.gd-apply'), 700);
    q('.gd-points').classList.add('on'); q('.gd-apply').textContent = 'APPLIED'; qq('.gd-sumv').forEach(v => v.innerHTML = `<s>${TOTAL}</s> ${PAID}`); await api.wait(900);
    await tap(api, ui, q('.gd-radio[data-r="cc"]')); q('.gd-radio[data-r="cc"]').classList.add('on');
    const cta = q('.gd-paycta'); cta.textContent = 'PAY WITH CREDIT CARD'; cta.classList.remove('off'); await api.wait(800);
    await paySheet();
    const path = pick || (declineFirst ? 'new' : 'saved');
    if (path === 'new') {
      await fresh();
      show('proc'); await api.wait(1900);
      show('pay', true); q('.gd-err').classList.add('on'); await api.wait(450);
      await note('error', q('.gd-err span')); annotate(null);
      q('.gd-err').classList.remove('on'); await api.wait(300);
      await paySheet(false); pick = null;
    }
    await saved();
    show('proc'); await say('releases'); await api.wait(1900);
    show('done'); await api.wait(300); q('.gd-placed').classList.add('on'); await api.wait(1000);
    await countUp(q('.gd-pts'), 45, 700);
    await note('done'); annotate(null);
    await api.wait(400);
  });
}
