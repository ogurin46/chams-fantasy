'use strict';
// ═══════════════════════════════════════════════════════════
// めいたんてい チャムズ 〜えいごじけんぼ〜  ゲームエンジン
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

// ─── 音声（TTS） ───
let cachedVoices = [];
function loadVoices() { cachedVoices = speechSynthesis.getVoices(); }
if (window.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
if (window.speechSynthesis) loadVoices();

function pickVoice(lang, preferFemale) {
  const voices = (cachedVoices.length ? cachedVoices : speechSynthesis.getVoices())
    .filter(v => v.lang && v.lang.replace('_','-').startsWith(lang));
  if (!voices.length) return null;
  const femK = ['female','zira','victoria','karen','samantha','fiona','moira','veena','tessa','google us english'];
  const malK = ['male','david','mark','daniel','alex','lee','rishi'];
  const keys = preferFemale ? femK : malK;
  return voices.find(v => keys.some(k => v.name.toLowerCase().includes(k))) || voices[0];
}

let _speakSeqToken = 0;
function speak(text, opt = {}, onEnd = null) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = opt.lang  || 'en-US';
  utt.pitch = opt.pitch ?? 1.1;
  utt.rate  = opt.rate  ?? 0.85;
  if (utt.lang.startsWith('en')) {
    const v = pickVoice('en', opt.female ?? true);
    if (v) utt.voice = v;
  }
  let done = false;
  const fin = () => { if (!done) { done = true; onEnd?.(); } };
  utt.onend = utt.onerror = fin;
  setTimeout(fin, text.length * 140 + 1500);
  speechSynthesis.speak(utt);
}

function speakCham(chamKey, text, onEnd = null) {
  const v = CHAMS[chamKey].voice;
  speak(text, { pitch: v.pitch, rate: v.rate, female: v.female }, onEnd);
}

// チャムズの提案を順番に読み上げる（りく→ぱく→みみ）
function speakSequence(items, doneCb) {
  const token = ++_speakSeqToken;
  let i = 0;
  const next = () => {
    if (token !== _speakSeqToken) return; // 中断された
    if (i >= items.length) { doneCb?.(); return; }
    const item = items[i++];
    if (item.chamKey) speakCham(item.chamKey, item.text, () => setTimeout(next, 350));
    else speak(item.text, item.opt || {}, () => setTimeout(next, 350));
  };
  next();
}
function stopSpeak() { _speakSeqToken++; if (window.speechSynthesis) speechSynthesis.cancel(); }

// ─── セーブ（3スロット） ───
const SAVE_KEY = 'chams_tantei_v1';
let saveSlots = [null, null, null];
let G = {};

function makeNewState(name) {
  return { name, solved:{}, phrases:[], sawPrologue:false, slot:0 };
}
function loadAllSlots() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    saveSlots = Array.isArray(raw) && raw.length === 3 ? raw : [null,null,null];
  } catch { saveSlots = [null,null,null]; }
}
function saveGame() {
  if (G.slot === undefined || G.slot === null) return;
  saveSlots[G.slot] = JSON.parse(JSON.stringify(G));
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveSlots));
}
function deleteSlot(idx) {
  saveSlots[idx] = null;
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveSlots));
}
function solvedCount() { return Object.keys(G.solved || {}).length; }

function learnPhrase(en) {
  if (!en) return;
  if (!G.phrases.includes(en)) G.phrases.push(en);
}

// ─── 画面・オーバーレイ管理 ───
const SCREEN_IDS = ['title','name','save','casefile','case'];
function showScreen(name) {
  stopSpeak();
  SCREEN_IDS.forEach(id => $(`screen-${id}`)?.classList.toggle('hidden', id !== name));
}
const OVERLAY_IDS = ['story','clue','deduce','solved','rank','note','confirm'];
function showOverlay(name) { $(`overlay-${name}`)?.classList.remove('hidden'); }
function hideOverlay(name) { $(`overlay-${name}`)?.classList.add('hidden'); }
function hideAllOverlays()  { OVERLAY_IDS.forEach(hideOverlay); }

function showConfirm(msg, yesLabel, onYes) {
  $('confirm-msg').textContent = msg;
  $('btn-confirm-yes').textContent = yesLabel;
  showOverlay('confirm');
  $('btn-confirm-yes').onclick = () => { hideOverlay('confirm'); onYes(); };
  $('btn-confirm-no').onclick  = () => hideOverlay('confirm');
}

