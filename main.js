// Palmbreeze Home Care: concept site by Portside Digital
// Every booking link opens WhatsApp with a pre-filled message. Swap in the client's number here.
const WA_NUMBER = '18682591409';
const PHONE = '+18682591409';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const money = (n) => n.toLocaleString('en-US');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- WhatsApp + call links ----------
$$('[data-wa]').forEach((a) => {
  a.href = waLink(a.dataset.wa);
  a.target = '_blank';
  a.rel = 'noopener';
});
['#mCall', '#footCall'].forEach((s) => { const a = $(s); if (a) a.href = `tel:${PHONE}`; });

// ---------- Nav ----------
const nav = $('#nav');
const toggle = $('#navToggle');
const links = $('#navLinks');
const setMenu = (open) => {
  links.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
$$('a', links).forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Hero squeegee wipe: plays once the photo is on screen ----------
new IntersectionObserver(([e], o) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('go');
  o.disconnect();
}, { threshold: 0.45 }).observe($('.hero-visual'));

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('.reveal').forEach((el, i) => {
  // small stagger for siblings in the same grid
  const sib = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.transitionDelay = `${Math.min(sib.indexOf(el), 5) * 70}ms`;
  io.observe(el);
});

// ---------- Scroll-scrubbed statement ----------
const scrub = $('#scrub');
const highlight = ['Saturday:', 'beach,', 'lime,', 'nap.'];
scrub.innerHTML = scrub.textContent.trim().split(/\s+/)
  .map((w) => `<span class="w${highlight.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ');
const words = $$('.w', scrub);

// ---------- Process line ----------
const steps = $('#steps');
const stepEls = $$('.step', steps);
const fill = $('#stepsFill');
const mbar = $('.mbar');
const desktop = matchMedia('(min-width:1024px)');

let ticking = false;
function onScroll() {
  const vh = innerHeight;
  nav.classList.toggle('scrolled', scrollY > 8);
  mbar.classList.toggle('show', scrollY > vh * 0.6);

  // statement: words light up as the paragraph moves from 85% to 35% of the viewport
  const r = scrub.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.5)));
  const lit = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < lit));

  // steps: line fills and numbers turn on as each step passes the middle of the screen
  const s = steps.getBoundingClientRect();
  const sp = Math.min(1, Math.max(0, (vh * 0.6 - s.top) / s.height));
  if (desktop.matches) steps.style.setProperty('--fill', `${sp * 100}%`), fill.style.height = '';
  else fill.style.height = `${sp * 100}%`;
  stepEls.forEach((el) => el.classList.toggle('done', el.getBoundingClientRect().top < vh * 0.6));
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// ---------- Before / after ----------
const ba = $('#ba');
const baRange = $('#baRange');
baRange.addEventListener('input', () => ba.style.setProperty('--pos', `${baRange.value}%`));
new IntersectionObserver(([e], o) => {
  if (!e.isIntersecting) return;
  ba.classList.add('hint');
  o.disconnect();
}, { threshold: 0.6 }).observe(ba);

// ---------- Quote builder ----------
const form = $('#builder');
const rooms = { bedroom: 2, bathroom: 1, kitchen: 1, living: 1 };
const ROOM = { bedroom: [90, 'Bedroom'], bathroom: [110, 'Bathroom'], kitchen: [150, 'Kitchen'], living: [90, 'Living/dining'] };
const TYPE = {
  standard: { label: 'Standard clean', base: 250, mult: 1 },
  deep: { label: 'Deep clean', base: 350, mult: 1.6 },
  move: { label: 'Move in/out clean', base: 400, mult: 1.8 },
  declutter: { label: 'Declutter & organise', base: 400, mult: 1.3 },
};
const EXTRA = {
  oven: ['Inside oven', 120], fridge: ['Inside fridge', 100], mattress: ['Mattress clean', 250], rug: ['Rug clean', 200],
  couch: ['Couch clean', 280], windows: ['Windows', 180], power: ['Power washing', 450], laundry: ['Laundry & fold', 100],
};
const FREQ = { once: ['One-time', 0], monthly: ['Monthly', 0.05], biweekly: ['Every 2 weeks', 0.1], weekly: ['Weekly', 0.15] };

$$('.stepper').forEach((st) => {
  const key = st.dataset.room;
  const out = $('output', st);
  const [minus, plus] = $$('button', st);
  const sync = () => { out.textContent = rooms[key]; minus.disabled = rooms[key] <= 0; plus.disabled = rooms[key] >= 8; };
  $$('button', st).forEach((b) => b.addEventListener('click', () => {
    rooms[key] = Math.max(0, Math.min(8, rooms[key] + +b.dataset.d));
    sync();
    out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump');
    quote();
  }));
  sync();
});
form.addEventListener('change', quote);

// min date = tomorrow
const date = $('#date');
const tmr = new Date(Date.now() + 864e5);
date.min = tmr.toISOString().slice(0, 10);

let shown = { lo: 0, hi: 0 };
function animateNum(el, from, to) {
  if (reduced) { el.textContent = money(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 450);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = money(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function quote() {
  const type = form.type.value;
  const freq = form.freq.value;
  const t = TYPE[type];
  const extras = $$('#extras input:checked').map((i) => i.value);
  const roomTotal = Object.entries(rooms).reduce((s, [k, n]) => s + ROOM[k][0] * n, 0);
  const extrasTotal = extras.reduce((s, k) => s + EXTRA[k][1], 0);
  const sub = t.base + roomTotal * t.mult + extrasTotal;
  const disc = FREQ[freq][1];
  const total = sub * (1 - disc);
  const round = (n) => Math.round(n / 10) * 10;
  const lo = round(total * 0.9), hi = round(total * 1.1);

  animateNum($('#pLo'), shown.lo, lo);
  animateNum($('#pHi'), shown.hi, hi);
  shown = { lo, hi };

  const save = $('#pSave');
  save.hidden = !disc;
  if (disc) save.textContent = `You save ${disc * 100}% on every ${FREQ[freq][0].toLowerCase()} visit`;

  const nRooms = Object.values(rooms).reduce((a, b) => a + b, 0);
  const work = (nRooms * 0.75 * t.mult) + extras.length * 0.6 + 0.5; // person-hours, rough
  const crew = work > 9 ? 3 : work > 4 ? 2 : 1;
  const hrs = Math.max(1.5, Math.round((work / crew) * 2) / 2);
  $('#crew').textContent = `${crew} cleaner${crew > 1 ? 's' : ''}`;
  $('#hours').textContent = `~${hrs} hrs`;

  const roomLines = Object.entries(rooms).filter(([, n]) => n).map(([k, n]) => `${n} × ${ROOM[k][1]}${n > 1 && k !== 'living' ? 's' : ''}`);
  const list = [
    ['Service', t.label],
    ['Rooms', roomLines.join(', ') || 'None yet'],
    ...(extras.length ? [['Extras', extras.map((k) => EXTRA[k][0]).join(', ')]] : []),
    ['Frequency', FREQ[freq][0]],
    ['Area', $('#area').value],
  ];
  $('#sumList').innerHTML = list.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');

  const day = date.value ? new Date(date.value + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Flexible';
  const msg = [
    'Hi Palmbreeze! I built a quote on your website:',
    '',
    ...list.map(([k, v]) => `• ${k}: ${v}`),
    `• Preferred day: ${day}`,
    `• Estimate: TT$${money(lo)} – ${money(hi)}`,
    '',
    "I'll send a few photos / a short video of the space.",
  ].join('\n');
  $('#sendQuote').href = waLink(msg);
  $('#sendQuote').target = '_blank';
  $('#sendQuote').rel = 'noopener';
}
quote();

// "Add to my quote" from the services grid
const PICK = {
  general: () => setType('standard'),
  deep: () => setType('deep'),
  declutter: () => setType('declutter'),
  kitchen: () => { tick('oven'); tick('fridge'); },
  bathroom: () => bump('bathroom'),
  bedroom: () => bump('bedroom'),
  mattress: () => { tick('mattress'); tick('rug'); },
  power: () => tick('power'),
};
function setType(v) { form.type.value = v; }
function tick(v) { const i = $(`#extras input[value="${v}"]`); if (i) i.checked = true; }
function bump(k) { if (rooms[k] < 1) { rooms[k] = 1; } const st = $(`.stepper[data-room="${k}"]`); $('output', st).textContent = rooms[k]; $$('button', st)[0].disabled = false; }
$$('.card[data-pick]').forEach((card) => {
  $('.card-add', card).addEventListener('click', () => {
    PICK[card.dataset.pick]();
    card.classList.add('picked');
    quote();
    $('#build').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

// ---------- Compare tabs (mobile) ----------
const tabs = $$('.tabs [role="tab"]');
const cols = $$('.cmp');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
  cols.forEach((c) => c.classList.toggle('is-on', c.dataset.col === tab.dataset.tab));
}));
// columns are visible once they've appeared on mobile too
cols.forEach((c) => c.classList.add('in'));

// ---------- Gift certificate ----------
const cert = $('#cert');
const OCC = { Christmas: 'Merry Christmas', "Mother's Day": "Happy Mother's Day", Birthday: 'Happy Birthday', 'New Home': 'Welcome Home' };
const gName = $('#gName');
$('#cNo').textContent = String(Math.floor(1000 + Math.random() * 9000));
function gift() {
  const occ = $('input[name="occ"]:checked').value;
  const amt = +$('input[name="amt"]:checked').value;
  const name = gName.value.trim();
  $('#cOcc').textContent = OCC[occ];
  $('#cName').textContent = name || 'someone special';
  $('#cAmt').textContent = money(amt);
  const g = $('#gSend');
  g.href = waLink(`Hi Palmbreeze! I'd like a ${occ} gift certificate for TT$${money(amt)}${name ? ` for ${name}` : ''}. 🎁`);
  g.target = '_blank'; g.rel = 'noopener';
}
$$('input[name="occ"], input[name="amt"]').forEach((i) => i.addEventListener('change', () => {
  gift(); cert.classList.remove('flash'); void cert.offsetWidth; cert.classList.add('flash');
}));
gName.addEventListener('input', gift);
gift();

// gentle tilt that follows the pointer on desktop
if (matchMedia('(hover:hover)').matches && !reduced) {
  const stage = $('.cert-stage');
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cert.style.setProperty('--ry', `${x * 16}deg`);
    cert.style.setProperty('--rx', `${-y * 12}deg`);
  });
  stage.addEventListener('pointerleave', () => { cert.style.setProperty('--ry', '-8deg'); cert.style.setProperty('--rx', '0deg'); });
}
