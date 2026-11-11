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
const altNodes = [...document.querySelectorAll('[data-i18n-alt]')].map((el) => ({ el, key: el.dataset.i18nAlt, en: el.alt }));
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
  altNodes.forEach((n) => { n.el.alt = pick(n); });
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
    document.getElementById('belt').classList.toggle('paused', demoPaused);
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
  ['.shot', 0.12],
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
const AUTO_QUERIES = ['river', '0102', 'may'];
const peopleList = document.getElementById('people');
const digitsOf = (text) => text.replace(/\D/g, '');
let userTookOver = false;

// ค้นแบบเดียวกับแอป: ข้อความตรงบางส่วน หรือเลข 3 ตัวขึ้นไปตรงกับเบอร์ (ไม่สนขีดหรือเว้นวรรค)
function filterPeople() {
  const query = search.value.trim().toLowerCase();
  const queryDigits = digitsOf(query);
  const byPhone = queryDigits.length >= 3 && queryDigits.length === query.replace(/[\s+()-]/g, '').length;
  let shown = 0;
  people.forEach((person) => {
    const match = person.dataset.find.includes(query)
      || (queryDigits.length >= 3 && digitsOf(person.dataset.phone).includes(queryDigits));
    person.hidden = !match;
    if (match) shown += 1;
  });
  peopleList.classList.toggle('by-phone', byPhone);
  noResult.hidden = shown > 0;
}

// พิมพ์ตัวอย่าง 1 คำ แล้วลบ (1 รอบ) หยุดทันทีเมื่อ stop() เป็นจริง
let queryIndex = 0;
async function searchCycle(stop) {
  const word = AUTO_QUERIES[queryIndex % AUTO_QUERIES.length];
  queryIndex += 1;
  for (let i = 1; i <= word.length; i += 1) {
    if (stop()) return;
    search.value = word.slice(0, i);
    filterPeople();
    await wait(110);
  }
  await wait(1500);
  for (let i = word.length - 1; i >= 0; i -= 1) {
    if (stop()) return;
    search.value = word.slice(0, i);
    filterPeople();
    await wait(45);
  }
  await wait(900);
}

search.addEventListener('input', filterPeople);

// ---------- แผ่น Excel ----------
// เอียงแผ่น > ตั้งตรงแล้วซูมเข้าคอลัมน์ A > เลื่อนทีละคอลัมน์ถึง F > ซูมออกให้เห็นทั้งแผ่น > วนใหม่
// ผู้ใช้ปัดหรือลากเมื่อไร ภาพหยุดเล่นเองแล้วให้ผู้ใช้ควบคุม
const xl = document.getElementById('xl');
const xlView = document.getElementById('xlView');
const xlTilt = document.getElementById('xlTilt');
const xlStage = document.getElementById('xlStage');
const xlTable = xlStage.querySelector('table');
const xlHl = document.getElementById('xlHl');
const xlChip = document.getElementById('xlChip');
const xlLetters = [...xlTable.querySelectorAll('.xl-letters th:not(.xl-corner)')];
const xlHeads = [...xlTable.querySelectorAll('.xl-head th:not(.xl-num)')];
const XL_FOCUS = 1;
let xlTx = 0;
let xlCol = 0;
let xlUser = false;

function xlSize() {
  xlView.style.setProperty('--xl-h', `${Math.ceil(xlTable.offsetHeight * XL_FOCUS)}px`);
}

function xlPlace(scale, tx, ty, ms) {
  xlStage.style.transitionDuration = `${ms}ms`;
  xlStage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  if (scale === XL_FOCUS) xlTx = tx;
}

function xlClampTx(tx) {
  const minTx = xlView.clientWidth - xlTable.offsetWidth * XL_FOCUS;
  return Math.min(0, Math.max(Math.min(0, minTx), tx));
}

// เปลี่ยนป้ายชื่อคอลัมน์ตอนกล้องเลื่อนไปได้ครึ่งทาง ให้ป้ายตรงกับภาพ
let xlChipTimer;
function xlMark(i, ms = 0) {
  xlCol = i;
  clearTimeout(xlChipTimer);
  xlLetters.forEach((th, n) => th.classList.toggle('on', n === i));
  if (i < 0) {
    xlHl.style.opacity = '0';
    xl.classList.add('show-all');
    return;
  }
  const head = xlHeads[i];
  xlHl.style.left = `${head.offsetLeft}px`;
  xlHl.style.width = `${head.offsetWidth}px`;
  xlHl.style.opacity = '1';
  const label = `${'ABCDEF'[i]} · ${head.textContent}`;
  if (ms > 0) {
    xlChipTimer = setTimeout(() => { xlChip.textContent = label; }, ms * 0.5);
  } else {
    xlChip.textContent = label;
  }
  xl.classList.remove('show-all');
}

