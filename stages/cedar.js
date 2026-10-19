/* Cedar: the agent lives in the inbox. The full flow from the case, on the NexGen phone.
   Phone off → "new job openings ready to review" → the agent's email → swipe-right onboarding → five job cards
   (one opened to its full specifications and read, two swiped right, three left) → "no more jobs for today" →
   three seconds later the application package email → the pre-filled Greenhouse form → submit → success.
   Then the screen goes dark and it starts again, seamlessly. The reader can thumb any card up or down. */
import { el, $, $$, css, tap, statusBar } from './core.js';
import { glPhone } from './phone3d.js';
css('cedar');

const LOGO = 'img/cedar-logo.png';
const logo = (s = 36, c = '') => `<img class="cd-logo ${c}" src="${LOGO}" style="width:${s}px;height:${s}px" alt="">`;
const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arch: '<svg viewBox="0 0 24 24"><path d="M4 5h16v4H4zM5 9h14v10H5zM10 13h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path d="M10 7L5 12l5 5M5 12h9a5 5 0 0 1 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.7 5.4-.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M7 11v9H4v-9zM7 11l4-7c1.4 0 2.3 1 2 2.4L12.4 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7" fill="currentColor"/></svg>',
  ok: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#5FCD84"/><path d="M7 10l2 2 4-4" fill="none" stroke="#2B3732" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  soon: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#FFE85A"/><path d="M7 10l2 2 4-4" fill="none" stroke="#2B3732" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  no: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#F06A6A"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  mark: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#171918"/><g fill="#F5FBF9" transform="translate(5 5) scale(.0459)"><path d="M371.2,161h-42.4c-4.9,0-9.6-2.1-12.9-5.8l-17.2-19.4c-2.6-2.9-6.2-4.6-10.1-4.6s-7.5,1.7-10.1,4.6l-14.8,16.7 c-4.8,5.4-11.8,8.6-19,8.6H12.6C6,179.8,1.7,199.7,0,220.4h219.1c3.9,0,7.5-1.6,10.2-4.4l20.4-21.3c2.5-2.7,6.1-4.2,9.7-4.2h0.8 c3.9,0,7.5,1.7,10.1,4.6l17.2,19.4c3.3,3.7,8,5.8,12.9,5.8h178.8c-1.7-20.6-6-40.6-12.6-59.4L371.2,161L371.2,161z"/><path d="M132.6,345.2c3.9,0,7.5-1.6,10.2-4.4l20.4-21.3c2.6-2.7,6.1-4.2,9.8-4.2h0.8c3.9,0,7.6,1.7,10.1,4.5l17.2,19.4 c3.3,3.7,8,5.8,12.9,5.8h242.4c9.1-18.8,15.7-38.9,19.7-60H243.4c-4.9,0-9.6-2.1-12.9-5.8L213.3,260c-2.6-2.9-6.2-4.5-10.1-4.5 s-7.6,1.7-10.1,4.5l-14.8,16.7c-4.8,5.5-11.8,8.6-19.1,8.6H3.3c4,21.1,10.6,41.2,19.7,60L132.6,345.2L132.6,345.2z"/><path d="M304.5,96.1c3.9,0,7.5-1.6,10.2-4.4l20.4-21.3c2.5-2.7,6.1-4.2,9.8-4.2h0.8c3.9,0,7.5,1.7,10.1,4.6L373,90.3 c3.3,3.7,8,5.8,12.9,5.8H432C388.1,37.7,318.3,0,239.7,0S91.2,37.7,47.3,96.1H304.5z"/><path d="M212,404.7h-63c-4.9,0-9.6-2.1-12.9-5.8l-17.2-19.4c-2.6-2.9-6.2-4.5-10.1-4.5s-7.6,1.7-10.1,4.5l-14.8,16.7 c-4.8,5.5-11.8,8.6-19.1,8.6h-1c43.9,47,106.4,76.5,175.9,76.5s131.9-29.5,175.9-76.5L212,404.7L212,404.7z"/></g></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ok2: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#5FCD84"/><path d="M7 10l2 2 4-4" fill="none" stroke="#2B3732" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  no2: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#F1767D"/><path d="M8 8l4 4M12 8l-4 4" stroke="#2B3732" stroke-width="1" stroke-linecap="round"/></svg>',
  money: '<svg viewBox="0 0 24 24"><path d="M3 6l18-2v14L3 20zM6 8v8m12-9v8"/><circle cx="12" cy="12" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M4 8h6l2-4m-7 9h5l2 5-2 3m9-15-5 5 2 3h5"/></svg>',
  building: '<svg viewBox="0 0 24 24"><path d="M4 21V8l7-4v17m0-11 9-3v14M2 21h20M7 9v2m0 3v2m8-5v2m3-3v2m-3 4v2m3-3v2"/></svg>',
  people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/></svg>',
  pin: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#E7F7EE"/><path d="M10 15s-4-3.6-4-7a4 4 0 0 1 8 0c0 3.4-4 7-4 7z" fill="none" stroke="#1FAE5C" stroke-width="1.4"/></svg>',
};

// Fixed artwork coordinates from the 390-point reference, including its quiet, uneven star field.
const STARS = [[134,11,6,0],[272,4,6,0],[27,64,6,2],[132,57,10,0],[167,49,13,3],[231,55,6,2],[287,56,8,0],[284,64,22,0],[363,47,9,4],[205,72,14,2],[311,92,14,2],[44,113,14,3],[66,126,23,1],[105,119,12,0],[117,106,24,4],[288,110,8,0],[279,126,14,1],[359,127,6,2],[16,182,23,0],[26,161,10,0],[92,165,14,2],[102,177,8,0],[278,169,6,2],[298,175,24,1],[303,191,9,0],[0,111,7,0],[2,193,7,2],[390,167,6,0]];
const sparkles = () => `<svg class="cd-spk" viewBox="0 0 390 220" aria-hidden="true">${STARS.map(([x,y,s,c]) => `<path fill="${['#DCE2E0','#C3CECA','#939F9B','#2B3732','#2CDA91'][c]}" transform="translate(${x} ${y}) scale(${s/20})" d="M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z"/>`).join('')}</svg>`;

