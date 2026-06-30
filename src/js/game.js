'use strict';

// ─── DOM helper ───
const $ = id => document.getElementById(id);

// ─── 音声 ───
const VOICE_PROFILE = {
  riku: { pitch:1.2,  rate:0.88, preferFemale:false },
  paku: { pitch:0.72, rate:0.80, preferFemale:false },
  mimi: { pitch:1.55, rate:0.92, preferFemale:true  },
};
let cachedVoices = [];
function loadVoices() { cachedVoices = speechSynthesis.getVoices(); }
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function pickVoice(lang, preferFemale) {
  const voices = (cachedVoices.length ? cachedVoices : speechSynthesis.getVoices())
    .filter(v => v.lang.startsWith(lang));
  if (!voices.length) return null;
  const femK = ['female','zira','victoria','karen','samantha','fiona','moira','veena','tessa'];
  const malK  = ['male','david','mark','daniel','alex','lee','rishi'];
  const keys  = preferFemale ? femK : malK;
  return voices.find(v => keys.some(k => v.name.toLowerCase().includes(k))) || voices[0];
}

function speak(text, lang = 'en-US', onEnd = null) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  const prof = G.kobitKey ? VOICE_PROFILE[G.kobitKey] : null;
  utt.pitch = prof ? prof.pitch : 1.1;
  utt.rate  = prof ? prof.rate  : 0.85;
  if (prof) { const v = pickVoice('en', prof.preferFemale); if (v) utt.voice = v; }
  let done = false;
  const fin = () => { if (!done) { done = true; onEnd?.(); } };
  utt.onend = fin;
  setTimeout(fin, text.length * 130 + 1200);
  speechSynthesis.speak(utt);
}

// ─── STT ───
let recognition = null;
function initSTT() {
  if (recognition) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
}

// ─── セーブ ───
const SAVE_KEY = 'kotodama_saves_v2';
let saveSlots = [null, null, null];
let G = {};

function makeNewState(heroName, kobitKey) {
  const stats = getHeroStats(1);
  return {
    heroName, kobitKey,
    heroLv: 1, heroHp: stats.maxHp, heroMaxHp: stats.maxHp,
    heroMp: stats.maxMp, heroMaxMp: stats.maxMp,
    heroExp: 0, kotodamaPt: 0,
    stagesCleared: Array.from({length:4}, () => [false,false,false,false]),
    discovered: { monsters:[], magic:[], phrases:[] },
    slot: 0,
  };
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

function loadSlot(idx) {
  G = JSON.parse(JSON.stringify(saveSlots[idx]));
  const stats = getHeroStats(G.heroLv);
  G.heroMaxHp = stats.maxHp; G.heroMaxMp = stats.maxMp;
  G.heroHp = Math.min(G.heroHp, G.heroMaxHp);
  G.heroMp = Math.min(G.heroMp, G.heroMaxMp);
}

function deleteSlot(idx) {
  saveSlots[idx] = null;
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveSlots));
}

// ─── 画面管理 ───
const SCREEN_IDS = ['title','name','save','character','world','battle','zukan','ending'];
function showScreen(name) {
  speechSynthesis?.cancel();
  SCREEN_IDS.forEach(id => {
    $(`screen-${id}`)?.classList.toggle('hidden', id !== name);
  });
}

const OVERLAY_IDS = ['story','result','english','levelup','evolution','minigame','victory','confirm','conv-select','conversation'];
function showOverlay(name)  { $(`overlay-${name}`)?.classList.remove('hidden'); }
function hideOverlay(name)  { $(`overlay-${name}`)?.classList.add('hidden'); }
function hideAllOverlays()  { OVERLAY_IDS.forEach(id => hideOverlay(id)); }

// ─── 確認ダイアログ（confirm() の代替） ───
function showConfirm(msg, yesLabel, onYes) {
  $('confirm-msg').textContent = msg;
  $('btn-confirm-yes').textContent = yesLabel;
  showOverlay('confirm');
  $('btn-confirm-yes').onclick = () => { hideOverlay('confirm'); onYes(); };
  $('btn-confirm-no').onclick  = () => hideOverlay('confirm');
}

// ─── トースト ───
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

// ─── タイトル ───
function renderTitle() {
  showScreen('title');
  hideAllOverlays();
  loadAllSlots();
  $('btn-title-load').classList.toggle('hidden', !saveSlots.some(s => s !== null));
}

// ─── 名前入力 ───
function renderNameInput() {
  showScreen('name');
  const inp = $('hero-name-input');
  const btn = $('btn-name-ok');
  inp.value = '';
  btn.disabled = true;
  inp.oninput = () => { btn.disabled = inp.value.trim().length === 0; };
}