let toastTimer = null;
function showToast(icon, msg) {
  const el = $('feedback-toast');
  $('feedback-icon').textContent = icon;
  $('feedback-msg').textContent  = msg;
  el.classList.remove('hidden','toast-out');
  el.classList.add('toast-in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.replace('toast-in','toast-out');
    setTimeout(() => el.classList.add('hidden'), 380);
  }, 1800);
}

// ─── タイトル：キラキラパーティクル ───
let _titleRaf = null;
function startTitleCanvas() {
  const cv = $('title-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let w = cv.width = cv.offsetWidth, h = cv.height = cv.offsetHeight;
  const STARS = Array.from({length: 60}, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.6 + 0.4, a: Math.random(),
    da: (Math.random() * 0.01 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
    vy: Math.random() * 0.0003 + 0.0001,
  }));
  function draw() {
    if (w !== cv.offsetWidth || h !== cv.offsetHeight) {
      w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight;
    }
    ctx.clearRect(0, 0, w, h);
    STARS.forEach(s => {
      s.y -= s.vy; if (s.y < -0.02) s.y = 1.02;
      s.a += s.da;
      if (s.a > 1) { s.a = 1; s.da = -Math.abs(s.da); }
      if (s.a < 0) { s.a = 0; s.da =  Math.abs(s.da); }
      ctx.save();
      ctx.globalAlpha = s.a * 0.9;
      ctx.fillStyle = '#ffd6ec';
      ctx.shadowColor = '#ff8fd0'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    _titleRaf = requestAnimationFrame(draw);
  }
  if (_titleRaf) cancelAnimationFrame(_titleRaf);
  draw();
}
function stopTitleCanvas() {
  if (_titleRaf) { cancelAnimationFrame(_titleRaf); _titleRaf = null; }
}

// ─── タイトル ───
function renderTitle() {
  showScreen('title');
  hideAllOverlays();
  loadAllSlots();
  const hasSave = saveSlots.some(s => s !== null);
  $('btn-title-load').classList.toggle('hidden', !hasSave);
  $('title-start-panel').classList.add('hidden');
  const hint = $('title-tap-hint');
  if (hint) hint.style.display = '';
  startTitleCanvas();
  let tapped = false;
  const onTap = (e) => {
    if (e && e.type === 'touchend') e.preventDefault();
    if (tapped) return;
    tapped = true;
    if (hasSave) {
      if (hint) hint.style.display = 'none';
      $('title-start-panel').classList.remove('hidden');
    } else {
      stopTitleCanvas();
      renderNameInput();
    }
  };
  $('title-inner').ontouchend = onTap;
  $('title-inner').onclick    = onTap;
}

// ─── 名前入力 ───
function renderNameInput() {
  stopTitleCanvas();
  showScreen('name');
  const inp = $('hero-name-input');
  const btn = $('btn-name-ok');
  inp.value = '';
  btn.disabled = true;
  inp.oninput = () => { btn.disabled = inp.value.trim().length === 0; };
}

// ─── セーブ選択 ───
function renderSaveSelect() {
  stopTitleCanvas();
  showScreen('save');
  const container = $('save-slots');
  container.innerHTML = '';
  let anySlot = false;
  saveSlots.forEach((save, idx) => {
    if (!save) return;
    anySlot = true;
    const rank = getRank(Object.keys(save.solved || {}).length);
    const div = document.createElement('div');
    div.className = 'save-slot';
    div.innerHTML = `
      <img src="img/heroine_face.png" class="save-face" alt="">
      <div class="save-info">
        <span class="save-name">${save.name}</span>
        <span class="save-lv">${rank.icon} ${rank.name}</span>
        <span class="save-kobito">かいけつ ${Object.keys(save.solved || {}).length}/${CASES.length} けん</span>
      </div>
      <div class="save-btns">
        <button class="sub-btn" data-idx="${idx}" data-act="load">▶ つづける</button>
        <button class="danger-btn" data-idx="${idx}" data-act="del">🗑</button>
      </div>`;
    container.appendChild(div);
  });
  if (!anySlot) { renderNameInput(); return; }

  container.querySelectorAll('[data-act="load"]').forEach(btn => btn.addEventListener('click', () => {
    G = JSON.parse(JSON.stringify(saveSlots[+btn.dataset.idx]));
    if (!G.phrases) G.phrases = [];
    if (!G.solved)  G.solved  = {};
    renderCasefile();
  }));
  container.querySelectorAll('[data-act="del"]').forEach(btn => btn.addEventListener('click', () => {
    const idx = +btn.dataset.idx;
    showConfirm(`「${saveSlots[idx]?.name}」のデータをけしますか？`, 'けす', () => {
      deleteSlot(idx); renderSaveSelect();
    });
  }));
}

// ─── ストーリーオーバーレイ ───
let storyQueue = [], storyDone = null;
function showStory(lines, onDone) {
  storyQueue = [...lines]; storyDone = onDone;
  showOverlay('story'); advanceStory();
}
function advanceStory() {
  if (!storyQueue.length) { hideOverlay('story'); const cb = storyDone; storyDone = null; cb?.(); return; }
  $('story-text').textContent = storyQueue.shift();
}

// ─── 事件簿（ホーム画面） ───
function renderCasefile() {
  showScreen('casefile');
  hideAllOverlays();
  const rank = getRank(solvedCount());
  $('cf-name').textContent = G.name;
  $('cf-rank').textContent = `${rank.icon} ${rank.name}`;
  $('cf-progress').textContent = `かいけつ ${solvedCount()}/${CASES.length}`;

  const list = $('case-list');
  list.innerHTML = '';
  CASES.forEach((c, i) => {
    // 事件は順番にアンロック（前の事件を解決すると次が開く）
    const unlocked = i === 0 || CASES.slice(0, i).every(prev => G.solved[prev.id]);
    const stars = G.solved[c.id] || 0;
    const card = document.createElement('button');
    card.className = 'case-card' + (unlocked ? '' : ' case-locked') + (stars ? ' case-solved' : '');
    card.innerHTML = `
      <span class="case-emoji">${c.emoji}</span>
      <span class="case-info">
        <span class="case-title">じけん${i+1}「${c.title}」</span>
        <span class="case-sub">${unlocked
          ? (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'むずかしさ ' + '🔍'.repeat(c.diff))
          : '🔒 まえの じけんを かいけつしよう'}</span>
      </span>
      ${stars ? '<span class="case-stamp">かいけつ！</span>' : ''}`;
    if (unlocked) card.addEventListener('click', () => startCase(c.id));
    list.appendChild(card);
  });
}

// ─── てがかりノート（おぼえたえいご） ───
function renderNote() {
  const list = $('note-list');
  list.innerHTML = '';
  if (!G.phrases.length) {
    list.innerHTML = '<p class="note-empty">じけんを かいけつすると えいごの てがかりが たまるよ！</p>';
  } else {
    G.phrases.forEach(en => {
      const row = document.createElement('button');
      row.className = 'note-row';
      row.innerHTML = `<span class="note-en">${en}</span><span class="note-play">🔊</span>`;
      row.addEventListener('click', () => speak(en, { female:true }));
      list.appendChild(row);
    });
  }
  showOverlay('note');
}

// ═══════════════════════════════════════════════════════════
// 事件プレイ
// ═══════════════════════════════════════════════════════════
let CS = null; // { case, stepIdx, clues:[], misses:0, casePhrases:[] }

function startCase(caseId) {
  const c = CASES.find(x => x.id === caseId);
  if (!c) return;
  CS = { case:c, stepIdx:0, clues:[], misses:0, casePhrases:[] };
  showScreen('case');
  $('case-header-title').textContent = `${c.emoji} ${c.title}`;
  renderClueChips();
  showStory(c.intro, () => showStep(0));
}

function renderClueChips() {
  const wrap = $('clue-chips');
  const total = CS.case.steps.length;
  wrap.innerHTML = Array.from({length: total}, (_, i) =>
    `<span class="clue-chip ${i < CS.clues.length ? 'clue-got' : ''}">${i < CS.clues.length ? CS.clues[i].icon : '💡'}</span>`
  ).join('');
}

// ─── 聞き込みステップ ───
function showStep(idx) {
  if (idx >= CS.case.steps.length) { showDeduce(); return; }
  CS.stepIdx = idx;
  const step = CS.case.steps[idx];
  const w = RESIDENTS[step.witness];

  $('case-step-label').textContent = `ききこみ ${idx+1}/${CS.case.steps.length}`;
  $('witness-img').src = w.img;
  $('witness-name').textContent = w.name;
  $('scene-text').textContent = step.scene;

  // 住人のセリフ（リスニング問題）
  const saysWrap = $('witness-says-wrap');
  if (step.witnessSays) {
    saysWrap.classList.remove('hidden');
    $('witness-says').textContent = step.witnessSays.en;
    $('btn-replay-says').onclick = () => speak(step.witnessSays.en, { female:true });
  } else {
    saysWrap.classList.add('hidden');
  }

  $('case-question').textContent = step.question;

  // チャムズ3人に選択肢をランダムに割り当て
  const chamOrder = [...CHAM_KEYS].sort(() => Math.random() - 0.5);
  const options   = [...step.options].sort(() => Math.random() - 0.5);
  const assign = chamOrder.map((ck, i) => ({ chamKey: ck, option: options[i] }));

  const row = $('cham-row');
  row.innerHTML = '';
  assign.forEach(a => {
    const cham = CHAMS[a.chamKey];
    const card = document.createElement('button');
    card.className = 'cham-card';
    card.style.setProperty('--cham-color', cham.color);
    card.innerHTML = `
      <div class="cham-bubble">${a.option.text}</div>
      <img src="${cham.img}" class="cham-img" alt="${cham.name}">
      <span class="cham-name">${cham.name}</span>`;
    card.addEventListener('click', () => onChamPick(card, a, step));
    row.appendChild(card);
  });

  // 読み上げ: リスニング問題は住人のセリフ、スピーキング問題はチャムズの提案を順に
  setTimeout(() => {
    if (step.witnessSays) {
      speak(step.witnessSays.en, { female:true });
    } else if (step.type === 'ask') {
      speakSequence(assign.map(a => ({ chamKey: a.chamKey, text: a.option.text })));
    }
  }, 500);
}

function onChamPick(cardEl, assign, step) {
  if (cardEl.disabled) return;
  stopSpeak();

  if (!assign.option.ok) {
    // はずれ → そのチャムズはグレーアウト、もう一度選べる
    CS.misses++;
    cardEl.disabled = true;
    cardEl.classList.add('cham-wrong');
    showToast('🤔', 'うーん、ちがうみたい…もういちど！');
    return;
  }

  // せいかい！
  document.querySelectorAll('.cham-card').forEach(c => c.disabled = true);
  cardEl.classList.add('cham-correct');
  showToast('⭕', 'めいすいり！');

  // おぼえたえいごを記録
  if (step.type === 'ask') CS.casePhrases.push(assign.option.text);
  if (step.witnessSays)    CS.casePhrases.push(step.witnessSays.en);

  // 正解のセリフをチャムズが言う → 住人が答える → てがかりゲット
  const sayCorrect = step.type === 'ask'
    ? () => speakCham(assign.chamKey, assign.option.text, afterCham)
    : () => afterCham();

  function afterCham() {
    const saysWrap = $('witness-says-wrap');
    saysWrap.classList.remove('hidden');
    $('witness-says').textContent = step.reply.en;
    $('btn-replay-says').onclick = () => speak(step.reply.en, { female:true });
    $('scene-text').textContent = step.reply.jp;
    CS.casePhrases.push(step.reply.en);
    speak(step.reply.en, { female:true }, () => {
      setTimeout(showClueGet, 500);
    });
  }
  setTimeout(sayCorrect, 400);
}

function showClueGet() {
  const step = CS.case.steps[CS.stepIdx];
  CS.clues.push(step.clue);
  renderClueChips();
  $('clue-icon').textContent = step.clue.icon;
  $('clue-text').textContent = step.clue.jp;
  showOverlay('clue');
  $('btn-clue-ok').onclick = () => {
    hideOverlay('clue');
    showStep(CS.stepIdx + 1);
  };
}

// ─── なぞとき（推理タイム） ───
function showDeduce() {
  const d = CS.case.deduce;
  $('deduce-question').textContent = d.question;
  $('deduce-hint').textContent = '';

  const clueList = $('deduce-clues');
  clueList.innerHTML = CS.clues.map(c =>
    `<div class="deduce-clue"><span>${c.icon}</span> ${c.jp}</div>`).join('');

  const wrap = $('deduce-suspects');
  wrap.innerHTML = '';
  [...d.suspects].sort(() => Math.random() - 0.5).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'suspect-card';
    if (s.res) {
      const r = RESIDENTS[s.res];
      btn.innerHTML = `<img src="${r.img}" class="suspect-img" alt=""><span class="suspect-name">${r.name}</span>`;
    } else {
      btn.innerHTML = `<span class="suspect-icon">${s.icon}</span><span class="suspect-name">${s.name}</span>`;
    }
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      if (s.ok) {
        showOverlay('deduce'); // 念のため
        onSolved();
      } else {
        CS.misses++;
        btn.disabled = true;
        btn.classList.add('suspect-wrong');
        $('deduce-hint').textContent = '💡 ヒント: ' + d.hint;
        showToast('🤔', 'ちがうみたい…てがかりを よくみて！');
      }
    });
    wrap.appendChild(btn);
  });
  showOverlay('deduce');
}