/* five openings: the first is read in full and liked, then left, right, left, left */
const JOBS = [
  { co: 'Aptos', role: 'Senior Engineer', sub: 'Labs. Great fit. Matches tech stack, salary, remote, and crypto.', pros: ['180K USD salary', 'Entirely remote', 'Seed', 'React Native, TypeScript'], cons: ['Based in Europe', 'Lower salary', 'Small team'], dir: 1, spec: true },
  { co: 'OpenAI', role: 'Senior Engineer', sub: 'Labs. Great fit. Matches tech stack, salary, remote.', pros: ['180K USD salary', 'React Native, TypeScript'], cons: ['Based in Europe', 'On-site 3 days'], dir: -1 },
  { co: 'Super.com', role: 'Software Engineering Intern', sub: 'Fintech. Internal tools. Remote, Waterloo Winter 2025.', pros: ['Entirely remote', 'Python, React', 'Internal tools'], cons: ['Internship length'], dir: 1 },
  { co: 'Databricks', role: 'Platform Engineer', sub: 'Data. Strong stack match, senior level.', pros: ['Distributed systems', 'Kubernetes'], cons: ['5+ years required', 'Not remote'], dir: -1 },
  { co: 'Shopify', role: 'Mobile Engineer', sub: 'Commerce. React Native match.', pros: ['React Native, TypeScript', 'Remote'], cons: ['Contract role', 'Lower salary'], dir: -1 },
];
const chips = a => `<div class="cd-chips">${a.map(t => `<span>${t}</span>`).join('')}</div>`;
const DETAILS = `<div class="cd-details"><h4>Key details</h4><div class="cd-kv"><span>${I.money}<em>$180,000 USD</em></span><span>${I.globe}<em>Remote</em></span><span>${I.globe}<em>Europe</em></span></div>
    <h4>Required skills</h4>${chips(['GraphQL', 'React Native', 'Electron', 'Prosemirror', 'MobX', 'Node'])}
    <h4>Job perks</h4>${chips(['Unlimited vacation', 'Learning budget'])}
    <h4>Culture &amp; value</h4>${chips(['Challenging', 'Craft', 'Empathy'])}
    <h4>Job description</h4><h5>What you&rsquo;ll do:</h5>
    <ul class="cd-bul"><li>Build new user-facing features with everything from database models to GraphQL resolvers and UI components</li><li>Optimize our data synchronization stack by applying better serialization techniques</li><li>Add real-time collaborative editing to our content editor</li><li>Improve performance by profiling and tweaking critical paths</li><li>Open-source any non-trivial innovations that come out of our work on the product</li></ul>
    <h5>Tech:</h5><ul class="cd-bul"><li>React frontend with Styled Components, utilizing hooks for the composability of functionality</li><li>Proprietary data synchronization library built for speed and offline support</li><li>Electron desktop application</li><li>Node, Postgres, and Redis in the backend, hosted on Google Cloud with k8s</li><li>Design system with React component library</li></ul>
    <h4>Aptos</h4><p class="cd-about">Aptos allows users to manage software development and track bugs.</p>
    <div class="cd-kv col"><span>${I.building}<em>Founded in 2019 · San Francisco</em></span><span>${I.building}<em>HQ in Europe</em></span><span>${I.globe}<em>Developer platform, developer tools</em></span><span>${I.people}<em>10–200 people</em></span></div>
  </div>`;
const detailFor = j => j.spec ? DETAILS : `<div class="cd-details"><h4>Role</h4><p>${j.role} at ${j.co}</p><h4>Why Cedar matched this role</h4>${chips(j.pros)}<h4>Things to consider</h4>${chips(j.cons)}</div>`;
const companyMark = j => j.co === 'Aptos' ? I.mark : logo(32);   // no logo of its own: Cedar's mark, never a letter
const card = (j, i) => `<article class="cd-card${i === 0 ? ' cd-front' : ''}" style="--k:${i}" data-i="${i}" aria-label="${j.role} at ${j.co}"><div class="cd-cview"><div class="cd-cbody">
  <div class="cd-head">${companyMark(j)}</div>
  <h3 data-drag="cd-card">${j.role} at ${j.co}</h3><p data-drag="cd-card">${j.sub}</p>
  <ul class="cd-list" data-drag="cd-card">${j.pros.map(t => `<li>${I.ok2}${t}</li>`).join('')}${j.cons.map(t => `<li>${I.no2}${t}</li>`).join('')}</ul>
  <button type="button" class="cd-spec" data-act="cd-spec">View specifications</button>
  ${detailFor(j)}</div></div>
  <button type="button" class="cd-x" data-act="cd-close" aria-label="Close job details">${I.x}</button>
  <b class="cd-stamp yes">Interested</b><b class="cd-stamp nope">Pass</b>
  <div class="cd-votes"><button type="button" class="cd-v down" data-act="cd-down" aria-label="Pass on this job">${I.up}</button><button type="button" class="cd-v up" data-act="cd-up" aria-label="Interested in this job">${I.up}</button></div></article>`;


