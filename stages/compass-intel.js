/* Compass, intelligence (white-label): why we stopped making chat the destination.
   The live chat as people met it in testing, on an anonymous dashboard. One abandoned start, then the question.
   The chat opens and the page behind it goes dark: the conversation is the whole story. Every answer restates the
   dashboard, asks for context the screen already shows, or offers generic tips; the AI has the data, only the
   person knows why. Beside the cursor, what they think and feel, from patient to furious. The clock keeps running,
   the useful answers stay at zero, and they close the chat for good: trust is gone. */
import { $, $$, el, desk, css } from './core.js';
css('compass');

const spark = '<svg class="ci-sp" viewBox="0 0 24 24"><path d="M12 3l1.7 5.6L19 10l-5.3 1.5L12 17l-1.7-5.5L5 10l5.3-1.4zM18.5 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor"/></svg>';
const send = '<svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor"/></svg>';
const line = (pts, up = true) => `<svg class="ci-spark ${up ? 'up' : 'dn'}" viewBox="0 0 60 20"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const WEEK = [62, 71, 58, 66, 74, 49, 44];   // revenue by day, in $k; the weekend dips

const DASH = `
<section class="ci-page ci-dash">
  <main class="ci-main">
    <div class="ci-hd"><b>Overview</b><span>This week</span></div>
    <div class="ci-ask"><div class="ci-ah">${spark}<div><b>Ask AI</b><span>Get quick insights about your store, customers and sales.</span></div></div>
      <div class="ci-in"><em class="ci-q"></em><i class="ci-caret"></i><span class="ci-ph">Ask a question about your business…</span><span class="ci-send">${send}</span></div>
      <div class="ci-sugg"><span>What sold best last week?</span><span>How will sales look next month?</span><span>Which customers are at risk?</span></div></div>
    <div class="ci-kpis">
      <div><span>Revenue</span><b>$48,210</b><em class="up">↑ 6%</em>${line('0,16 10,13 20,14 30,9 40,10 50,5 60,6')}</div>
      <div><span>Visitors</span><b>12,940</b><em class="up">↑ 9%</em>${line('0,15 10,14 20,11 30,12 40,8 50,9 60,5')}</div>
      <div><span>Conversion</span><b>2.8%</b><em class="dn">↓ 0.4 pts</em>${line('0,6 10,8 20,7 30,11 40,10 50,13 60,14', false)}</div>
      <div><span>Average order</span><b>$61.40</b><em class="up">↑ 1%</em>${line('0,14 10,12 20,13 30,10 40,11 50,8 60,9')}</div></div>
    <div class="ci-two"><div class="ci-box"><h5>Revenue by day <small>View report</small></h5><div class="ci-bars">${WEEK.map((v, i) => `<span><i style="height:${v}%"></i><small>${'MTWTFSS'[i]}</small></span>`).join('')}</div></div>
      <div class="ci-box"><h5>Top products <small>View all</small></h5>${[['Linen shirt', '412 sold', '$18,540'], ['Canvas tote', '388 sold', '$9,700'], ['Wool beanie', '251 sold', '$6,275'], ['Leather belt', '197 sold', '$7,880']].map(r => `<div class="ci-or"><span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span></div>`).join('')}</div></div>
  </main>
  <i class="ci-shade"></i>
  <aside class="ci-chat"><div class="ci-chh"><span class="ci-av">${spark}</span><div><b>Ask AI</b><small>Answers from your store data</small></div><span class="ci-x"><svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg></span></div>
    <div class="ci-msgs"><div class="ci-bot">Hi! I can help you find insights, answer questions, and suggest next steps. What would you like to know?</div><div class="ci-typing"><i></i><i></i><i></i></div></div>
    <div class="ci-cin"><em class="ci-q ci-cq"></em><i class="ci-caret"></i><span class="ci-cph">Ask a question…</span><span class="ci-go">${send}</span></div><small class="ci-disc">AI can make mistakes. Check important information.</small></aside>
