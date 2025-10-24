// 日付キー生成
function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// localStorage helpers
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ① 今日の花言葉（50件ほど）
const FLOWERS = [
  'バラ：愛・美',
  'チューリップ：思いやり',
  'スイセン：自己愛',
  'ヒマワリ：憧れ',
  'カスミソウ：感謝',
  'ラベンダー：期待',
  'ガーベラ：希望',
  'カーネーション：無垢で深い愛',
  'スズラン：再び幸せが訪れる',
  'アイリス：希望',
  'サクラ：精神の美',
  'コスモス：調和',
  'ボタン：富貴',
  'アサガオ：結束',
  'キンモクセイ：謙虚',
  'ユリ：純粋',
  'ダリア：優雅',
  'アネモネ：はかない恋',
  'スイートピー：門出',
  'ポインセチア：祝福',
  'シクラメン：はにかみ',
  'ネモフィラ：どこでも成功',
  'パンジー：物思い',
  'マーガレット：真実の愛',
  'サボテン：熱情',
  'ハイビスカス：繊細な美',
  'ツバキ：控えめな優しさ',
  'アジサイ：辛抱強い愛',
  'ナデシコ：純愛',
  'スズラン：純潔',
  'ミモザ：感受性',
  'ジャスミン：優美',
  'キク：高貴',
  'スイレン：清浄',
  'フリージア：あどけなさ',
  'チョウセンアサガオ：偽り',
  'ベゴニア：片想い',
  'デルフィニウム：清明',
  'ユーカリ：思い出',
  'ローズマリー：追憶',
  'ラナンキュラス：魅力的',
  'アスター：追憶',
  'ケイトウ：おしゃれ',
  'モクレン：自然への愛',
  'ニゲラ：夢の中の恋',
  'ブルースター：幸福な愛',
  'サルビア：尊敬',
  'ベニバナ：特別な人',
  'スミレ：謙虚'
];

// 追加: アファメーション
const AFFIRMATIONS = [
  '私は小さな一歩を積み重ね、理想の自分に近づいている',
  '今日の選択が未来の私を創る',
  '私は自分の身体を大切にし、優しく労わる',
  '私の努力は確実に結果に繋がっている',
  '私は自分のペースを信じて前に進む',
  '私は健康的な選択を楽しんでいる',
  '私は昨日より今日、今日より明日、すこしずつ良くなる',
  '私は自分の変化を受け入れ、誇りに思う',
  '私は身体と心の声に耳を傾ける',
  '私は美しく、しなやかで、強い'
];

function renderAffirmation() {
  const msg = seededPick(AFFIRMATIONS, dateKey());
  const el = document.getElementById('affirmation-message');
  if (el) el.textContent = msg;
}

// 日替わり背景（優先: 01〜05 .jpg/.png → フォールバック: 日本語名 .jpeg）
const BG_INDEXES = Array.from({ length: 5 }, (_, i) => String(i + 1).padStart(2, '0'));
function preloadFirstAvailable(urls, onDone) {
  let i = 0;
  const tryNext = () => {
    if (i >= urls.length) { onDone(null); return; }
    const test = urls[i++];
    const img = new Image();
    img.onload = () => onDone(test);
    img.onerror = tryNext;
    img.src = test;
  };
  tryNext();
}

function applyDailyBackground() {
  const today = dateKey();
  const idx = seededPick(BG_INDEXES, today);
  const candidates = [
    `haikei/${idx}.jpg`,
    `haikei/${idx}.png`
  ];
  document.body.classList.add('has-bg');
  preloadFirstAvailable(candidates, (foundUrl) => {
    if (foundUrl) {
      document.body.style.backgroundImage = `url('${foundUrl}')`;
      return;
    }
    // フォールバック: 実在する可能性のある日本語名 .jpeg 群から日替わり選択
    const ALT_FILES = [
      'ダウンロード.jpeg',
      'ダウンロード (1).jpeg',
      'ダウンロード (2).jpeg',
      'ダウンロード (3).jpeg',
      'ダウンロード (4).jpeg',
      'ダウンロード (5).jpeg'
    ];
    const altPick = seededPick(ALT_FILES, today);
    const altUrl = `haikei/${altPick}`;
    preloadFirstAvailable([altUrl], (altFound) => {
      if (altFound) {
        document.body.style.backgroundImage = `url('${altFound}')`;
      } else {
        document.body.style.backgroundImage =
          'linear-gradient(135deg, rgba(255,247,240,1) 0%, rgba(253,231,216,1) 40%, rgba(249,168,212,0.45) 100%)';
      }
    });
  });
}