// ─── 事件解決 ───
function onSolved() {
  hideOverlay('deduce');
  const c = CS.case;
  const stars = CS.misses === 0 ? 3 : CS.misses <= 2 ? 2 : 1;
  const prevRank = getRank(solvedCount());
  const prevStars = G.solved[c.id] || 0;
  if (stars > prevStars) G.solved[c.id] = stars;
  else if (!G.solved[c.id]) G.solved[c.id] = stars;
  CS.casePhrases.forEach(learnPhrase);
  saveGame();
  const newRank = getRank(solvedCount());

  showStory(c.resolve, () => {
    // かいけつ画面
    $('solved-title-case').textContent = `${c.emoji} ${c.title}`;
    $('solved-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const list = $('solved-phrases');
    const uniq = [...new Set(CS.casePhrases)];
    list.innerHTML = uniq.map(en =>
      `<button class="note-row solved-phrase" data-en="${en.replace(/"/g,'&quot;')}">
        <span class="note-en">${en}</span><span class="note-play">🔊</span>
      </button>`).join('');
    list.querySelectorAll('.solved-phrase').forEach(b =>
      b.addEventListener('click', () => speak(b.dataset.en, { female:true })));
    spawnSolvedConfetti();
    showOverlay('solved');
    speak('Case closed! Great job, detective!', { female:true });

    $('btn-solved-ok').onclick = () => {
      hideOverlay('solved');
      if (newRank !== prevRank) {
        $('rank-icon-el').textContent = newRank.icon;
        $('rank-name-el').textContent = newRank.name;
        showOverlay('rank');
        $('btn-rank-ok').onclick = () => { hideOverlay('rank'); renderCasefile(); };
      } else {
        renderCasefile();
      }
    };
  });
}

function spawnSolvedConfetti() {
  const container = $('solved-confetti');
  container.innerHTML = '';
  const colors = ['#ff8fd0','#ffd166','#7bdff2','#b9fbc0','#ffadad','#bdb2ff'];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('div');
    const size = 7 + Math.random() * 8;
    piece.className = 'confetti-piece';
    piece.style.cssText = `left:${Math.random()*100}%;top:${-size}px;width:${size}px;height:${size}px;` +
      `background:${colors[i % colors.length]};` +
      `animation:confettiFall ${1.2 + Math.random()}s ${Math.random()*0.6}s ease-in forwards;` +
      `--rot:${Math.random()*720-360}deg;`;
    container.appendChild(piece);
  }
}

