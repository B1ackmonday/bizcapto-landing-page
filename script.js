// BizCapto website: สลับภาษา ตัวสาธิตการสแกน และการเคลื่อนไหวของหน้าเว็บ
const TH = window.BIZCAPTO_TH;
const LANG_KEY = 'bizcapto-lang';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// ข้อมูลสมมติทั้งหมด ใช้ในตัวสาธิตและสายพานนามบัตร
const SAMPLE_CARDS = [
  { name: 'Maya Collins', nickname: 'May', title: 'Product Designer', company: 'Harbor Lane Studio', phone: '+1 555 0100', email: 'maya@example.com', look: 'paper' },
  { name: 'Daniel Brooks', nickname: 'Dan', title: 'Head Baker', company: 'River Bakery', phone: '+1 555 0101', email: 'daniel@example.com', look: 'indigo' },
  { name: 'Lena Fischer', nickname: 'Len', title: 'Operations Lead', company: 'Blue Door Logistics', phone: '+1 555 0102', email: 'lena@example.com', look: 'night' },
  { name: 'Omar Haddad', nickname: 'Omi', title: 'Clinic Manager', company: 'Northpoint Clinic', phone: '+1 555 0103', email: 'omar@example.com', look: 'paper' },
  { name: 'Sofia Martins', nickname: 'Sofi', title: 'Account Director', company: 'Tall Tree Media', phone: '+1 555 0104', email: 'sofia@example.com', look: 'indigo' },
  { name: 'Lucas Moreau', nickname: 'Luc', title: 'Sales Engineer', company: 'Field Note Systems', phone: '+1 555 0105', email: 'lucas@example.com', look: 'night' },
];

// ---------- สลับภาษา ----------
// ภาษาอังกฤษอ่านจากหน้าเว็บตอนเปิด ภาษาไทยอ่านจาก th.js
const textNodes = [...document.querySelectorAll('[data-i18n]')].map((el) => ({ el, key: el.dataset.i18n, en: el.innerHTML }));
const ariaNodes = [...document.querySelectorAll('[data-i18n-aria]')].map((el) => ({ el, key: el.dataset.i18nAria, en: el.getAttribute('aria-label') }));
const placeholderNodes = [...document.querySelectorAll('[data-i18n-placeholder]')].map((el) => ({ el, key: el.dataset.i18nPlaceholder, en: el.placeholder }));
const metaDesc = document.querySelector('meta[name="description"]');
const metaEn = { title: document.title, desc: metaDesc.content };
const langSwitch = document.querySelector('.lang');
const langButtons = langSwitch.querySelectorAll('[data-lang]');

function setLanguage(lang) {
  const thai = lang === 'th';
  const pick = (node) => (thai && node.key in TH ? TH[node.key] : node.en);

  document.documentElement.lang = lang;
  textNodes.forEach((n) => { n.el.innerHTML = pick(n); });
  ariaNodes.forEach((n) => n.el.setAttribute('aria-label', pick(n)));
  placeholderNodes.forEach((n) => { n.el.placeholder = pick(n); });
  document.title = thai ? TH['meta.title'] : metaEn.title;
  metaDesc.content = thai ? TH['meta.desc'] : metaEn.desc;
}

function markLanguage(lang) {
  langSwitch.dataset.active = lang;
  langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

langButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const lang = button.dataset.lang;
    if (lang === document.documentElement.lang) return;
    markLanguage(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* เบราว์เซอร์ปิดการเก็บค่า */ }
    if (reducedMotion) {
      setLanguage(lang);
      return;
    }
    document.body.classList.add('swapping');
    await wait(170);
    setLanguage(lang);
    document.body.classList.remove('swapping');
  });
});

const startLang = document.documentElement.lang === 'th' ? 'th' : 'en';
setLanguage(startLang);
markLanguage(startLang);

// ---------- ตัวสาธิตการสแกน ----------
// 0 เล็งกล้อง > 1 กำลังอ่าน > 2 พิมพ์ข้อมูลลงช่อง > 3 บันทึกแล้ว แล้วเริ่มใบถัดไป
const phone = document.getElementById('phone');
const bizcard = document.getElementById('bizcard');
const demoToggle = document.getElementById('demoToggle');
const reviewRows = [...phone.querySelectorAll('.review dl div')];
let demoRun = 0;
let demoIndex = 0;
let demoInView = false;
let demoPaused = false;

