'use strict';
// 使い方: node scripts/generate_story_voices.js
// ストーリー文章（プロローグ＋各事件のイントロ/解決）の音声を
// MiniMax speech-02-turbo で生成する（電子音のTTSの代わりに人の声で読み上げ）。
// data.js を読み込んで文章リストを自動生成するので、文章を変えたら再実行するだけ。
// 既に存在するファイルはスキップされる。

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.trim().match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}
loadEnv(path.join(__dirname, '..', '.env'));

const API_KEY = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
if (!API_KEY) { console.error('❌ .env に REPLICATE_API_TOKEN を設定'); process.exit(1); }

const OUT_DIR = path.join(__dirname, '..', 'src', 'audio', 'story');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// data.js から PROLOGUE / CASES を読み込む
// （const宣言はsandboxのプロパティにならないため、末尾で明示的に返す）
const sandbox = {};
vm.createContext(sandbox);
const dataCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'data.js'), 'utf8');
const { PROLOGUE, CASES } = vm.runInContext(dataCode + '\n;({ PROLOGUE, CASES })', sandbox);

const LINES = [];
PROLOGUE.forEach((t, i) => LINES.push({ file:`prologue_${i}.mp3`, text:t }));
CASES.forEach(c => {
  c.intro.forEach((t, i)   => LINES.push({ file:`${c.id}_intro_${i}.mp3`,   text:t }));
  c.resolve.forEach((t, i) => LINES.push({ file:`${c.id}_resolve_${i}.mp3`, text:t }));
});

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'wait=60',
};

async function fetchWithRetry(url, options, maxRetries = 6) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const wait = (i + 1) * 12000;
    process.stdout.write(`⏳${wait/1000}s… `);
    await new Promise(r => setTimeout(r, wait));
  }
  throw new Error('レート制限リトライ超過');
}

async function waitForResult(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
  let data = await res.json();
  if (data.status === 'succeeded') return data.output;
  if (data.status === 'failed')    throw new Error(data.error || '生成失敗');
  const pollUrl = data.urls?.get;
  if (!pollUrl) throw new Error('ポーリングURL取得失敗');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pr = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    data = await pr.json();
    if (data.status === 'succeeded') return data.output;
    if (data.status === 'failed')    throw new Error(data.error || '生成失敗');
  }
  throw new Error('タイムアウト');
}

async function main() {
  console.log(`🔑 APIキー: ${API_KEY.slice(0, 6)}...${API_KEY.slice(-4)}`);
  console.log(`📜 ${LINES.length} 行のストーリー音声を生成します\n`);

  for (let i = 0; i < LINES.length; i++) {
    const l = LINES[i];
    const outPath = path.join(OUT_DIR, l.file);
    if (fs.existsSync(outPath)) { console.log(`[${i+1}/${LINES.length}] ${l.file} スキップ（既存）`); continue; }
    process.stdout.write(`[${i+1}/${LINES.length}] ${l.file.padEnd(24)} `);
    try {
      const out = await waitForResult(await fetchWithRetry(
        'https://api.replicate.com/v1/models/minimax/speech-02-turbo/predictions',
        { method: 'POST', headers: HEADERS, body: JSON.stringify({
          input: { text: l.text, voice_id: 'Japanese_KindLady', speed: 1.0,
                   language_boost: 'Japanese', audio_format: 'mp3' }
        }) }
      ));
      const url = Array.isArray(out) ? out[0] : String(out);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DL失敗: ${res.status}`);
      fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
      console.log('✅');
    } catch (e) {
      console.log(`❌ ${String(e.message).slice(0, 80)}`);
    }
    if (i < LINES.length - 1) await new Promise(r => setTimeout(r, 13000));
  }
  console.log('\n🎉 ストーリー音声 生成完了！');
}

main().catch(e => { console.error('致命的エラー:', e.message); process.exit(1); });