// ─── セーブ選択 ───
function renderSaveSelect() {
  showScreen('save');
  const container = $('save-slots');
  container.innerHTML = '';
  let anySlot = false;
  saveSlots.forEach((save, idx) => {
    if (!save) return;
    anySlot = true;
    const evo = getKobitoEvo(save.kobitKey, save.kotodamaPt);
    const areasDone = save.stagesCleared.filter(a => a.every(Boolean)).length;
    const div = document.createElement('div');
    div.className = 'save-slot';
    div.innerHTML = `
      <div class="save-info">
        <span class="save-name">${save.heroName}</span>
        <span class="save-lv">Lv ${save.heroLv}  エリア ${areasDone}/4</span>
        <span class="save-kobito">🧑‍🤝‍🧑 ${evo.name}</span>
      </div>
      <div class="save-btns">
        <button class="sub-btn" data-idx="${idx}" data-act="load">▶ つづける</button>
        <button class="danger-btn" data-idx="${idx}" data-act="del">🗑</button>
      </div>`;
    container.appendChild(div);
  });
  if (!anySlot) renderNameInput();

  container.querySelectorAll('[data-act="load"]').forEach(btn => btn.addEventListener('click', () => {
    const idx = +btn.dataset.idx;
    loadSlot(idx); initSTT(); renderWorldMap();
  }));
  container.querySelectorAll('[data-act="del"]').forEach(btn => btn.addEventListener('click', () => {
    const idx = +btn.dataset.idx;
    const name = saveSlots[idx]?.heroName;
    showConfirm(`「${name}」のデータをけしますか？`, 'けす', () => {
      deleteSlot(idx); renderSaveSelect();
    });
  }));
}

// ─── キャラ選択 ───
function renderCharSelect() {
  showScreen('character');
  document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
}

// ─── ワールドマップ ───
// こびとの励ましセリフ（英会話前向きなもの）
const KOBITO_CHEERS = [
  'いっしょに えいごを れんしゅうしよう！',
  'えいごで はなすと ことだまポイントが たまるよ！',
  'もっと えいごを おぼえたら つよくなれるよ！',
  'きょうも えいごの れんしゅう しようね♪',
  'マイクで いえたら ポイント 2ばい だよ！',
];

function renderWorldMap() {
  showScreen('world');
  hideAllOverlays();

  const evo = getKobitoEvo(G.kobitKey, G.kotodamaPt);
  $('world-kobito-img').src = `img/${G.kobitKey}.png`;
  $('world-kobito-big').src = `img/${G.kobitKey}.png`;
  $('world-hero-name').textContent = G.heroName;
  $('world-hero-lv').textContent   = `Lv ${G.heroLv}  ${evo.name}`;

  $('world-hp-bar').style.width = (G.heroHp / G.heroMaxHp * 100) + '%';
  $('world-hp-num').textContent = `${G.heroHp}/${G.heroMaxHp}`;

  const expToNext = getHeroStats(G.heroLv).expToNext;
  $('world-exp-bar').style.width = Math.min(G.heroExp / expToNext * 100, 100) + '%';
  $('world-exp-num').textContent = `${G.heroExp}/${expToNext}`;

  const ptMax = 100;
  $('world-pt-bar').style.width = Math.min(G.kotodamaPt / ptMax * 100, 100) + '%';
  $('world-pt-num').textContent = G.kotodamaPt;

  // こびとの吹き出しをランダムセリフに
  $('world-kobito-bubble').textContent =
    KOBITO_CHEERS[Math.floor(Math.random() * KOBITO_CHEERS.length)];

  // ぼうけんエリアボタン（コンパクト）
  const container = $('area-buttons');
  container.innerHTML = '';
  AREA_DATA.forEach((area, ai) => {
    const unlocked = G.heroLv >= area.unlockLv;
    const cleared  = G.stagesCleared[ai];
    const doneCnt  = cleared.filter(Boolean).length;
    const stars    = '★'.repeat(doneCnt) + '☆'.repeat(4 - doneCnt);
    const btn = document.createElement('button');
    btn.className = 'area-btn' + (unlocked ? '' : ' locked');
    btn.innerHTML = `
      <span class="area-emoji">${area.emoji}</span>
      <span class="area-name">${area.name}</span>
      <span class="area-stars">${stars}</span>
      ${unlocked ? '' : `<span class="area-lock">🔒 Lv${area.unlockLv}</span>`}`;
    if (unlocked) btn.addEventListener('click', () => startAreaFlow(ai));
    container.appendChild(btn);
  });
}

// ─── ストーリーオーバーレイ ───
let storyQueue = [], storyDone = null;
function showStory(lines, onDone) {
  storyQueue = [...lines]; storyDone = onDone;
  showOverlay('story'); advanceStory();
}
function advanceStory() {
  if (!storyQueue.length) { hideOverlay('story'); storyDone?.(); storyDone = null; return; }
  $('story-text').textContent = storyQueue.shift();
}

// ─── エリアフロー ───
function startAreaFlow(ai) {
  const area = AREA_DATA[ai];
  const cleared = G.stagesCleared[ai];
  const firstVisit = cleared.every(c => !c);
  if (firstVisit) { showStory(area.intro, () => runNextStage(ai)); }
  else { runNextStage(ai); }
}

function runNextStage(ai) {
  const stageIdx = G.stagesCleared[ai].findIndex(c => !c);
  if (stageIdx === -1) { startBattle(ai, 0); return; }
  if (stageIdx === 3) {
    showStory([AREA_DATA[ai].bossIntro], () => startBattle(ai, 3));
  } else {
    startBattle(ai, stageIdx);
  }
}

// ─── バトル ───
let BT = { ai:0, si:0, enemy:null, enemyHp:0, phase:'idle', log:[] };
const ENEMY_IMG_CACHE = {}; // { enemyId: true|false } 画像存在チェック結果キャッシュ

function startBattle(ai, si) {
  const area = AREA_DATA[ai];
  const isBoss = si === 3;
  const enemyId = isBoss ? area.boss : area.enemies[si % area.enemies.length];
  BT = { ai, si, enemy:{ ...ENEMY_DATA[enemyId], id:enemyId }, enemyHp:ENEMY_DATA[enemyId].hp, phase:'hero-turn', log:[] };
  discoverMonster(enemyId);
  showScreen('battle');
  renderBattle();
  renderMagicBtns();
}

