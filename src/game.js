'use strict';

// ─────────────── キャラクターデータ ───────────────
const KOBITO = {
  riku: { name: "リク", line: "ぼくと いっしょに がんばろう！" },
  paku: { name: "パク", line: "げんきいっぱい いくよー！" },
  mimi: { name: "ミミ", line: "いっしょに れんしゅう しようね♪" },
};

// ─────────────── Lv1 フレーズデータ（あいさつ） ───────────────
// bestAnswer: null のとき全選択肢が正解扱い（気持ちを表すフレーズなど）
const PHRASES = [
  {
    companionSays: "Hello!",
    prompt: "なんて こたえる？",
    choices: ["Hello!", "Goodbye!", "Thank you!"],
    bestAnswer: "Hello!",
    reaction: "やったー！いっしょに あいさつ できたね！"
  },
  {
    companionSays: "How are you?",
    prompt: "いまの きもちを えいごで おしえて！",
    choices: ["I'm happy!", "I'm fine!", "I'm sleepy!"],
    bestAnswer: null,
    reaction: "きもちを おしえてくれて ありがとう！"
  },
  {
    companionSays: "Good morning!",
    prompt: "あさの あいさつ は なんて いう？",
    choices: ["Good morning!", "Good night!", "Goodbye!"],
    bestAnswer: "Good morning!",
    reaction: "Good morning！ じょうず に いえたね！"
  },
  {
    companionSays: "Good night!",
    prompt: "ねる まえの あいさつ は？",
    choices: ["Good night!", "Good morning!", "Hello!"],
    bestAnswer: "Good night!",
    reaction: "おやすみなさい！ よく できたよ！"
  },
  {
    companionSays: "Goodbye!",
    prompt: "わかれる とき は なんて いう？",
    choices: ["Goodbye!", "Hello!", "Thank you!"],
    bestAnswer: "Goodbye!",
    reaction: "バイバイ！ また あとで ね！"
  },
  {
    companionSays: "Thank you!",
    prompt: "「ありがとう」って えいごで？",
    choices: ["Thank you!", "I'm sorry!", "Please!"],
    bestAnswer: "Thank you!",
    reaction: "どういたしまして！ えいごが うまい！"
  },
];

// ─────────────── DOM参照 ───────────────
const $ = id => document.getElementById(id);
const screens = {
  title:     $("screen-title"),
  character: $("screen-character"),
  game:      $("screen-game"),
};

// ─────────────── ゲーム状態 ───────────────
const state = {
  selectedKey: null,  // "riku" | "paku" | "mimi"
  points: 0,
  maxPoints: 10,
  level: 1,
  phraseIndex: 0,
  phase: "idle", // idle | speaking | responding | feedback | levelup
};

// ─────────────── 小人画像セット ───────────────
function setCompanionImg(imgElId) {
  const el = $(imgElId);
  if (el) el.src = `img/${state.selectedKey}.png`;
}

// ─────────────── キャラクター別ボイスプロファイル ───────────────
// pitch: 声の高さ (0.5〜2.0)  rate: 話すスピード (0.5〜1.5)
// preferFemale: 女性音声を優先するか
const VOICE_PROFILE = {
  riku: { pitch: 1.2,  rate: 0.88, preferFemale: false }, // 元気な少年
  paku: { pitch: 0.72, rate: 0.80, preferFemale: false }, // 低くてどっしり
  mimi: { pitch: 1.55, rate: 0.92, preferFemale: true  }, // かわいい少女
};

// 利用可能なボイスをキャッシュ
let cachedVoices = [];
function loadVoices() {
  cachedVoices = speechSynthesis.getVoices();
}
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
loadVoices();