function loadCard(card) {
  const lines = { ...card, headline: `${card.name} (${card.nickname})` };
  bizcard.dataset.look = card.look;
  bizcard.querySelectorAll('[data-card]').forEach((el) => { el.textContent = lines[el.dataset.card]; });
  reviewRows.forEach((row) => {
    row.classList.remove('on');
    row.querySelector('dd').textContent = '';
  });
}

async function typeFields(card, run) {
  for (const row of reviewRows) {
    const field = row.querySelector('dd');
    const text = card[field.dataset.field];
    row.classList.add('on');
    field.classList.add('typing');
    for (let i = 1; i <= text.length; i += 1) {
      if (run !== demoRun) return;
      field.textContent = text.slice(0, i);
      await wait(26);
    }
    field.classList.remove('typing');
    await wait(70);
  }
}

async function runDemo() {
  demoRun += 1;
  const run = demoRun;
  while (run === demoRun) {
    const card = SAMPLE_CARDS[demoIndex % SAMPLE_CARDS.length];
    demoIndex += 1;
    loadCard(card);
    phone.dataset.step = '0';
    await wait(1250);
    if (run !== demoRun) return;
    phone.dataset.step = '1';
    await wait(2050);
    if (run !== demoRun) return;
    phone.dataset.step = '2';
    await wait(320);
    await typeFields(card, run);
    if (run !== demoRun) return;
    phone.dataset.step = '3';
    await wait(2600);
  }
}

function syncDemo() {
  if (demoInView && !demoPaused) {
    runDemo();
  } else {
    demoRun += 1;
    phone.querySelectorAll('.typing').forEach((el) => el.classList.remove('typing'));
  }
}

if (reducedMotion) {
  phone.dataset.step = '3';
  reviewRows.forEach((row) => row.classList.add('on'));
  demoToggle.hidden = true;
} else {
  demoToggle.addEventListener('click', () => {
    demoPaused = !demoPaused;
    demoToggle.dataset.paused = String(demoPaused);
    syncDemo();
  });
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === demoInView) return;
    demoInView = entry.isIntersecting;
    syncDemo();
  }, { threshold: 0.35 }).observe(phone);
}

// มือถือและป้ายลอยขยับตามเมาส์
if (canHover && !reducedMotion) {
  const hero = document.getElementById('hero');
  const pills = document.querySelectorAll('.pill');
  const target = { x: 0, y: 0 };
  const now = { x: 0, y: 0 };
  let animating = false;

  const step = () => {
    now.x += (target.x - now.x) * 0.08;
    now.y += (target.y - now.y) * 0.08;
    phone.style.setProperty('--ry', `${now.x * 11}deg`);
    phone.style.setProperty('--rx', `${now.y * -9}deg`);
    pills.forEach((pill) => {
      const depth = Number(pill.dataset.depth);
      pill.style.setProperty('--px', `${now.x * depth}px`);
      pill.style.setProperty('--py', `${now.y * depth}px`);
    });
    const settled = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) < 0.002;
    animating = !settled;
    if (animating) requestAnimationFrame(step);
  };
  const kick = () => {
    if (!animating) {
      animating = true;
      requestAnimationFrame(step);
    }
  };

  hero.addEventListener('pointermove', (e) => {
    const box = hero.getBoundingClientRect();
    target.x = ((e.clientX - box.left) / box.width - 0.5) * 2;
    target.y = ((e.clientY - box.top) / box.height - 0.5) * 2;
    kick();
  });
  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    kick();
  });
}

// ---------- สายพานนามบัตร ----------
const paperCard = (c) => `<div class="bc bc-${c.look}"><b>${c.name}</b><span>${c.title}</span><span>${c.company}</span><span>${c.phone}</span></div>`;
const beltCopies = 3;

document.getElementById('beltTrack').innerHTML = SAMPLE_CARDS.map(paperCard).join('').repeat(beltCopies);

// ---------- แสดงเนื้อหาตอนเลื่อนถึง ----------
const revealGroups = [
  ['.section h2, .closing h2, .privacy .lead, .privacy .text-link, .fine'],
  ['.steps li', 0.14],
  ['.tile', 0.07],
  ['.checks li', 0.1],
  ['.plan', 0.12],
  ['.qa details', 0.06],
];

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -10% 0px' });