const email = (cls, subj, time, body) => `<section class="scr ${cls} off-r">
  ${statusBar()}
  <div class="gm-bar"><button type="button" data-act="cd-mail-back" aria-label="Back to inbox">${I.back}</button><span class="r">${I.arch}${I.trash}${I.mail}${I.more}</span></div>
  <div class="gm-viewport"><div class="gm-scroll"><h1 class="gm-subj">${subj} <span class="gm-tag">Inbox</span><span class="gm-s">${I.star}</span></h1>
    <div class="gm-from">${logo(38)}<div><b>Agent Cedar</b> <span>${time}</span><div class="gm-to">to me ▾</div></div><span class="r">${I.reply}${I.more}</span></div>
    <div class="gm-body">${body}</div></div></div>
  <div class="gm-actions"><span>${I.reply} Reply</span><span>Forward</span></div></section>`;

const inboxRow = (sender, subject, preview, time, avatar, cls = '') => `<div class="gm-row ${cls}"><span class="gm-ltr">${avatar}</span><div class="gm-message"><div class="gm-l1"><b>${sender}</b><span>${time}</span></div><div class="gm-l2">${subject}</div><div class="gm-l3">${preview}</div></div><span class="gm-star">${I.star}</span></div>`;
const UI = `
<section class="scr cd-off"><div class="cd-lock"><svg class="cd-lock-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10" width="12" height="10" rx="3" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="2.5"/></svg><span>Wednesday, October 14</span><b>9:41</b></div><div class="cd-home-indicator" aria-hidden="true"></div></section>
<section class="scr cd-inbox off-r">
  ${statusBar()}
  <div class="gm-top"><div class="gm-search"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><em>Search in mail</em><span class="gm-me">T</span></div></div>
  <div class="gm-cat">Primary</div>
  <div class="gm-category"><span class="gm-category-icon social"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 6a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span><div><b>Social</b><span>Twitter, Twitter Messenger</span></div><em>2 new</em></div>
  <div class="gm-category"><span class="gm-category-icon promotions"><svg viewBox="0 0 24 24"><path d="M3 4h10l9 9-9 9-10-10z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="9" r="1.5"/></svg></span><div><b>Promotions</b><span>Adobe, New Arrivals, Slack</span></div><em>12 new</em></div>
  <button type="button" class="cd-inbox-open" data-act="cd-open-mail" aria-label="Open email from Agent Cedar">${inboxRow('Agent Cedar', 'Hey, just wanted to give you a heads up', 'I found a few jobs you might want to see.', '11:07 AM', logo(40), 'cd-new')}</button>
  <div class="gm-muted">
    ${inboxRow('Stephanie Garrett', 'How did we meet again?', 'I wanted to hear all about your new role…', '11:04 AM', '<span class="gm-avatar av1">S</span>')}
    ${inboxRow('Scotiabank Online', 'Your account statement is available', 'Take a moment to review your latest activity.', '10:41 AM', '<span class="gm-avatar av2">S</span>')}
    ${inboxRow('Taylor Gray', 'Weekend restaurant?', 'We should get together sometime soon.', 'Sep 6', '<span class="gm-avatar av3">T</span>')}
    ${inboxRow('Design community', 'This week’s creative inspiration', 'A few new ideas we thought you might like.', 'Sep 6', '<span class="gm-avatar av4">D</span>')}
  </div>
</section>
${email('cd-m1', 'Hey, just wanted to give you a heads up—I found a few Software Engineering Intern roles that might be right up your alley. Take a look! 👉', '11:07 AM', `
  <p>Hey Tony,</p><p>It&rsquo;s time for your daily review! I looked through <b>238,875</b> relevant jobs in my database and found some exciting opportunities for you.</p>
  <p>There are a few fully remote Software Engineering Intern roles available that match your experience with Python and React, and you&rsquo;ll be working on some cool projects, like developing internal tools for a fast-growing company.</p>
  <p><a href="#" class="cd-l1" data-act="cd-matches">Explore Today&rsquo;s Job Matches</a></p>
  <p class="gm-sig">Agent Cedar<br>The World&rsquo;s First AI Talent Agent<br><a>www.getcedar.ai</a></p>
  <p class="gm-fyi">FYI: Want to adjust your email notifications or job matching settings? You can simply reply to this email or <a>click here</a>.</p>`)}
<section class="scr cd-intro off-r">
  <div class="sb-dark">${statusBar()}</div>
  ${sparkles()}
  <div class="cd-demo"><div class="cd-mini">${I.up}</div><i class="cd-trail"></i></div>
  <h2>Swipe <em>right</em></h2><p>If you like a job description, swipe right and Cedar will send you an application package.</p>
  <button type="button" class="cd-btn cd-go" data-act="cd-open-jobs">View job openings</button>
</section>
<section class="scr cd-jobs off-r">
  <div class="sb-dark">${statusBar()}</div>
  <div class="cd-photo" aria-hidden="true"></div>
  <div class="cd-deck">${JOBS.map(card).reverse().join('')}</div>
  <div class="cd-bg-note">${logo(22)}<span>Preparing your application package…</span></div>
</section>
<section class="scr cd-done off-r">
  <div class="sb-dark">${statusBar()}</div>
  ${sparkles()}
  ${logo(64, 'big')}
  <h2>No more jobs<br><em>for today</em></h2>
  <p class="cd-summary">Great, you swiped <span class="cd-liked">2</span> jobs right. Check your email for the job applications.</p>
  <div class="cd-more"><h3>Want more?</h3><p>Try our premium Cedar+<br>service for free</p>
    <ul><li>${I.ok}5x more job recommendations</li><li>${I.ok}Auto-apply to save you time</li><li>${I.ok}Direct support from founders</li><li>${I.soon}Network monitoring (soon)</li><li>${I.soon}Hiring manager intros (soon)</li></ul>
    <button type="button" class="cd-btn sm" data-off aria-label="Try Cedar+, preview only">Try Cedar+</button></div>
</section>
${email('cd-m2', 'Application Package for Software Engineering Intern - Internal Tools - (Remote) Waterloo Winter 2025 at Super.com', '11:21 AM', `
  <p>Tony - I&rsquo;ve prepared an application package for you to review and submit for the <a href="#" class="cd-l2" data-act="cd-application">Software Engineering Intern - Internal Tools - (Remote) Waterloo Winter 2025</a> position at Super.com</p>
  <ol><li><b>Company Backgrounder [attached]:</b> Super.com is a fast-growing fintech company that has raised over $200 million in funding and processed over $2 billion in sales</li>
  <li><b>Draft Application Form [attached]:</b> I&rsquo;ve prepared 9 of the 20 questions based on my knowledge base on you, saving you 2 mins of work.</li>
  <li><b>Estimated Time to Submit:</b> 4 mins</li></ol>
  <p>For any further assistance or adjustments, please reply to this email and let me know.</p>
  <p><a>Upgrade to Cedar+</a> and get more interviews — let Cedar handle the applications, freeing you to secure the best offer and level up your career.</p>`)}
<section class="scr cd-gh off-r">
  <div class="sb-dark">${statusBar()}</div>
  <div class="gh-bar"><svg viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="6.5" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>job-boards.greenhouse.io</div>
  <div class="gh-scroll">
    <div class="gh-co"><b>super<i>.</i>com</b></div>
    <h2>Software Engineering Intern - Internal Tools (Remote)</h2><p class="gh-loc">Waterloo, Ontario · Winter 2025</p>
    <h3>Apply for this job</h3><p class="gh-req">* indicates a required field</p>
    ${[['First Name*', 'Tony'], ['Last Name*', 'Nguyen'], ['Email*', 'tony.nguyen@uwaterloo.ca'], ['Phone*', '(519) 555-0142']].map(([l, v]) => `<label class="gh-f"><span>${l}</span><em>${v}</em></label>`).join('')}
    <div class="gh-f file"><span>Resume/CV*</span><em><i>PDF</i>Tony_Nguyen_Resume.pdf</em></div>
    <label class="gh-f"><span>LinkedIn Profile</span><em>linkedin.com/in/tonynguyen</em></label>
    <label class="gh-f"><span>Are you legally authorized to work in Canada?*</span><em>Yes</em></label>
    <label class="gh-f tall"><span>Why are you interested in Super.com?*</span><em>I&rsquo;ve built internal tools for my co-op team in Python and React, and I want to keep shipping tools that make a fast-growing team faster. Super.com&rsquo;s focus on saving people money resonates with me.</em></label>
    <label class="gh-f"><span>When can you start?*</span><em>January 6, 2025</em></label>
    <label class="gh-f"><span>How did you hear about this job?</span><em>Cedar</em></label>
    <button type="button" class="gh-submit" data-act="cd-submit">Submit application</button>
    <p class="gh-foot">Powered by <b>greenhouse</b></p>
  </div>
</section>
<section class="scr cd-ok off-r">
  <div class="sb-dark">${statusBar()}</div>
  <svg class="cd-streamers" viewBox="0 0 390 844" aria-hidden="true">
    <g><path d="M80 42c3 18-16 30-10 44s21 25 10 50" stroke="#FF9900"/><path d="M34 14c-1 15 22 22 18 35M66 14l-12 19" stroke="#2BBA91"/><path d="M46 338c-5 12-14 20-10 31s14 16 20 22" stroke="#FF9900"/><path d="M28 418c6 12-7 23-6 33" stroke="#7773C0"/><path d="M48 510c16 13-15 33-2 48" stroke="#2BBA91"/></g>
    <g><path d="M310 42c-3 18 16 30 10 44s-21 25-10 50" stroke="#FF9900"/><path d="M356 14c1 15-22 22-18 35M324 14l12 13" stroke="#2BBA91"/><path d="M344 338c5 12 14 20 10 31s-14 16-20 22" stroke="#FF9900"/><path d="M362 418c-6 12 7 23 6 33" stroke="#7773C0"/><path d="M342 510c-16 13 15 33 2 48" stroke="#2BBA91"/></g>
  </svg>
  <div class="cd-confetti" aria-hidden="true">${[[9,64,'#8581BE','e'],[38,79,'#FFC66F','r'],[80,78,'#8581BE','s'],[56,95,'#FF9900','e'],[108,96,'#FF9900','r'],[144,88,'#29AF87','b'],[242,88,'#29AF87','b'],[276,96,'#FF9900','r'],[308,78,'#8581BE','s'],[340,79,'#FFC66F','r'],[336,95,'#FF9900','e'],[377,64,'#8581BE','e'],[19,158,'#FF9900','d'],[42,153,'#FF9900','e'],[344,153,'#FF9900','e'],[363,158,'#FF9900','d'],[24,205,'#8581BE','q'],[355,205,'#8581BE','q'],[31,251,'#FF9695','d'],[351,251,'#FF9695','d']].map(([x,y,c,k],i)=>`<i class="${k}" data-r="${k === 'q' ? 17 : k === 'e' ? 18 : i % 2 ? 18 : -18}" style="left:${x}px;top:${y}px;--c:${c};--r:${i%2?18:-18}deg"></i>`).join('')}</div>
  <span class="cd-congrats">Congratulations!</span>
  ${logo(64, 'big pop')}
  <h2>Application<br><em>successful</em></h2>
  <p>I successfully applied to this role on your behalf. Keep an eye on your inbox. Hoping to hear from Super.com soon.</p>
</section>
<div class="cd-island" aria-hidden="true"><i></i></div>
<button type="button" class="ios-note" data-act="cd-notification"><span class="ios-ic">${logo(38)}</span><div><div class="ios-l1"><b class="n-who">Agent Cedar</b><span>now</span></div><div class="ios-l2 n-txt"></div></div></button>`;