// 男女・言語でボイスを選ぶ
function pickVoice(lang, preferFemale) {
  const voices = cachedVoices.length ? cachedVoices : speechSynthesis.getVoices();
  const candidates = voices.filter(v => v.lang.startsWith(lang));
  if (!candidates.length) return null;

  // 女性らしい名前のキーワード
  const femaleHints = ['female', 'zira', 'victoria', 'karen', 'samantha', 'google uk english female', 'fiona', 'moira', 'veena', 'tessa'];
  const maleHints   = ['male', 'david', 'mark', 'daniel', 'alex', 'google uk english male', 'lee', 'rishi'];

  const hints = preferFemale ? femaleHints : maleHints;
  const matched = candidates.find(v =>
    hints.some(h => v.name.toLowerCase().includes(h))
  );
  // マッチしなければ先頭（ブラウザデフォルト）
  return matched || candidates[0];
}

// ─────────────── TTS（相棒がしゃべる） ───────────────
function speak(text, lang = "en-US", onEnd = null) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;

  // キャラ選択済みなら個別プロファイルを適用
  const profile = state.selectedKey ? VOICE_PROFILE[state.selectedKey] : null;
  utt.pitch = profile ? profile.pitch : 1.1;
  utt.rate  = profile ? profile.rate  : 0.85;

  // 英語発話のときだけボイスを切り替える（日本語リアクションはデフォルトのまま）
  if (lang === "en-US" && profile) {
    const voice = pickVoice("en", profile.preferFemale);
    if (voice) utt.voice = voice;
  }

  let ended = false;
  const done = () => { if (!ended) { ended = true; onEnd?.(); } };
  utt.onend = done;
  setTimeout(done, text.length * 130 + 1200);
  speechSynthesis.speak(utt);
}

// ─────────────── STT（子どもがしゃべる） ───────────────
let recognition = null;

function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
}

// ─────────────── ポイント管理 ───────────────
function addPoints(pts) {
  state.points += pts;
  if (state.points >= state.maxPoints) {
    state.points -= state.maxPoints;
    state.level++;
    updateHUD();
    showLevelUp();
  } else {
    updateHUD();
  }
}

function updateHUD() {
  const pct = (state.points / state.maxPoints) * 100;
  $("pt-bar").style.width = pct + "%";
  $("pt-num").textContent = state.points;
}

// ─────────────── グロウ演出 ───────────────
function glowBuddy(size = "normal") {
  const wrap = $("companion-wrap");
  wrap.classList.remove("glow-normal", "glow-big");
  void wrap.offsetWidth;
  wrap.classList.add(size === "big" ? "glow-big" : "glow-normal");
  setTimeout(() => wrap.classList.remove("glow-normal", "glow-big"),
    size === "big" ? 1400 : 1200);
}

// ─────────────── トースト ───────────────
let toastTimer = null;

function showToast(icon, msg) {
  const el = $("feedback-toast");
  $("feedback-icon").textContent = icon;
  $("feedback-msg").textContent = msg;
  el.classList.remove("hidden", "toast-out");
  el.classList.add("toast-in");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.replace("toast-in", "toast-out");
    setTimeout(() => el.classList.add("hidden"), 380);
  }, 1800);
}

// ─────────────── ゲームフロー ───────────────
function startPhrase() {
  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  state.phase = "speaking";

  $("bubble-text").textContent = phrase.companionSays;
  $("speech-bubble").classList.remove("hidden");
  $("response-area").classList.add("dimmed");
  $("prompt-text").textContent = "";
  $("choices").innerHTML = "";
  $("btn-mic").classList.add("hidden");
  $("mic-hint").classList.add("hidden");

  setTimeout(() => {
    speak(phrase.companionSays, "en-US", () => {
      setTimeout(showChoices, 500);
    });
  }, 350);
}

function showChoices() {
  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  state.phase = "responding";

  $("response-area").classList.remove("dimmed");
  $("prompt-text").textContent = phrase.prompt;

  const choicesEl = $("choices");
  choicesEl.innerHTML = "";
  phrase.choices.forEach(text => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = text;
    btn.addEventListener("click", () => onChoiceTap(text, btn));
    choicesEl.appendChild(btn);
  });

  if (recognition) $("btn-mic").classList.remove("hidden");
}