function seededPick(list, seedStr) {
  // 簡易シード（文字列→数値）
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  const idx = Math.abs(h) % list.length;
  return list[idx];
}

function renderFlower() {
  const today = dateKey();
  const msg = seededPick(FLOWERS, today);
  document.getElementById('flower-message').textContent = msg;
}

// ② 体重記録
const WEIGHT_KEY = 'weights.v1';
function getWeights() { return load(WEIGHT_KEY, {}); }
function setWeight(dayKey, kg) {
  const all = getWeights();
  all[dayKey] = kg;
  save(WEIGHT_KEY, all);
}
function getWeight(dayKey) {
  return getWeights()[dayKey];
}

function renderWeightPanel() {
  const today = dateKey();
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  const wToday = getWeight(today);
  const wYesterday = getWeight(yesterday);

  document.getElementById('today-weight').textContent =
    (wToday !== undefined) ? `${wToday} kg` : '-';

  let deltaStr = '-';
  if (wToday !== undefined && wYesterday !== undefined) {
    const delta = (wToday - wYesterday).toFixed(1);
    const sign = (delta > 0 ? '+' : '');
    deltaStr = `${sign}${delta} kg`;
  }
  document.getElementById('delta-weight').textContent = deltaStr;

  const input = document.getElementById('weight-input');
  input.value = (wToday !== undefined) ? wToday : '';
}

function bindWeightForm() {
  const form = document.getElementById('weight-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseFloat(document.getElementById('weight-input').value);
    if (!isNaN(v)) {
      setWeight(dateKey(), parseFloat(v.toFixed(1)));
      renderWeightPanel();
      renderCalendar();
      renderGoalsPanel();
      renderWaterGuideline();
    }
  });
}

// ③ 朝のノルマ
const MORNING_KEY = 'morning.v1';
function getMorningAll() { return load(MORNING_KEY, {}); }
function setMorning(dayKey, obj) {
  const all = getMorningAll();
  all[dayKey] = obj; save(MORNING_KEY, all);
}
function getMorning(dayKey) { return getMorningAll()[dayKey] || {}; }

function bindMorningChecklist() {
  const day = dateKey();
  const saved = getMorning(day);
  document.querySelectorAll('[data-morning]').forEach(chk => {
    const key = chk.getAttribute('data-morning');
    chk.checked = !!saved[key];
    chk.addEventListener('change', () => {
      const cur = getMorning(day);
      cur[key] = chk.checked; setMorning(day, cur);
      renderStreaks();
    });
  });
}

// ④ 本日の運動
const EXER_KEY = 'exercise.v1';
function getExerciseAll() { return load(EXER_KEY, {}); }
function setExercise(dayKey, obj) { const all = getExerciseAll(); all[dayKey] = obj; save(EXER_KEY, all); }
function getExercise(dayKey) { return getExerciseAll()[dayKey] || {}; }

function updateExerciseBanner(dayKey) {
  const st = getExercise(dayKey);
  const required = ['stretch', 'squat', 'abs'];
  const allDone = required.every(k => !!st[k]);
  const el = document.getElementById('exercise-all-done');
  if (allDone) el.classList.remove('hidden'); else el.classList.add('hidden');
  // allDoneを保存（カレンダー用）
  st.allDone = allDone; setExercise(dayKey, st);
}

function bindExerciseChecklist() {
  const day = dateKey();
  const saved = getExercise(day);
  document.querySelectorAll('[data-exercise]').forEach(chk => {
    const key = chk.getAttribute('data-exercise');
    chk.checked = !!saved[key];
    chk.addEventListener('change', () => {
      const cur = getExercise(day);
      cur[key] = chk.checked; setExercise(day, cur);
      updateExerciseBanner(day);
      renderCalendar();
      renderStreaks();
      renderGoalsPanel();
    });
  });
  updateExerciseBanner(day);
}

// ⑤ カレンダー
let currentYear, currentMonth; // month: 0-11

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

function renderCalendarHeader() {
  const title = document.getElementById('cal-title');
  title.textContent = `${currentYear}年 ${currentMonth + 1}月`;
}

function buildDowHeader() {
  const names = ['日','月','火','水','木','金','土'];
  return names.map(n => `<div class="dow">${n}</div>`).join('');
}