function renderBattle() {
  const { enemy, enemyHp } = BT;
  const origHp = ENEMY_DATA[enemy.id].hp;
  $('enemy-name').textContent   = `${enemy.name}${enemy.boss ? ' 👑' : ''}`;
  $('enemy-hp-bar').style.width = (enemyHp / origHp * 100) + '%';
  $('enemy-hp-num').textContent = `${enemyHp}/${origHp}`;

  // 画像があれば img、なければ絵文字にフォールバック（キャッシュ済みなら即反映）
  const imgEl   = $('enemy-img');
  const emojiEl = $('enemy-emoji-big');
  const imgSrc  = `img/enemy_${enemy.id}.png`;
  if (imgEl.dataset.loadedId === enemy.id) {
    // 同じ敵の再描画 — そのまま
  } else if (ENEMY_IMG_CACHE[enemy.id] === true) {
    imgEl.src = imgSrc;
    imgEl.classList.remove('hidden');
    emojiEl.classList.add('hidden');
    imgEl.dataset.loadedId = enemy.id;
  } else if (ENEMY_IMG_CACHE[enemy.id] === false) {
    imgEl.classList.add('hidden');
    emojiEl.textContent = enemy.emoji;
    emojiEl.classList.remove('hidden');
  } else {
    const testImg = new Image();
    testImg.onload = () => {
      ENEMY_IMG_CACHE[enemy.id] = true;
      imgEl.src = imgSrc;
      imgEl.classList.remove('hidden');
      emojiEl.classList.add('hidden');
      imgEl.dataset.loadedId = enemy.id;
    };
    testImg.onerror = () => {
      ENEMY_IMG_CACHE[enemy.id] = false;
      imgEl.classList.add('hidden');
      emojiEl.textContent = enemy.emoji;
      emojiEl.classList.remove('hidden');
    };
    testImg.src = imgSrc;
  }

  const logEl = $('battle-log');
  logEl.innerHTML = BT.log.map(l => `<p class="log-line log-${l.type}">${l.text}</p>`).join('');
  logEl.scrollTop = logEl.scrollHeight;

  const evo = getKobitoEvo(G.kobitKey, G.kotodamaPt);
  $('battle-kobito-img').src  = `img/${G.kobitKey}.png`;
  $('battle-kobito-name').textContent = evo.name;

  $('battle-hero-name').textContent = G.heroName;
  $('battle-hero-hp-bar').style.width = (G.heroHp / G.heroMaxHp * 100) + '%';
  $('battle-hero-hp-num').textContent = `${G.heroHp}/${G.heroMaxHp}`;
  $('battle-hero-mp-bar').style.width = (G.heroMp / G.heroMaxMp * 100) + '%';
  $('battle-hero-mp-num').textContent = `${G.heroMp}/${G.heroMaxMp}`;
}

function addLog(text, type = 'normal') {
  BT.log.push({ text, type });
  if (BT.log.length > 10) BT.log.shift();
  renderBattle();
}

function shakeEnemy() {
  const el = $('enemy-img').classList.contains('hidden')
    ? $('enemy-emoji-big') : $('enemy-img');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 450);
}

function defeatEnemy() {
  const el = $('enemy-img').classList.contains('hidden')
    ? $('enemy-emoji-big') : $('enemy-img');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('enemy-defeated');
}

function spawnConfetti() {
  const container = $('victory-confetti');
  container.innerHTML = '';
  const colors = ['#fbbf24','#34d399','#f87171','#60a5fa','#f472b6','#a78bfa','#ffffff'];
  const shapes = ['circle','rect','star'];

  // 紙吹雪
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    const color = colors[i % colors.length];
    const shape = shapes[i % shapes.length];
    const size = 7 + Math.random() * 9;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.7;
    const dur = 1.1 + Math.random() * 0.9;
    const rot = Math.random() * 900 - 450;
    piece.className = `confetti-piece confetti-${shape}`;
    piece.style.cssText = `left:${left}%;top:${-size}px;width:${size}px;height:${size}px;background:${color};animation:confettiFall ${dur}s ${delay}s ease-in forwards;--rot:${rot}deg;`;
    container.appendChild(piece);
  }

  // 中心から飛び散る星
  const stars = ['⭐','✨','🌟','💫'];
  const angles = [0, 60, 120, 180, 240, 300];
  angles.forEach((deg, idx) => {
    const star = document.createElement('div');
    star.className = 'victory-star';
    star.textContent = stars[idx % stars.length];
    const rad = (deg * Math.PI) / 180;
    const dist = 70 + Math.random() * 40;
    star.style.cssText = `left:50%;top:40%;--sx:${Math.cos(rad)*dist}px;--sy:${Math.sin(rad)*dist}px;animation-delay:${0.1*idx}s;`;
    container.appendChild(star);
  });
}

function showVictoryOverlay(enemy, expGain, isBoss, onDone) {
  const imgSrc = `img/enemy_${enemy.id}.png`;

  // 画像 or 絵文字
  const imgEl   = $('victory-enemy-img');
  const emojiEl = $('victory-enemy-emoji');
  if (ENEMY_IMG_CACHE[enemy.id] === true) {
    imgEl.src = imgSrc;
    imgEl.classList.remove('hidden');
    emojiEl.classList.add('hidden');
  } else {
    emojiEl.textContent = enemy.emoji;
    emojiEl.classList.remove('hidden');
    imgEl.classList.add('hidden');
  }

  $('victory-title').textContent    = isBoss ? '👑 ボスをたおした！ 👑' : '🎉 やったー！ 🎉';
  $('victory-enemy-name').textContent = enemy.name;
  $('victory-rewards').innerHTML     = `<span class="reward-exp">EXP +${expGain}</span>`;

  spawnConfetti();
  showOverlay('victory');

  $('btn-victory-ok').onclick = () => {
    hideOverlay('victory');
    onDone();
  };
}