revealGroups.forEach(([selector, gap = 0]) => {
  document.querySelectorAll(selector).forEach((el, index) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${index * gap}s`);
    revealObserver.observe(el);
  });
});
revealObserver.observe(document.querySelector('.closing-logo'));

// ---------- สิ่งที่ขยับตามการเลื่อน ----------
const rootStyle = document.documentElement.style;
const stepsWrap = document.getElementById('steps');
const stepItems = stepsWrap.querySelectorAll('.steps li');
const privacy = document.getElementById('privacy');
const clamp01 = (n) => Math.min(Math.max(n, 0), 1);
const LIT_AT = [0.02, 0.5, 0.97];
let scrollQueued = false;

function onScroll() {
  scrollQueued = false;
  const view = window.innerHeight;
  const page = document.documentElement.scrollHeight - view;
  rootStyle.setProperty('--scroll', page > 0 ? clamp01(window.scrollY / page).toFixed(4) : '0');

  const steps = stepsWrap.getBoundingClientRect();
  const stepProgress = clamp01((view * 0.82 - steps.top) / (view * 0.5));
  stepsWrap.style.setProperty('--p', stepProgress.toFixed(3));
  stepItems.forEach((item, i) => item.classList.toggle('lit', stepProgress >= LIT_AT[i]));

  const box = privacy.getBoundingClientRect();
  privacy.style.setProperty('--p', clamp01((view - box.top) / (view * 0.75)).toFixed(3));

  toTop.classList.toggle('show', window.scrollY > view * 0.8);
}

// ปุ่มกลับขึ้นบนสุด แล้วย้ายโฟกัสไปต้นหน้า ให้คนใช้คีย์บอร์ดไม่หลงตำแหน่ง
const toTop = document.getElementById('toTop');
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  document.querySelector('.brand').focus({ preventScroll: true });
});

function queueScroll() {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(onScroll);
}
window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', queueScroll);
onScroll();

// ---------- แสงตามเมาส์บนการ์ดฟีเจอร์ ----------
if (canHover) {
  document.querySelectorAll('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const box = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - box.left}px`);
      tile.style.setProperty('--my', `${e.clientY - box.top}px`);
    });
  });
}

// ---------- ช่องค้นหาตัวอย่าง ----------
const search = document.getElementById('q');
const people = document.querySelectorAll('#people li');
const noResult = document.getElementById('none');
const AUTO_QUERIES = ['river', 'lena', 'may'];
let autoRun = 0;
let userTookOver = false;

function filterPeople() {
  const query = search.value.trim().toLowerCase();
  let shown = 0;
  people.forEach((person) => {
    const match = person.dataset.find.includes(query);
    person.hidden = !match;
    if (match) shown += 1;
  });
  noResult.hidden = shown > 0;
}

async function autoSearch() {
  autoRun += 1;
  const run = autoRun;
  let index = 0;
  await wait(900);
  while (run === autoRun) {
    const word = AUTO_QUERIES[index % AUTO_QUERIES.length];
    index += 1;
    for (let i = 1; i <= word.length; i += 1) {
      if (run !== autoRun) return;
      search.value = word.slice(0, i);
      filterPeople();
      await wait(110);
    }
    await wait(1500);
    for (let i = word.length - 1; i >= 0; i -= 1) {
      if (run !== autoRun) return;
      search.value = word.slice(0, i);
      filterPeople();
      await wait(45);
    }
    await wait(1100);
  }
}

function stopAutoSearch() {
  autoRun += 1;
}

search.addEventListener('input', filterPeople);

if (!reducedMotion) {
  const takeOver = () => {
    if (userTookOver) return;
    userTookOver = true;
    stopAutoSearch();
    search.value = '';
    filterPeople();
  };
  search.addEventListener('pointerdown', takeOver);
  search.addEventListener('focus', takeOver);

  new IntersectionObserver(([entry]) => {
    if (userTookOver) return;
    if (entry.isIntersecting) {
      autoSearch();
    } else {
      stopAutoSearch();
    }
  }, { threshold: 0.5 }).observe(search);
}