</section>`;

export const CI_DASH = DASH;   // the case page's images draw the same dashboard (tools/case_shots/compass-intel.js)

// The conversation, as testing showed it: each answer is plausible, none uses what the person knows.
// [who, text, what they think after it (mood 0 calm → 4 furious)]
export const TALK = [
  ['bot', 'Your conversion this week is 2.8%, down 0.4 points from last week. Conversion can drop for many reasons, like traffic quality, pricing or seasonality. Would you like tips to improve it?', ['I can see that. Why?', 1]],
  ['me', 'I can see that. Why is it down?'],
  ['bot', 'I don’t have enough information to tell why. Which store and time period do you mean?', ['It’s right on my screen…', 2]],
  ['me', 'This store. This week. It’s on screen.'],
  ['bot', 'Thanks! This week, conversion is 2.8%, 0.4 points lower than last week. Here are three ways to raise it:<ol><li>Add product recommendations</li><li>Run a promotion</li><li>Simplify checkout</li></ol>', ['I didn’t ask for tips.', 3]],
  ['me', 'We changed prices Monday. Is that it?'],
  ['bot', 'I don’t have information about price changes. Could you share which prices changed, by how much and when?', ['I’m wasting my time.', 3]],
];
const PACE = 9;                       // their clock: one second on the stage is nine in their day

export function mount(api) {
  const { world, S } = api;
  world.insertAdjacentHTML('beforeend', `<span class="ci-era rise"><i></i><b>Live chat, as tested</b><em></em></span>`);
  const D = desk(api, { w: 1280, minScale: 0.5, smallScale: 0.68, html: `<div class="ci">${DASH}</div>` });
  const ui = D.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  const era = $(world, '.ci-era'), eraT = $(era, 'b'), eraC = $(era, 'em');
  const Q = q('.ci-in .ci-q'), CQ = q('.ci-cq'), msgs = q('.ci-msgs'), dots = q('.ci-typing');

  /* what they think, beside the cursor: the colour carries how bad it is */
  D.cur.classList.add('ci-hand');
  D.cur.insertAdjacentHTML('beforeend', '<b class="ci-think"></b>');
  const thought = $(D.cur, '.ci-think');
  api.frame(() => { const l = D.cx > ui.offsetWidth - 340; if (l !== thought.classList.contains('l')) thought.classList.toggle('l', l); });   // near the edge, it reads to the left
  const think = (text, mood = 0) => {
    thought.className = 'ci-think' + (text ? ` on m${mood}` : '') + (D.cx > ui.offsetWidth - 340 ? ' l' : '');
    if (text) { thought.textContent = text; void thought.offsetWidth; thought.classList.add('pop'); }
  };

  /* the time it costs, against what it returns */
  const clock = { from: null, to: null };
  api.frame(() => {
    if (clock.from === null) { if (eraC.textContent) eraC.textContent = ''; return; }
    const sec = Math.floor(((clock.to ?? S.t) - clock.from) * PACE), m = Math.floor(sec / 60), t = `${m}:${String(sec % 60).padStart(2, '0')}`;
    const v = world.classList.contains('is-small') ? `${t} · 0 answers` : `${t} in chat · 0 useful answers`;
    if (eraC.textContent !== v) eraC.textContent = v;
    era.classList.toggle('late', m >= 4);
  });

  const bubble = (who, text) => {
    const b = el(`<div class="${who === 'me' ? 'ci-user' : 'ci-bot'}"></div>`);
    if (who === 'me') b.textContent = text; else b.innerHTML = text;
    msgs.insertBefore(b, dots);
  };
  const enter = async node => { node.classList.add('is-pressed'); await api.wait(140); node.classList.remove('is-pressed'); };   // Return, not a click
  const reply = async (html, after) => {
    dots.classList.add('on'); await api.wait(1700); dots.classList.remove('on');
    bubble('bot', html); await api.wait(700);
    await D.move(qq('.ci-msgs > .ci-bot').pop(), { ax: 0.7, ay: 0.85, dur: 600 });           // reading it
    await api.wait(500 + html.replace(/<[^>]+>/g, '').length * 20);
    if (after) { think(...after); await api.wait(1500); }
  };
  const ask = async text => {
    await D.click(q('.ci-cin'), { ax: 0.3 }); ui.classList.add('ci-cfocus'); think(''); await api.wait(350);
    await D.type(CQ, text, { cps: 16 }); await api.wait(250);
    await enter(q('.ci-go')); ui.classList.remove('ci-cfocus');
    CQ.textContent = ''; bubble('me', text); await api.wait(400);
  };

  const reset = () => {
    ui.className = 'dsk-ui no-anim'; clock.from = clock.to = null; era.classList.remove('late', 'quit'); eraT.textContent = 'Live chat, as tested';
    Q.textContent = ''; CQ.textContent = ''; dots.classList.remove('on'); think('');
    qq('.ci-msgs > .ci-user, .ci-msgs > .ci-bot').slice(1).forEach(b => b.remove());
    requestAnimationFrame(() => requestAnimationFrame(() => ui.classList.remove('no-anim')));
  };

  api.flow(async () => {
    reset();
    D.look(q('.ci-ask'));
    await api.wait(900);
    clock.from = S.t;                                                 // from here, it is their time
    await D.click(q('.ci-in'), { ax: 0.25 }); ui.classList.add('ci-focus'); think('What do I even ask?'); await api.wait(500);
    await D.type(Q, 'How are we doing', { cps: 16 }); await api.wait(600);
    await D.erase(Q, Q.textContent.length, { cps: 40 }); think('Just ask it.'); await api.wait(300);
    await D.type(Q, 'Why is conversion down?', { cps: 17 }); await api.wait(300);
    await enter(q('.ci-send')); think('');
    const first = Q.textContent; Q.textContent = ''; ui.classList.remove('ci-focus');
    ui.classList.add('ci-chaton'); D.look(q('.ci-chat')); await api.wait(650);
    bubble('me', first); await api.wait(300);
    // the back and forth: it has the data, not the reason
    for (const [who, text, after] of TALK) { if (who === 'bot') await reply(text, after); else await ask(text); }
    // out of patience
    think('%@#$@!', 4); await api.wait(1700);
    clock.to = S.t; era.classList.add('quit'); eraT.textContent = 'Trust: gone';
    await D.click(q('.ci-x')); ui.classList.remove('ci-chaton'); think('Never again.', 4); D.look(q('.ci-ask'));
    await api.wait(3200); think('');
    await api.wait(900);
  });
}