function renderMagicBtns() {
  const cont = $('magic-buttons');
  cont.innerHTML = '';
  if (BT.phase !== 'hero-turn') {
    cont.innerHTML = '<p class="waiting-text">...</p>'; return;
  }
  getAvailableMagic(G.heroLv).forEach(magic => {
    const btn = document.createElement('button');
    btn.className = 'magic-btn';
    const ok = G.heroMp >= magic.mp;
    if (!ok) btn.classList.add('mp-empty');
    btn.disabled = !ok;
    btn.innerHTML = `${magic.emoji} ${magic.name}<span class="mp-cost">MP ${magic.mp}</span>`;
    btn.addEventListener('click', () => doHeroAttack(magic));
    cont.appendChild(btn);
  });
}

// ── 魔法エフェクト ──
function castMagicAnim(magic, onHit) {
  const screen    = $('screen-battle');
  const enemyArea = $('battle-enemy-area');

  const sr = screen.getBoundingClientRect();
  const er = enemyArea.getBoundingClientRect();

  // 発射元: 画面下中央, 目標: 敵エリア中央
  const sx = sr.width  * 0.5;
  const sy = sr.height * 0.80;
  const ex = (er.left - sr.left) + er.width  * 0.5;
  const ey = (er.top  - sr.top)  + er.height * 0.55;

  const proj = document.createElement('div');
  proj.className = `magic-proj magic-proj-${magic.id}`;
  proj.style.left = sx + 'px';
  proj.style.top  = sy + 'px';
  proj.style.setProperty('--dx', (ex - sx) + 'px');
  proj.style.setProperty('--dy', (ey - sy) + 'px');
  screen.appendChild(proj);

  setTimeout(() => {
    proj.remove();
    // インパクトフラッシュ
    const imp = document.createElement('div');
    imp.className = `magic-impact magic-impact-${magic.id}`;
    enemyArea.appendChild(imp);
    setTimeout(() => imp.remove(), 400);
    onHit();
  }, 420);
}

function doHeroAttack(magic) {
  if (BT.phase !== 'hero-turn') return;
  BT.phase = 'processing';
  renderMagicBtns();

  G.heroMp = Math.max(0, G.heroMp - magic.mp);
  // レベルごとに攻撃力が大きく伸びる設計（Lv*0.15）、防御は2倍係数で壁になる
  const dmg = Math.max(1, Math.floor(magic.power * (1 + G.heroLv * 0.15) - BT.enemy.def * 2));

  // 魔法アニメーション → ヒット処理
  castMagicAnim(magic, () => {
    BT.enemyHp = Math.max(0, BT.enemyHp - dmg);
    discoverMagic(magic.id);
    shakeEnemy();
    addLog(`${magic.emoji}${magic.name}！ ${BT.enemy.name}に ${dmg}ダメージ！`, 'hero');

    if (BT.enemyHp <= 0) { setTimeout(onWin, 700); return; }

    // こびと攻撃
    setTimeout(() => {
      const katk = getKobitoAtk(G.kobitKey, G.kotodamaPt);
      const kdmg = Math.max(1, katk - Math.floor(BT.enemy.def / 2));
      BT.enemyHp = Math.max(0, BT.enemyHp - kdmg);
      const kevo = getKobitoEvo(G.kobitKey, G.kotodamaPt);
      shakeEnemy();
      addLog(`${kevo.name}のこうげき！ ${kdmg}ダメージ！`, 'kobito');

      if (BT.enemyHp <= 0) { setTimeout(onWin, 700); return; }

      // 敵攻撃
      setTimeout(() => {
        const edmg = Math.max(1, BT.enemy.atk - 2);
        G.heroHp = Math.max(0, G.heroHp - edmg);
        addLog(`${BT.enemy.emoji}${BT.enemy.name}のこうげき！ ${edmg}ダメージ！`, 'enemy');

        if (G.heroHp <= 0) { setTimeout(onLose, 700); return; }
        BT.phase = 'hero-turn';
        renderBattle();
        renderMagicBtns();
      }, 850);
    }, 700);
  });
}

function onWin() {
  BT.phase = 'done';
  const expGain = BT.enemy.exp;
  const isBoss  = BT.enemy.boss || false;
  G.stagesCleared[BT.ai][BT.si] = true;

  // EXP計算
  const prevLv = G.heroLv;
  G.heroExp += expGain;
  let lvUp = false;
  while (G.heroExp >= getHeroStats(G.heroLv).expToNext) {
    G.heroExp -= getHeroStats(G.heroLv).expToNext;
    G.heroLv++;
    lvUp = true;
  }
  // HP/MP更新・全回復
  const stats = getHeroStats(G.heroLv);
  G.heroMaxHp = stats.maxHp; G.heroMaxMp = stats.maxMp;
  G.heroHp = G.heroMaxHp; G.heroMp = G.heroMaxMp;

  addLog(`${BT.enemy.emoji}を たおした！ EXP+${expGain}`, 'win');
  saveGame();

  const areaAllDone = G.stagesCleared[BT.ai].every(Boolean);
  const isFinalArea = BT.ai === 3;

  const proceed = () => {
    if (areaAllDone && isFinalArea) { showEnding(); }
    else if (areaAllDone) { showStory([AREA_DATA[BT.ai].clear], () => renderWorldMap()); }
    else { renderWorldMap(); }
  };

  // 敵消滅アニメ → 勝利オーバーレイ
  defeatEnemy();
  setTimeout(() => {
    showVictoryOverlay(BT.enemy, expGain, isBoss, () => {
      if (lvUp) {
        showLevelUpOverlay(prevLv, G.heroLv, () => {
          startEnglishPractice(proceed, true);
        });
      } else {
        proceed();
      }
    });
  }, 750);
}