// ─── イベント登録 ───
function initEvents() {
  $('btn-title-start').onclick = renderNameInput;
  $('btn-title-load').onclick  = renderSaveSelect;

  $('btn-name-ok').onclick = () => {
    const name = $('hero-name-input').value.trim();
    if (!name) return;
    loadAllSlots();
    let slot = saveSlots.findIndex(s => s === null);
    if (slot === -1) {
      showConfirm('セーブデータが いっぱいです。さいしょの データを うわがきしますか？', 'うわがき', () => {
        G = makeNewState(name); G.slot = 0;
        startPrologue();
      });
      return;
    }
    G = makeNewState(name); G.slot = slot;
    startPrologue();
  };

  $('btn-save-new').onclick  = renderNameInput;
  $('btn-story-next').onclick = advanceStory;

  $('btn-note').onclick       = renderNote;
  $('btn-note-close').onclick = () => hideOverlay('note');
  $('btn-to-title').onclick   = renderTitle;
  $('btn-case-quit').onclick  = () => {
    showConfirm('じけんを ちゅうだんして じけんぼに もどりますか？', 'もどる', () => {
      stopSpeak(); renderCasefile();
    });
  };
}

function startPrologue() {
  saveGame();
  showScreen('casefile'); // 背景用
  showStory(PROLOGUE, () => {
    G.sawPrologue = true;
    saveGame();
    renderCasefile();
  });
}

// ─── 初期化 ───
window.addEventListener('DOMContentLoaded', () => {
  loadAllSlots();
  initEvents();
  renderTitle();
});