function onChoiceTap(choice, btnEl) {
  if (state.phase !== "responding") return;
  state.phase = "feedback";

  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  const isBest = !phrase.bestAnswer || choice === phrase.bestAnswer;

  document.querySelectorAll(".choice-btn").forEach(b => {
    b.disabled = true;
    if (b === btnEl) b.classList.add(isBest ? "chosen-best" : "chosen");
  });

  glowBuddy("normal");
  addPoints(1);
  showToast("⭐", "+1 ことだまポイント！");

  setTimeout(() => {
    $("bubble-text").textContent = phrase.reaction;
    speak(phrase.reaction, "en-US", () => {});
    setTimeout(nextPhrase, 4200);
  }, 600);
}

function onMicSpoken() {
  if (state.phase !== "responding") return;
  state.phase = "feedback";

  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  $("mic-hint").classList.add("hidden");
  $("btn-mic").classList.remove("listening");
  document.querySelectorAll(".choice-btn").forEach(b => b.disabled = true);

  glowBuddy("big");
  addPoints(2);
  showToast("🎤✨", "+2 ことだまポイント！");

  setTimeout(() => {
    $("bubble-text").textContent = "わあ、いえたね！ " + phrase.reaction;
    speak(phrase.reaction, "en-US", () => {});
    setTimeout(nextPhrase, 4500);
  }, 600);
}

function nextPhrase() {
  if (state.phase === "levelup") return;
  state.phraseIndex++;
  startPhrase();
}

// ─────────────── レベルアップ ───────────────
function showLevelUp() {
  state.phase = "levelup";
  setCompanionImg("levelup-companion-img");
  $("overlay-levelup").classList.remove("hidden");
  glowBuddy("big");
}

// ─────────────── イベントリスナー ───────────────

// タイトル → キャラ選択
$("btn-start").addEventListener("click", () => {
  screens.title.classList.add("hidden");
  screens.character.classList.remove("hidden");
});

// キャラカード選択
document.querySelectorAll(".char-card").forEach(card => {
  card.addEventListener("click", () => {
    state.selectedKey = card.dataset.key;

    // 選択アニメ後にゲーム開始
    document.querySelectorAll(".char-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    setTimeout(() => {
      screens.character.classList.add("hidden");
      screens.game.classList.remove("hidden");
      setCompanionImg("companion-img");
      initSpeechRecognition();
      updateHUD();
      startPhrase();
    }, 400);
  });
});

// ゲーム → キャラ選択に戻る
$("btn-back").addEventListener("click", () => {
  speechSynthesis.cancel();
  if (recognition) try { recognition.stop(); } catch (e) {}
  state.phase = "idle";
  state.points = 0;
  state.phraseIndex = 0;
  updateHUD();
  $("speech-bubble").classList.add("hidden");
  screens.game.classList.add("hidden");
  screens.character.classList.remove("hidden");
  document.querySelectorAll(".char-card").forEach(c => c.classList.remove("selected"));
});

// 吹き出しのリプレイ
$("btn-replay").addEventListener("click", () => {
  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  speak(phrase.companionSays, "en-US");
});

// マイクボタン
$("btn-mic").addEventListener("click", () => {
  if (!recognition || state.phase !== "responding") return;

  $("mic-hint").classList.remove("hidden");
  $("btn-mic").classList.add("listening");

  recognition.onresult = () => {
    $("btn-mic").classList.remove("listening");
    onMicSpoken();
  };

  recognition.onerror = () => {
    $("btn-mic").classList.remove("listening");
    $("mic-hint").classList.add("hidden");
    if (state.phase !== "feedback") state.phase = "responding";
  };

  recognition.onend = () => {
    $("btn-mic").classList.remove("listening");
  };

  try { recognition.start(); } catch (e) { /* already started */ }
});

// レベルアップ → 次へ
$("btn-levelup-ok").addEventListener("click", () => {
  $("overlay-levelup").classList.add("hidden");
  state.phase = "idle";
  nextPhrase();
});