function onLose() {
  BT.phase = 'done';
  G.heroHp = Math.max(1, Math.floor(G.heroMaxHp * 0.5));
  $('result-icon').textContent  = '💀';
  $('result-title').textContent = 'やられた…';
  $('result-detail').textContent = 'HPを かいふく して もう一度！';
  $('btn-result-ok').textContent = 'もう一度 ▶';
  $('btn-result-ok').dataset.mode = 'retry';
  showOverlay('result');
}

// ─── レベルアップ表示 ───
function showLevelUpOverlay(prevLv, newLv, onDone) {
  $('levelup-kobito-img').src = `img/${G.kobitKey}.png`;
  const prev = getHeroStats(prevLv), cur = getHeroStats(newLv);
  $('levelup-detail').textContent =
    `Lv ${prevLv} → Lv ${newLv}\nHP: ${prev.maxHp} → ${cur.maxHp}\nMP: ${prev.maxMp} → ${cur.maxMp}`;
  showOverlay('levelup');
  $('btn-levelup-ok').onclick = () => { hideOverlay('levelup'); onDone(); };
}

// ─── 英会話練習 ───
let ENG = { phrases:[], idx:0, earned:0, expEarned:0, done:null };

// 英会話でのEXP獲得量 — 3問セッションで確実にLvUpできるよう多め
const ENG_EXP_TAP = 14;
const ENG_EXP_MIC = 24;

function startEnglishPractice(onDone, fromLevelUp = false, firstTime = false) {
  ENG = { phrases: getPhrasesForLevel(G.heroLv, 3), idx:0, earned:0, expEarned:0, done: onDone };
  $('eng-kobito-img').src = `img/${G.kobitKey}.png`;
  if (fromLevelUp) {
    $('eng-label').textContent = '🌟 レベルアップ！ えいごで パワーアップ！';
  } else if (firstTime) {
    $('eng-label').textContent = '👋 はじめまして！ えいごを れんしゅうしよう！';
  } else {
    $('eng-label').textContent = '💬 えいごれんしゅう！ ことだまポイントゲット！';
  }
  showOverlay('english');
  showEngPhrase(0);
}

function showEngPhrase(idx) {
  if (idx >= ENG.phrases.length) { endEnglish(); return; }
  const p = ENG.phrases[idx];
  ENG.idx = idx;
  discoverPhrase(p);

  $('eng-bubble').textContent = p.says;
  $('eng-prompt').textContent = p.prompt;
  updateEngDisplay();

  const choicesEl = $('eng-choices');
  choicesEl.innerHTML = '';
  p.choices.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch;
    btn.addEventListener('click', () => onEngTap(ch, btn, p));
    choicesEl.appendChild(btn);
  });

  const micBtn = $('eng-btn-mic');
  if (recognition) {
    micBtn.className = 'mic-btn';
    micBtn.onclick = () => onEngMic(p);
  } else {
    micBtn.classList.add('hidden');
  }

  setTimeout(() => speak(p.says, 'en-US'), 400);
}

function onEngTap(choice, btnEl, phrase) {
  document.querySelectorAll('#eng-choices .choice-btn').forEach(b => b.disabled = true);
  const best = !phrase.best || choice === phrase.best;
  btnEl.classList.add(best ? 'chosen-best' : 'chosen');

  const prevPt = G.kotodamaPt;
  G.kotodamaPt  += 1;  ENG.earned   += 1;
  G.heroExp     += ENG_EXP_TAP; ENG.expEarned += ENG_EXP_TAP;
  updateEngDisplay();

  setTimeout(() => speak(phrase.reaction, 'en-US', () =>
    checkEvo(prevPt, G.kotodamaPt, () => setTimeout(() => showEngPhrase(ENG.idx + 1), 600))
  ), 400);
}

function onEngMic(phrase) {
  if (!recognition) return;
  const micBtn = $('eng-btn-mic');
  micBtn.classList.add('listening');
  recognition.onresult = () => {
    micBtn.classList.remove('listening');
    document.querySelectorAll('#eng-choices .choice-btn').forEach(b => b.disabled = true);

    const prevPt = G.kotodamaPt;
    G.kotodamaPt  += 2;  ENG.earned   += 2;
    G.heroExp     += ENG_EXP_MIC; ENG.expEarned += ENG_EXP_MIC;
    updateEngDisplay();

    setTimeout(() => speak(phrase.reaction, 'en-US', () =>
      checkEvo(prevPt, G.kotodamaPt, () => setTimeout(() => showEngPhrase(ENG.idx + 1), 600))
    ), 400);
  };
  recognition.onerror = recognition.onend = () => micBtn.classList.remove('listening');
  try { recognition.start(); } catch(e) {}
}