const SCREENS = ['off', 'inbox', 'm1', 'intro', 'jobs', 'done', 'm2', 'gh', 'ok'];
export { UI as CEDAR_UI, SCREENS as CEDAR_SCREENS };   // the case page's flat screenshots render these (tools/cedar_shots.html)

export async function mount(api) {
  const { world } = api;
  // the world: an engineer's desk at night (img/cedar-env.jpg, Tommy's image); Cedar's green glow centred behind the phone
  world.innerHTML = `<div class="cd-env"><i class="cd-env-img"></i></div>`;
  api.frame(() => { world.style.setProperty('--mx', api.S.shx.toFixed(3)); world.style.setProperty('--my', api.S.shy.toFixed(3)); });
  { const key = 'img/cedar-env.jpg'; api.host.dataset.image = key;             // "Change image" replaces this one
    const im = new Image(); im.onload = () => { $(world, '.cd-env-img').style.setProperty('--img', `url(${im.src})`); world.classList.add('cd-has-env'); };
    im.src = window.siteImage ? await window.siteImage(key) : key; }
  const P = await glPhone(api, {
    ui: UI, rim: 0x2cda91, neutralLighting: true, pose: { yaw: -0.36, pitch: -0.05, roll: -0.025 },
    back: (g, w, h) => { const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, '#4BE38E'); gr.addColorStop(1, '#1FAE5C'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0B3D22'; g.font = "600 92px Outfit, sans-serif"; g.textAlign = 'center'; g.fillText('cedar', w / 2, h * 0.58); },
    place: S => { const narrow = S.mobile || S.W < S.H * 1.25; world.classList.toggle('cd-narrow', narrow); return S.mobile ? { h: 0.828, maxW: 0.828 } : { h: 0.86 }; },   // phones: 8% smaller on small screens
  });
  const ui = P.ui, q = s => $(ui, s), qq = s => $$(ui, s);
  // Let screen controls receive their own click instead of the phone's drag-to-turn pointer capture.
  const screenPointerDown = event => {
    if (event.target.closest('[data-act], [data-off], .cd-card.xp')) event.stopPropagation();
  };
  ui.addEventListener('pointerdown', screenPointerDown);
  const scr = n => q('.cd-' + n);
  let current = 'off', accepted = 0, packageReady = false, pending = null, swipeToken = 0, drag = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!api.S.destroyed) fn(); }, ms); timers.add(id); };
  const show = (n, how = 'push') => {
    if (current === n) return;
    const cur = current; current = n;
    SCREENS.forEach(k => { if (k !== n && k !== cur) scr(k).className = `scr cd-${k} off-r`; });
    scr(cur).className = `scr cd-${cur} under ${how === 'fade' ? 'fade' : 'off-l'}`;
    scr(n).className = `scr cd-${n} top`;
    SCREENS.forEach(k => { scr(k).inert = k !== n; scr(k).setAttribute('aria-hidden', String(k !== n)); });
  };
  // A reader's tap can advance the same beat the demonstration is waiting on.
  // Resolves true when the reader made the tap, so the demonstration does not tap the same thing again.
  const beat = async (ms, action) => {
    const slot = { action, resolve: null };
    const user = new Promise(resolve => { slot.resolve = resolve; });
    pending = slot;
    try { return await Promise.race([api.wait(ms).then(() => false), user.then(() => true)]); }
    finally { if (pending === slot) pending = null; }
  };
  const advance = action => {
    if (pending?.action === action) { pending.resolve(); api.skip(); return 'go'; }
  };
  ['cd-notification', 'cd-open-mail', 'cd-matches', 'cd-open-jobs', 'cd-application', 'cd-submit'].forEach(action => {
    api.act(action, () => {
      if (pending?.action === action) return advance(action);
      if (action === 'cd-open-mail' && current === 'inbox') { show(packageReady ? 'm2' : 'm1'); return 'go'; }
    });
  });
  api.act('cd-mail-back', () => { show('inbox'); });
  const note = text => {
    q('.n-txt').textContent = text;
    ui.classList.toggle('cd-locked', current === 'off'); ui.classList.add('cd-note-on');
  };
  // On the lock screen the opened notification fades where it is; it never slides away.
  const dismissNote = () => {
    if (ui.classList.contains('cd-locked') && ui.classList.contains('cd-note-on')) {
      ui.classList.add('cd-note-leaving'); ui.classList.remove('cd-note-on');
      later(() => ui.classList.remove('cd-locked', 'cd-note-leaving'), 400);
    } else ui.classList.remove('cd-note-on', 'cd-locked', 'cd-note-leaving');
  };
  const updateInbox = () => {
    q('.cd-new .gm-l2').textContent = packageReady ? 'Application Package for Software Engineering Intern' : 'Hey, just wanted to give you a heads up';
    q('.cd-new .gm-l3').textContent = packageReady ? 'Your application package for Super.com is ready.' : 'I found a few jobs you might want to see.';
    q('.cd-new .gm-l1 span').textContent = packageReady ? '11:21 AM' : '11:07 AM';
  };
  const live = () => qq('.cd-card').filter(c => !c.classList.contains('gone')).sort((a, b) => a.dataset.i - b.dataset.i);
  const relayer = () => {
    qq('.cd-card').forEach(c => c.classList.remove('cd-front', 'cd-next'));
    live().forEach((c, k) => {
      c.style.setProperty('--k', k); c.classList.toggle('cd-front', k === 0); c.classList.toggle('cd-next', k === 1);
      c.inert = k !== 0; c.setAttribute('aria-hidden', String(k !== 0));
    });
  };
  const reveal = c => $$(c, '.cd-list li').forEach(li => li.classList.add('on'));
  /* Card motion runs per frame on one transform. A drag hands its speed to the throw (a cubic Hermite from the
     release velocity), so the card never stops between being pulled and flying off. */
  const hermite = (s, a, b, va, vb, ms) => { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * a + (s3 - 2 * s2 + s) * ms * va + (3 * s2 - 2 * s3) * b + (s3 - s2) * ms * vb; };
  const POSE = ['--dx', '--dy', '--tilt', '--p'];
  const pose = (c, x) => {
    const ax = Math.abs(x), p = Math.min(1, ax / 90), over = Math.max(0, ax - 96);
    c.style.setProperty('--dx', x.toFixed(2) + 'px');
    c.style.setProperty('--dy', (over * .06 - p * 8).toFixed(2) + 'px');
    c.style.setProperty('--tilt', (Math.sign(x) * (Math.min(ax, 96) / 9.6 + over * .035)).toFixed(3) + 'deg');
    c.style.setProperty('--p', p.toFixed(3));
  };
  // Frame-clock tween. It resolves with the time it ran past its end; the next tween takes that as `lead` and paints
  // its first pose in the same frame, so a pull hands over to its throw without a held frame.
  const stop = c => { if (c._tw) { cancelAnimationFrame(c._raf); const done = c._tw; c._tw = null; done(0); } };
  const tween = (c, ms, step, lead = 0) => new Promise(done => {
    stop(c); const t0 = (document.timeline?.currentTime ?? performance.now()) - lead;
    const tick = now => {
      const t = now - t0, s = Math.min(1, Math.max(0, t / ms)); step(s);
      if (s < 1 && !api.S.destroyed) c._raf = requestAnimationFrame(tick); else { c._tw = null; done(Math.max(0, t - ms)); }
    };
    c._tw = done; step(Math.min(1, lead / ms)); c._raf = requestAnimationFrame(tick);
  });
  const lift = dot => { dot.classList.add('lift'); setTimeout(() => dot.remove(), 320); };
  const openDetails = c => {
    if (!c || c.classList.contains('gone') || c.classList.contains('xp')) return;
    swipeToken++; stop(c); POSE.forEach(k => c.style.removeProperty(k));
    c.style.height = c.offsetHeight + 'px'; void c.offsetHeight;
    c.classList.remove('drag', 'dragging', 'nudge', 'to-r', 'to-l');
    c.classList.add('xp'); c.dataset.read = 'true'; ui.classList.add('cd-xp');
    $(c, '.cd-cview').scrollTop = 0; reveal(c);
  };
  const closeDetails = c => {
    if (!c?.classList.contains('xp')) return;
    $(c, '.cd-cview').scrollTop = 0;
    c.classList.remove('xp'); ui.classList.remove('cd-xp');
    later(() => { if (!c.classList.contains('xp')) c.style.removeProperty('height'); }, 650);
  };
  api.act('cd-spec', button => { if (current === 'jobs') openDetails(button.closest('.cd-card')); });
  api.act('cd-close', button => closeDetails(button.closest('.cd-card')));
  qq('.cd-cview').forEach(view => view.addEventListener('wheel', () => api.takeover(5), { passive: true }));

  // v is the hand's speed in screen points per millisecond; a button press throws from rest with a small flick.
  const finishSwipe = (c, dir, v = dir * .25, lead = 0) => {
    if (!c || c !== live()[0] || c.classList.contains('xp')) return;
    swipeToken++;
    $$(c, '.cd-finger').forEach(lift);
    c.classList.remove('nudge', 'to-r', 'to-l');
    c.classList.add('drag', 'dragging', dir > 0 ? 'to-r' : 'to-l', dir > 0 ? 'go-r' : 'go-l', 'gone');
    c.inert = true; c.setAttribute('aria-hidden', 'true');
    const x0 = parseFloat(c.style.getPropertyValue('--dx')) || 0, x1 = dir * c.offsetWidth * 1.6;
    v = dir * Math.min(3, Math.max(.2, v * dir));
    const ms = Math.round(Math.min(540, Math.max(300, 2.2 * Math.abs(x1 - x0) / (Math.abs(v) + 1.1)))), vEnd = 1.3 * (x1 - x0) / ms;
    if (api.reduce) tween(c, 200, s => { c.style.opacity = 1 - s; });
    else tween(c, ms, s => { pose(c, hermite(s, x0, x1, v, vEnd, ms)); const f = Math.min(1, Math.max(0, (s - .2) / .8)); c.style.opacity = (1 - f * f * (3 - 2 * f)).toFixed(3); }, lead);
    if (dir > 0) accepted++;
    relayer(); if (live()[0]) reveal(live()[0]);
    const button = $(c, dir > 0 ? '.cd-v.up' : '.cd-v.down');
    button.classList.remove('hit'); void button.offsetWidth; button.classList.add('hit');
    later(() => button.classList.remove('hit'), 550);
    if (dir > 0) { q('.cd-bg-note').classList.add('on'); later(() => q('.cd-bg-note').classList.remove('on'), 1800); }
  };
  const vote = dir => {
    if (current !== 'jobs' || !live().length || q('.cd-card.xp')) return;
    finishSwipe(live()[0], dir);
  };
  api.act('cd-up', () => vote(1)); api.act('cd-down', () => vote(-1));
  const swipe = async (c, dir, gesture) => {
    if (c !== live()[0] || c.classList.contains('xp')) return;
    const token = ++swipeToken;
    const valid = () => token === swipeToken && c === live()[0] && !c.classList.contains('xp');
    c.classList.add(dir > 0 ? 'to-r' : 'to-l');
    if (gesture) {
      // The finger settles, pulls the card from rest, and lets go while it is still moving.
      const dot = el('<i class="cd-finger" aria-hidden="true"></i>'); c.appendChild(dot);
      c.classList.add('drag', 'dragging'); await api.wait(220); if (!valid()) { dot.remove(); return; }
      const reach = dir * 72, vEnd = dir * .32, ms = 520;
      const lead = await tween(c, ms, s => pose(c, hermite(s, 0, reach, 0, vEnd, ms)));
      if (!valid()) { dot.remove(); return; }
      finishSwipe(c, dir, vEnd, lead);
    } else {
      await tap(api, ui, $(c, dir > 0 ? '.cd-v.up' : '.cd-v.down')); if (!valid()) return;
      finishSwipe(c, dir);
    }
    await api.wait(650);
  };
  // Drag the card's copy to make a choice; dragging the surrounding stage still turns the phone.
  api.drag('[data-drag="cd-card"]', {
    start(event, target) {
      const c = target.closest('.cd-card');
      if (current !== 'jobs' || c !== live()[0] || c.classList.contains('xp')) return;
      swipeToken++; stop(c);
      drag = { c, x: parseFloat(c.style.getPropertyValue('--dx')) || 0, v: 0, t: performance.now(), scale: Math.max(.2, c.getBoundingClientRect().width / c.offsetWidth) };
      $$(c, '.cd-finger').forEach(dot => dot.remove()); c.classList.add('drag', 'dragging');
    },
    move(dx) {
      if (!drag) return;
      const now = performance.now(), x = drag.x + dx / drag.scale, dt = now - drag.t;
      if (dt > 0) drag.v = drag.v * .6 + (x - drag.x) / dt * .4;
      drag.x = x; drag.t = now;
      const c = drag.c;
      pose(c, x);
      c.classList.toggle('to-r', x > 0); c.classList.toggle('to-l', x < 0);
    },
  });
  // Far enough, or a quick flick in the same direction, sends the card; otherwise it settles back.
  const release = event => {
    if (!drag) return;
    const { c, x } = drag, v = performance.now() - drag.t > 90 ? 0 : drag.v; drag = null;
    const flick = Math.abs(x) > 24 && Math.abs(v) > .6 && Math.sign(v) === Math.sign(x);
    if (event.type !== 'pointercancel' && (Math.abs(x) > 65 || flick)) finishSwipe(c, Math.sign(x), v);
    else { c.classList.remove('drag', 'dragging', 'to-r', 'to-l'); POSE.forEach(k => c.style.removeProperty(k)); }
  };
  world.addEventListener('pointerup', release); world.addEventListener('pointercancel', release);

  /* Success confetti: NexGen's burst physics (same launch, gravity and damping, per 60 Hz frame), drawn as Cedar's own
     pieces. Every piece and streamer leaves the mascot, flies out, tumbles down and fades away. */
  const ORIGIN = [195, 124];
  let confetti = [];
  const celebrate = () => {
    if (current !== 'ok') return;
    const pieces = qq('.cd-confetti i').map(e => ({ e, hx: e.offsetLeft + e.offsetWidth / 2, hy: e.offsetTop + e.offsetHeight / 2, r: +e.dataset.r, line: false }));
    const lines = qq('.cd-streamers path').map(e => { const b = e.getBBox(); return { e, hx: b.x + b.width / 2, hy: b.y + b.height / 2, r: 0, line: true }; });
    if (api.reduce) { pieces.forEach(p => { p.e.style.opacity = 1; }); lines.forEach(p => { p.e.style.strokeDashoffset = 0; }); return; }
    confetti = [...pieces, ...lines].map(p => {
      const dx = p.hx - ORIGIN[0], dy = p.hy - ORIGIN[1], dist = Math.hypot(dx, dy) || 1;
      // NexGen launches at 1.4–5.8 px/frame with an upward kick of 1.4; here the speed is aimed so each piece passes its own spot.
      const sp = dist * (1 - .955) * (.9 + Math.random() * .45) + 1.4 + Math.random() * 1.2;
      return { ...p, x: ORIGIN[0] + (Math.random() - .5) * 16, y: ORIGIN[1] + (Math.random() - .5) * 16, vx: dx / dist * sp, vy: dy / dist * sp - 1.4,
        g: .1, life: 1, decay: .0055 + Math.random() * .0045, a: p.r, va: (Math.random() - .5) * (p.line ? 9 : 22), f: Math.random() * 6.3, vf: .07 + Math.random() * .16 };
    });
  };
  api.frame(dt => {
    if (!confetti.length) return;
    const k = Math.min(3, dt * 60);
    confetti = confetti.filter(p => {
      p.life -= p.decay * k;
      p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k; p.vx *= Math.pow(.955, k); p.vy *= Math.pow(.975, k);
      p.a += p.va * k; p.va *= Math.pow(.99, k); p.f += p.vf * k;
      const o = Math.max(0, Math.min(1, p.life / .4)), flip = Math.cos(p.f);
      if (p.line) {
        p.e.style.transform = `translate(${(p.x - p.hx).toFixed(1)}px,${(p.y - p.hy).toFixed(1)}px) rotate(${p.a.toFixed(1)}deg) scale(${(.75 + .25 * flip).toFixed(3)},1)`;
        p.e.style.strokeDashoffset = Math.max(0, 240 * (1 - (1 - p.life) * 3.2)).toFixed(1);
      } else {
        p.e.style.transform = `translate(${(p.x - p.hx).toFixed(1)}px,${(p.y - p.hy).toFixed(1)}px) rotate(${p.a.toFixed(1)}deg) scaleX(${flip.toFixed(3)})`;
      }
      p.e.style.opacity = o.toFixed(3);
      return p.life > 0;
    });
  });

  const reset = () => {
    timers.forEach(clearTimeout); timers.clear();
    ui.classList.add('no-anim'); current = 'off'; accepted = 0; packageReady = false; pending = null; drag = null; swipeToken++;
    SCREENS.forEach(k => { scr(k).className = `scr cd-${k}${k === 'off' ? ' top' : ' off-r'}`; scr(k).inert = k !== 'off'; scr(k).setAttribute('aria-hidden', String(k !== 'off')); });
    qq('.cd-card').forEach(c => {
      stop(c); c.className = 'cd-card'; delete c.dataset.read;
      [...POSE, 'height', 'opacity'].forEach(k => c.style.removeProperty(k));
      $(c, '.cd-cview').scrollTop = 0;
    });
    qq('.cd-list li').forEach(li => li.classList.remove('on')); qq('.cd-finger').forEach(dot => dot.remove());
    qq('.gm-viewport').forEach(view => view.scrollTop = 0);
    confetti = []; qq('.cd-confetti i, .cd-streamers path').forEach(e => ['transform', 'opacity', 'stroke-dashoffset'].forEach(k => e.style.removeProperty(k)));
    relayer(); dismissNote(); ui.classList.remove('cd-xp');
    q('.cd-bg-note').classList.remove('on'); q('.gh-scroll').style.transform = ''; q('.gh-submit').classList.remove('busy');
    updateInbox();
    requestAnimationFrame(() => requestAnimationFrame(() => ui.classList.remove('no-anim')));
  };

  api.flow(async () => {
    reset();
    await api.wait(1500); note('New job openings ready to review');
    // Tapping the notification opens the email itself, not the inbox.
    if (!await beat(3000, 'cd-notification')) await tap(api, ui, q('.ios-note'));
    dismissNote(); show('m1', 'fade');
    await api.wait(1700);
    q('.cd-m1 .gm-viewport').scrollTo({ top: 118, behavior: api.reduce ? 'instant' : 'smooth' });
    if (!await beat(2000, 'cd-matches')) await tap(api, ui, q('.cd-l1'));
    show('intro');
    if (!await beat(3400, 'cd-open-jobs')) await tap(api, ui, q('.cd-go'));
    show('jobs'); await api.wait(650);
    let index = 0;
    while (live().length) {
      const c = live()[0], j = JOBS[+c.dataset.i];
      for (const li of $$(c, '.cd-list li')) { li.classList.add('on'); await api.wait(85); }
      await api.wait(1300); if (c !== live()[0]) continue;
      if (j.spec && !c.dataset.read) {
        await tap(api, ui, $(c, '.cd-spec')); if (c !== live()[0]) continue;
        openDetails(c); await api.wait(1100);
        const view = $(c, '.cd-cview');
        for (const f of [.25, .5, .75, 1]) {
          if (!c.classList.contains('xp')) break;
          view.scrollTo({ top: Math.round((view.scrollHeight - view.clientHeight) * f), behavior: api.reduce ? 'instant' : 'smooth' });
          await api.wait(1450);
        }
        if (c.classList.contains('xp')) { await tap(api, ui, $(c, '.cd-x')); closeDetails(c); await api.wait(800); }
      }
      // If the reader opened a different card, leave it open until they close it.
      while (c.classList.contains('xp')) await api.wait(350);
      if (c !== live()[0]) continue;
      await swipe(c, j.dir, index++ % 2 === 0); await api.wait(400);
    }
    q('.cd-summary').innerHTML = accepted ? `Great, you swiped <span class="cd-liked">${accepted}</span> ${accepted === 1 ? 'job' : 'jobs'} right. Check your email for the job applications.` : 'You reviewed all your matches for today. Cedar will email you when new opportunities are ready.';
    show('done'); await api.wait(3000);
    if (!accepted) { await api.wait(3000); show('off', 'fade'); await api.wait(1700); return; }
    packageReady = true; updateInbox();
    note('Application Package for Software Engineering Intern – Internal Tools (Remote) at Super.com');
    if (!await beat(2200, 'cd-notification')) await tap(api, ui, q('.ios-note'));
    dismissNote(); show('m2', 'fade'); await api.wait(1800);
    q('.cd-m2 .gm-viewport').scrollTo({ top: 40, behavior: api.reduce ? 'instant' : 'smooth' });
    const readerOpened = await beat(1800, 'cd-application');
    if (!readerOpened) await tap(api, ui, q('.cd-l2'));
    show('gh'); await api.wait(1400);
    const form = q('.gh-scroll'), submit = q('.gh-submit');
    // Stop with the submit button inside the glass, regardless of font loading or copy wrapping.
    const max = Math.max(0, submit.offsetTop + submit.offsetHeight - 690);
    for (const fraction of [.33, .66, 1]) { form.style.transform = `translateY(${-Math.round(max * fraction)}px)`; await api.wait(1400); }
    if (!await beat(1000, 'cd-submit')) await tap(api, ui, submit);
    submit.classList.add('busy'); await api.wait(1000);
    show('ok', 'fade'); later(celebrate, 200); await api.wait(5000); show('off', 'fade');
    if (P.st && !api.reduce) { P.st.vy += 15; P.st.rel = api.S.t; }
    await api.wait(1700);
  });
  return { destroy() { timers.forEach(clearTimeout); ui.removeEventListener('pointerdown', screenPointerDown); world.removeEventListener('pointerup', release); world.removeEventListener('pointercancel', release); } };
}