function xlFocus(i, ms) {
  const head = xlHeads[i];
  const center = head.offsetLeft + head.offsetWidth / 2;
  xlPlace(XL_FOCUS, xlClampTx(xlView.clientWidth / 2 - center * XL_FOCUS), 0, ms);
  xlMark(i, ms);
}

function xlOverview(ms) {
  const vw = xlView.clientWidth;
  const vh = xlView.clientHeight;
  const scale = Math.min(XL_FOCUS, (vw / xlTable.offsetWidth) * 0.92);
  xlPlace(scale, (vw - xlTable.offsetWidth * scale) / 2, (vh - xlTable.offsetHeight * scale) / 2, ms);
  xlMark(-1);
}

function xlInstant(fn) {
  xlTilt.style.transition = 'none';
  fn();
  void xlTilt.offsetWidth;
  xlTilt.style.transition = '';
}

async function excelCycle(stop) {
  xlInstant(() => {
    xlTilt.classList.add('tilted');
    xlOverview(0);
  });
  await wait(700);
  if (stop()) return;
  xlTilt.classList.remove('tilted');
  xlFocus(0, 1200);
  await wait(2700);
  for (let i = 1; i < xlHeads.length; i += 1) {
    if (stop()) return;
    xlFocus(i, 850);
    await wait(2150);
  }
  if (stop()) return;
  xlOverview(1100);
  await wait(3300);
  if (stop()) return;
  xlTilt.classList.add('tilted');
  await wait(1300);
}

// ลากหรือปัดเพื่อดูเอง
let drag = null;
xlView.addEventListener('pointerdown', (e) => {
  xlUser = true;
  xlInstant(() => xlTilt.classList.remove('tilted'));
  if (xlCol < 0) xlFocus(0, 0);
  drag = { x: e.clientX, tx: xlTx, id: e.pointerId };
  xlView.setPointerCapture(e.pointerId);
  xlView.classList.add('dragging');
});
xlView.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const tx = xlClampTx(drag.tx + (e.clientX - drag.x));
  xlPlace(XL_FOCUS, tx, 0, 0);
  const middle = xlView.clientWidth / 2 - tx;
  let nearest = 0;
  xlHeads.forEach((head, n) => {
    const d = Math.abs(head.offsetLeft + head.offsetWidth / 2 - middle);
    const best = Math.abs(xlHeads[nearest].offsetLeft + xlHeads[nearest].offsetWidth / 2 - middle);
    if (d < best) nearest = n;
  });
  if (nearest !== xlCol) xlMark(nearest);
});
const endDrag = () => {
  drag = null;
  xlView.classList.remove('dragging');
};
xlView.addEventListener('pointerup', endDrag);
xlView.addEventListener('pointercancel', endDrag);

function xlReflow() {
  xlSize();
  if (xlCol < 0) xlOverview(0);
  else xlFocus(xlCol, 0);
}
window.addEventListener('resize', xlReflow);
document.fonts.ready.then(xlReflow);
xlSize();
if (reducedMotion) {
  xlFocus(0, 0);
} else {
  xlInstant(() => {
    xlTilt.classList.add('tilted');
    xlOverview(0);
  });
}

// ---------- ให้ช่องค้นหากับแผ่น Excel เล่นสลับกัน ไม่ขยับพร้อมกัน ----------
const feature = { searchIn: false, excelIn: false, running: false };

async function featureLoop() {
  feature.running = true;
  await wait(600);
  for (;;) {
    let played = false;
    if (feature.searchIn && !userTookOver) {
      played = true;
      await searchCycle(() => userTookOver || !feature.searchIn);
    }
    if (feature.excelIn && !xlUser) {
      played = true;
      await excelCycle(() => xlUser || !feature.excelIn);
    }
    if (!played) break;
  }
  feature.running = false;
}

function syncFeatures() {
  const wanted = (feature.searchIn && !userTookOver) || (feature.excelIn && !xlUser);
  if (wanted && !feature.running) featureLoop();
}

if (!reducedMotion) {
  const takeOver = () => {
    if (userTookOver) return;
    userTookOver = true;
    search.value = '';
    filterPeople();
  };
  search.addEventListener('pointerdown', takeOver);
  search.addEventListener('focus', takeOver);

  new IntersectionObserver(([entry]) => {
    feature.searchIn = entry.isIntersecting;
    syncFeatures();
  }, { threshold: 0.5 }).observe(search);

  new IntersectionObserver(([entry]) => {
    feature.excelIn = entry.isIntersecting;
    // เลื่อนออกไปแล้วกลับมา ให้เริ่มเล่นใหม่แม้เคยปัดเอง
    if (!entry.isIntersecting) xlUser = false;
    syncFeatures();
  }, { threshold: 0.5 }).observe(xlView);
}