function updateEngDisplay() {
  const expToNext = getHeroStats(G.heroLv).expToNext;
  $('eng-pt-display').textContent =
    `ことだまPt: ${G.kotodamaPt}(+${ENG.earned}✨)  EXP: ${G.heroExp}/${expToNext}(+${ENG.expEarned}⬆️)`;
}

function endEnglish() {
  hideOverlay('english');

  // 英会話によるレベルアップチェック（再帰しない）
  const prevLv = G.heroLv;
  let lvUp = false;
  while (G.heroExp >= getHeroStats(G.heroLv).expToNext) {
    G.heroExp -= getHeroStats(G.heroLv).expToNext;
    G.heroLv++;
    lvUp = true;
  }
  if (lvUp) {
    const stats = getHeroStats(G.heroLv);
    G.heroMaxHp = stats.maxHp; G.heroMaxMp = stats.maxMp;
    G.heroHp    = G.heroMaxHp; G.heroMp    = G.heroMaxMp;
  }

  saveGame();
  showToast('🌟', `+${ENG.earned}Pt  EXP+${ENG.expEarned}！`);

  if (lvUp) {
    // 英会話LvUp後は更に英会話を呼ばず、ワールドマップへ
    showLevelUpOverlay(prevLv, G.heroLv, () => { ENG.done?.(); });
  } else {
    ENG.done?.();
  }
}

// ─── こびと進化チェック ───
function checkEvo(prevPt, newPt, onDone) {
  for (const t of [30, 70]) {
    if (prevPt < t && newPt >= t) {
      const evo = getKobitoEvo(G.kobitKey, newPt);
      $('evo-kobito-img').src  = `img/${G.kobitKey}.png`;
      $('evo-name').textContent = evo.name;
      $('evo-title-text').textContent = evo.title;
      showOverlay('evolution');
      $('btn-evo-ok').onclick = () => { hideOverlay('evolution'); saveGame(); onDone?.(); };
      return;
    }
  }
  onDone?.();
}

// ─── エンディング ───
function showEnding() {
  showScreen('ending');
  $('ending-kobito').src = `img/${G.kobitKey}.png`;
  const evo = getKobitoEvo(G.kobitKey, G.kotodamaPt);
  $('ending-text').textContent =
    `やみのぬしを たおして ことだまのもりを すくった！\n${G.heroName} は Lv ${G.heroLv} まで そだった！\nこびと「${evo.name}」と いっしょに せかいへいわを まもった！\nことだまポイント: ${G.kotodamaPt}`;
}