function renderCalendar() {
  const container = document.getElementById('calendar');
  const first = new Date(currentYear, currentMonth, 1);
  const last = new Date(currentYear, currentMonth + 1, 0);

  const startIdx = first.getDay();
  const daysInMonth = last.getDate();

  const prevLast = new Date(currentYear, currentMonth, 0).getDate();

  let html = buildDowHeader();

  // 先行（前月分の空白）
  for (let i = 0; i < startIdx; i++) {
    const d = prevLast - startIdx + i + 1;
    html += `<div class="cell dim"><div class="date">${d}</div></div>`;
  }

  // 当月
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const key = dateKey(d);
    const w = getWeight(key);
    const ex = getExercise(key);

    html += `<div class="cell">` +
            `<div class="date">${day}</div>` +
            `<div class="weight">${w !== undefined ? `${w}kg` : ''}</div>` +
            `<div class="mark">${ex && ex.allDone ? '★' : ''}</div>` +
            `</div>`;
  }

  // 後行（次月分）
  const totalCells = startIdx + daysInMonth;
  const remain = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remain; i++) {
    html += `<div class="cell dim"><div class="date">${i}</div></div>`;
  }

  container.innerHTML = html;
  renderCalendarHeader();
}

function bindCalendarNav() {
  document.getElementById('prev-month').addEventListener('click', () => {
    const d = new Date(currentYear, currentMonth - 1, 1);
    currentYear = d.getFullYear(); currentMonth = d.getMonth();
    renderCalendar();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    const d = new Date(currentYear, currentMonth + 1, 1);
    currentYear = d.getFullYear(); currentMonth = d.getMonth();
    renderCalendar();
  });
}

// 追加: 水分トラッカー（1日8杯想定）
const WATER_KEY = 'water.v1';
function getWaterAll() { return load(WATER_KEY, {}); }
function setWater(dayKey, cnt) { const all = getWaterAll(); all[dayKey] = cnt; save(WATER_KEY, all); }
function getWater(dayKey) { return getWaterAll()[dayKey] || 0; }
function bindWaterTracker() {
  const day = dateKey();
  const decr = document.getElementById('water-decr');
  const incr = document.getElementById('water-incr');
  const countEl = document.getElementById('water-count');
  const bar = document.getElementById('water-bar');
  const guideline = document.getElementById('water-guideline');
  if (!decr || !incr || !countEl || !bar) return;
  const update = () => {
    const c = getWater(day);
    countEl.textContent = `${c}/8 杯`;
    bar.style.width = `${Math.min(100, (c/8)*100)}%`;
    renderWaterGuideline();
  };
  decr.addEventListener('click', () => { const c = Math.max(0, getWater(day)-1); setWater(day, c); update(); });
  incr.addEventListener('click', () => { const c = Math.min(8, getWater(day)+1); setWater(day, c); update(); });
  // 初期
  update();
}

// 水分目安: 体重(kg)×35ml, 1杯=250ml
function renderWaterGuideline() {
  const el = document.getElementById('water-guideline');
  if (!el) return;
  const today = dateKey();
  const todayW = getWeight(today);
  const w = (todayW !== undefined) ? todayW : getLatestWeight();
  if (w !== undefined) {
    const ml = Math.round(w * 35);
    const cups = (ml / 250).toFixed(1);
    el.textContent = `目安: 約${ml}ml（約${cups}杯）`;
  } else {
    el.textContent = '目安: 体重入力で自動計算（kg×35ml、1杯=250ml）';
  }
}

// 追加: 果物トラッカー（200g目標）
const FRUIT_KEY = 'fruit.v1';
function getFruitAll() { return load(FRUIT_KEY, {}); }
function setFruit(dayKey, grams) { const all = getFruitAll(); all[dayKey] = grams; save(FRUIT_KEY, all); }
function getFruit(dayKey) { return getFruitAll()[dayKey] || 0; }
function bindFruitTracker() {
  const day = dateKey();
  const form = document.getElementById('fruit-form');
  const gramsEl = document.getElementById('fruit-grams');
  const bar = document.getElementById('fruit-bar');
  const status = document.getElementById('fruit-status');
  if (!form || !gramsEl || !bar || !status) return;
  const update = () => {
    const g = getFruit(day);
    gramsEl.value = g ? g : '';
    const pct = Math.min(100, (g/200)*100);
    bar.style.width = `${pct}%`;
    status.textContent = `${g}/200 g`;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Math.max(0, parseInt(gramsEl.value || '0', 10));
    setFruit(day, v);
    update();
  });
  update();
}