// ─── 図鑑 ───
let zukanTab = 'monster';
function renderZukan(tab) {
  zukanTab = tab || zukanTab;
  showScreen('zukan');
  document.querySelectorAll('.zukan-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === zukanTab));

  const list = $('zukan-list');
  list.innerHTML = '';
  const mkEntry = (emoji, title, desc, discovered) => {
    const div = document.createElement('div');
    div.className = 'zukan-entry' + (discovered ? '' : ' unknown');
    div.innerHTML = `<span class="zukan-emoji">${discovered ? emoji : '？'}</span>
      <div><b>${discovered ? title : '???'}</b><p>${discovered ? desc : 'まだ みつかっていない'}</p></div>`;
    list.appendChild(div);
  };

  if (zukanTab === 'monster') {
    Object.entries(ENEMY_DATA).forEach(([id, e]) =>
      mkEntry(e.emoji, e.name + (e.boss ? ' 👑':''), e.desc, G.discovered.monsters.includes(id)));
  } else if (zukanTab === 'magic') {
    MAGIC_DATA.forEach(m =>
      mkEntry(m.emoji, m.name, `MP:${m.mp}  威力:${m.power}\n${m.desc}`, G.discovered.magic.includes(m.id)));
  } else {
    ENGLISH_PHRASES.forEach((p, i) =>
      mkEntry('💬', `"${p.says}"`, p.prompt, G.discovered.phrases.includes(i)));
  }
}

// ─── 図鑑登録 ───
function discoverMonster(id) {
  if (!G.discovered?.monsters.includes(id)) { G.discovered.monsters.push(id); }
}
function discoverMagic(id) {
  if (!G.discovered?.magic.includes(id)) { G.discovered.magic.push(id); }
}
function discoverPhrase(phrase) {
  const i = ENGLISH_PHRASES.indexOf(phrase);
  if (i >= 0 && !G.discovered?.phrases.includes(i)) G.discovered.phrases.push(i);
}

// ─── 英会話モード ───
let CONV = { conv: null, turnIdx: 0, playerTurns: 0, earned: 0 };

function showConvSelect() {
  const list = $('conv-select-list');
  list.innerHTML = '';
  CONVERSATION_DATA.forEach(conv => {
    const locked = G.heroLv < conv.minLv;
    const btn = document.createElement('button');
    btn.className = 'conv-topic-card' + (locked ? ' conv-locked' : '');
    btn.innerHTML = `
      <span class="conv-topic-emoji">${conv.emoji}</span>
      <span class="conv-topic-info">
        <span class="conv-topic-name">${conv.title}</span>
        <span class="conv-topic-lv">${locked ? `🔒 Lv${conv.minLv}から` : 'えいごで おはなし！'}</span>
      </span>
      ${locked ? '' : '<span class="conv-topic-arrow">▶</span>'}`;
    if (!locked) btn.addEventListener('click', () => {
      hideOverlay('conv-select');
      startConversation(conv.id);
    });
    list.appendChild(btn);
  });
  showOverlay('conv-select');
}

function startConversation(convId) {
  const conv = CONVERSATION_DATA.find(c => c.id === convId);
  if (!conv) return;
  const playerTurns = conv.turns.filter(t => t.who === 'p').length;
  CONV = { conv, turnIdx: 0, playerTurns, earned: 0 };
  $('conv-title').textContent = conv.emoji + ' ' + conv.title;
  $('conv-progress').textContent = `0/${playerTurns}`;
  $('conv-chat').innerHTML = '';
  $('conv-choices').innerHTML = '';
  showOverlay('conversation');
  setTimeout(showConvTurn, 300);
}

function showConvTurn() {
  const { conv, turnIdx } = CONV;
  if (turnIdx >= conv.turns.length) { endConversation(); return; }
  const turn = conv.turns[turnIdx];

  if (turn.who === 'k') {
    addConvBubbleKobito('typing');
    const delay = 600 + turn.text.length * 18;
    setTimeout(() => {
      removeConvTyping();
      addConvBubbleKobito('text', turn.text);
      speak(turn.tts || turn.text, 'en-US', () => {
        CONV.turnIdx++;
        setTimeout(showConvTurn, 400);
      });
    }, Math.min(delay, 1400));
  } else {
    showConvChoices(turn);
  }
}

function addConvBubbleKobito(type, text) {
  const chat = $('conv-chat');
  const el = document.createElement('div');
  el.className = 'conv-turn conv-turn-kobito';
  if (type === 'typing') {
    el.id = 'conv-typing-row';
    el.innerHTML = `<img src="img/${G.kobitKey}.png" class="conv-kobito-icon" alt="">
      <div class="conv-bubble conv-bubble-kobito">
        <div class="conv-typing-dots">
          <div class="conv-typing-dot"></div><div class="conv-typing-dot"></div><div class="conv-typing-dot"></div>
        </div>
      </div>`;
  } else if (type === 'text') {
    el.innerHTML = `<img src="img/${G.kobitKey}.png" class="conv-kobito-icon" alt="">
      <div class="conv-bubble conv-bubble-kobito">${text}</div>`;
  } else {
    el.innerHTML = `<img src="img/${G.kobitKey}.png" class="conv-kobito-icon" alt="">
      <div class="conv-bubble conv-bubble-reaction">${text}</div>`;
  }
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function removeConvTyping() {
  document.getElementById('conv-typing-row')?.remove();
}

function addConvBubblePlayer(text) {
  const chat = $('conv-chat');
  const el = document.createElement('div');
  el.className = 'conv-turn conv-turn-player';
  el.innerHTML = `<div class="conv-bubble conv-bubble-player">${text}</div>
    <div class="conv-avatar-player">👤</div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function showConvChoices(turn) {
  const el = $('conv-choices');
  el.innerHTML = `<p class="conv-prompt-label">💬 ${turn.prompt}</p>`;
  turn.choices.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'conv-choice-btn';
    btn.textContent = ch;
    btn.addEventListener('click', () => onConvChoice(ch, btn, turn));
    el.appendChild(btn);
  });
}

function onConvChoice(choice, btnEl, turn) {
  $('conv-choices').querySelectorAll('.conv-choice-btn').forEach(b => {
    b.disabled = true;
    if (b === btnEl) b.classList.add('conv-chosen');
  });
  $('conv-choices').innerHTML = '';

  addConvBubblePlayer(choice);
  speak(choice, 'en-US');

  const prevPt = G.kotodamaPt;
  G.kotodamaPt++;
  G.heroExp += ENG_EXP_TAP;
  CONV.earned++;
  CONV.turnIdx++;

  const done = CONV.conv.turns.filter((t,i) => t.who==='p' && i < CONV.turnIdx).length;
  $('conv-progress').textContent = `${done}/${CONV.playerTurns}`;

  if (turn.reaction) {
    setTimeout(() => {
      addConvBubbleKobito('typing');
      setTimeout(() => {
        removeConvTyping();
        addConvBubbleKobito('reaction', turn.reaction);
        speak(turn.reaction, 'en-US', () => {
          checkEvo(prevPt, G.kotodamaPt, () => setTimeout(showConvTurn, 400));
        });
      }, 700);
    }, 500);
  } else {
    checkEvo(prevPt, G.kotodamaPt, () => setTimeout(showConvTurn, 400));
  }
}

function endConversation() {
  const earned = CONV.earned;
  saveGame();
  showToast('💬', `えいかいわ かんりょう！ Pt+${earned}`);
  $('conv-choices').innerHTML = `
    <div class="conv-finish">
      <p class="conv-finish-title">🎉 かいわ かんりょう！</p>
      <span class="conv-pt-gain">ことだまPt +${earned}</span>
      <button id="btn-conv-finish" class="big-btn">おわり ▶</button>
    </div>`;
  $('btn-conv-finish').onclick = () => {
    hideOverlay('conversation');
    renderWorldMap();
  };
}

// ─── ミニゲーム ───
let MG = { type:null, items:[], idx:0, score:0, total:5 };

function startMiniGame(type) {
  MG.type = type; MG.idx = 0; MG.score = 0; MG.total = 5;
  const pool = [...(type === 'shadow' ? MG_SHADOW : MG_WORDPOP)].sort(() => Math.random()-0.5);
  MG.items = pool.slice(0, MG.total);
  $('mg-title').textContent = type === 'shadow' ? '🌑 かげあてゲーム' : '💥 たんごポップ';
  renderMGItem();
}

function renderMGItem() {
  const body = $('mg-body');
  $('mg-score-display').textContent = `${MG.idx + 1} / ${MG.total}  スコア: ${MG.score}`;
  if (MG.idx >= MG.total) { endMG(); return; }
  const item = MG.items[MG.idx];
  const choices = MG.type === 'shadow' ? item.choices : item.c;
  const answer  = MG.type === 'shadow' ? item.word    : item.en;

  if (MG.type === 'shadow') {
    body.innerHTML = `
      <div class="mg-shadow-emoji">${item.emoji}</div>
      <p class="mg-hint">${item.hint}</p>
      <div class="mg-choices"></div>`;
  } else {
    body.innerHTML = `
      <div class="mg-jp-word">${item.jp}</div>
      <div class="mg-choices"></div>`;
  }
  const choicesEl = body.querySelector('.mg-choices');
  [...choices].sort(() => Math.random()-0.5).forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'mg-choice-btn';
    btn.textContent = ch;
    btn.dataset.word = ch;
    btn.addEventListener('click', () => onMGAnswer(btn, ch, answer));
    choicesEl.appendChild(btn);
  });
}

function onMGAnswer(btnEl, choice, answer) {
  $('mg-body').querySelectorAll('.mg-choice-btn').forEach(b => {
    b.disabled = true;
    if (b.dataset.word === answer) b.classList.add('mg-correct');
  });
  if (choice === answer) { btnEl.classList.add('mg-correct'); MG.score++; showToast('⭕','せいかい！'); }
  else                   { btnEl.classList.add('mg-wrong');  showToast('❌','ざんねん！'); }
  speak(answer, 'en-US');
  setTimeout(() => { MG.idx++; renderMGItem(); }, 1300);
}

function endMG() {
  const gain = MG.score;
  const prevPt = G.kotodamaPt;
  G.kotodamaPt += gain;
  saveGame();
  $('mg-body').innerHTML = `
    <div class="mg-result">
      <p>スコア: <b>${MG.score} / ${MG.total}</b></p>
      <p>ことだまポイント +${gain}！</p>
      <button id="btn-mg-finish" class="big-btn" style="margin-top:12px">おわり ✓</button>
    </div>`;
  $('mg-score-display').textContent = '';
  $('btn-mg-finish').onclick = () => {
    checkEvo(prevPt, G.kotodamaPt, () => { hideOverlay('minigame'); renderWorldMap(); });
  };
}

// ─── イベント登録 ───
function initEvents() {
  // タイトル
  $('btn-title-start').onclick = renderNameInput;
  $('btn-title-load').onclick  = renderSaveSelect;

  // 名前入力
  $('btn-name-ok').onclick = () => {
    const name = $('hero-name-input').value.trim();
    if (!name) return;
    const slot = saveSlots.findIndex(s => s === null);
    if (slot === -1) {
      showConfirm('セーブデータが いっぱいです。最初のスロットを 上書きしますか？', '上書き', () => {
        G = makeNewState(name, 'riku'); G.slot = 0;
        renderCharSelect();
      });
      return;
    }
    G = makeNewState(name, 'riku'); G.slot = slot;
    renderCharSelect();
  };

  // キャラ選択
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setTimeout(() => {
        G.kobitKey = card.dataset.key;
        saveGame(); initSTT();
        // キャラ選択直後は英会話練習から開始（初回オンボーディング）
        startEnglishPractice(() => renderWorldMap(), false, true);
      }, 400);
    });
  });

  // セーブ選択→新規
  $('btn-save-new').onclick = renderNameInput;

  // ストーリー次へ
  $('btn-story-next').onclick = advanceStory;

  // バトル結果
  $('btn-result-ok').onclick = () => {
    hideOverlay('result');
    startBattle(BT.ai, BT.si);
  };

  // 図鑑
  $('btn-zukan').onclick = () => renderZukan('monster');
  $('btn-zukan-back').onclick = renderWorldMap;
  document.querySelectorAll('.zukan-tab').forEach(t =>
    t.addEventListener('click', () => renderZukan(t.dataset.tab)));

  // 英会話練習メインボタン
  $('btn-english-main').onclick = () => {
    startEnglishPractice(() => renderWorldMap());
  };

  // 英会話モード
  $('btn-conv-mode').onclick = showConvSelect;
  $('btn-conv-select-close').onclick = () => hideOverlay('conv-select');
  $('btn-conv-back').onclick = () => {
    hideOverlay('conversation');
    showConvSelect();
  };

  // ミニゲームメニュー
  $('btn-minigame').onclick = () => {
    showOverlay('minigame');
    $('mg-title').textContent = 'ゲームを えらんでね';
    $('mg-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;padding:8px 0">
        <button id="btn-mg-shadow"  class="big-btn">🌑 かげあてゲーム</button>
        <button id="btn-mg-wordpop" class="big-btn">💥 たんごポップ</button>
      </div>`;
    $('mg-score-display').textContent = '';
    $('btn-mg-shadow').onclick  = () => startMiniGame('shadow');
    $('btn-mg-wordpop').onclick = () => startMiniGame('wordpop');
  };
  $('btn-mg-close').onclick = () => hideOverlay('minigame');

  // タイトルへ（ワールドマップから）
  $('btn-to-title').onclick = renderTitle;

  // エンディング→タイトル
  $('btn-ending-back').onclick = renderTitle;
}

// ─── 初期化 ───
window.addEventListener('DOMContentLoaded', () => {
  loadAllSlots();
  initEvents();
  renderTitle();
});