// 追加: 今月の目標
const GOALS_KEY = 'goals.v1';
function monthKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function getGoalsAll() { return load(GOALS_KEY, {}); }
function setGoals(mKey, obj) { const all = getGoalsAll(); all[mKey] = obj; save(GOALS_KEY, all); }
function getGoals(mKey) { return getGoalsAll()[mKey] || {}; }

function getLatestWeight() {
  const all = getWeights();
  const keys = Object.keys(all).sort();
  if (keys.length === 0) return undefined;
  return all[keys[keys.length-1]];
}

function countExerciseDaysInMonth(y, m) {
  let count = 0;
  const last = new Date(y, m+1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const key = dateKey(new Date(y, m, d));
    const ex = getExercise(key);
    if (ex && ex.allDone) count++;
  }
  return count;
}

function renderGoalsPanel() {
  const now = new Date();
  const mKey = monthKey(now);
  const g = getGoals(mKey);
  const goalWeight = (g.goalWeight !== undefined) ? g.goalWeight : undefined;
  const goalExDays = (g.goalExDays !== undefined) ? g.goalExDays : undefined;

  const latest = getLatestWeight();
  const latestEl = document.getElementById('latest-weight');
  const toGoalEl = document.getElementById('to-goal-weight');
  if (latestEl) latestEl.textContent = (latest !== undefined) ? `${latest} kg` : '-';
  if (toGoalEl) {
    if (latest !== undefined && goalWeight !== undefined) {
      const diff = (latest - goalWeight).toFixed(1);
      const sign = diff > 0 ? '+' : '';
      toGoalEl.textContent = `${sign}${diff} kg`;
    } else {
      toGoalEl.textContent = '-';
    }
  }

  const exDays = countExerciseDaysInMonth(now.getFullYear(), now.getMonth());
  const exDaysEl = document.getElementById('exercise-days');
  const goalExView = document.getElementById('goal-ex-days-view');
  const exBar = document.getElementById('exdays-bar');
  if (exDaysEl) exDaysEl.textContent = `${exDays}`;
  if (goalExView) goalExView.textContent = (goalExDays !== undefined) ? `${goalExDays}` : '-';
  if (exBar) {
    const pct = (goalExDays && goalExDays > 0) ? Math.min(100, (exDays/goalExDays)*100) : 0;
    exBar.style.width = `${pct}%`;
  }
}

function bindGoalsForm() {
  const form = document.getElementById('goals-form');
  if (!form) return;
  const gw = document.getElementById('goal-weight');
  const gd = document.getElementById('goal-ex-days');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const mKey = monthKey();
    const obj = getGoals(mKey);
    const wv = gw.value ? parseFloat(gw.value) : undefined;
    const dv = gd.value ? parseInt(gd.value, 10) : undefined;
    if (wv !== undefined) obj.goalWeight = parseFloat(wv.toFixed(1));
    if (dv !== undefined) obj.goalExDays = dv;
    setGoals(mKey, obj);
    renderGoalsPanel();
  });
  // 初期値
  const g = getGoals(monthKey());
  if (g.goalWeight !== undefined) gw.value = g.goalWeight;
  if (g.goalExDays !== undefined) gd.value = g.goalExDays;
}

// 追加: 連続達成記録
function isMorningAllDone(dayKey) {
  const m = getMorning(dayKey);
  const req = ['water','fruit','breath','sun'];
  return req.every(k => !!m[k]);
}
function computeStreak(dayKey, predicate) {
  let streak = 0;
  let d = new Date(dayKey);
  while (true) {
    const key = dateKey(d);
    if (predicate(key)) { streak++; } else { break; }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate()-1);
  }
  return streak;
}
function renderStreaks() {
  const today = dateKey();
  const exPred = (k) => { const ex = getExercise(k); return !!(ex && ex.allDone); };
  const mornPred = (k) => isMorningAllDone(k);
  const sEx = computeStreak(today, exPred);
  const sM = computeStreak(today, mornPred);
  const se = document.getElementById('streak-exercise');
  const sm = document.getElementById('streak-morning');
  if (se) se.textContent = `${sEx}`;
  if (sm) sm.textContent = `${sM}`;
}

// メモ機能は削除

// 初期化
function init() {
  renderAffirmation();
  applyDailyBackground();
  renderFlower();
  bindWeightForm();
  renderWeightPanel();
  bindMorningChecklist();
  bindExerciseChecklist();
  bindWaterTracker();
  renderWaterGuideline();
  bindFruitTracker();
  bindGoalsForm();
  renderGoalsPanel();
  renderStreaks();

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  bindCalendarNav();
  renderCalendar();
}

document.addEventListener('DOMContentLoaded', init);
