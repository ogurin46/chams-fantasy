'use strict';
// 使い方: node scripts/generate_heroine.js
// 主人公「魔法少女たんてい」の画像を生成（プリキュア風のオリジナルキャラ）

const fs   = require('fs');
const path = require('path');

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

const OUT_DIR = path.join(__dirname, '..', 'src', 'img');

const STYLE = ', bright cheerful anime style for young children, solid flat cel shading, ' +
  'thick crisp clean outlines, no smoke, no fog, plain pure white background, kawaii';

const CHARS = [
  {
    file: 'heroine.png', // 立ち絵
    prompt: 'cute magical girl detective heroine, long pink twin-tail hair with heart ribbons, ' +
      'big sparkling pink eyes, frilly pink and white magical girl dress with gold accents, ' +
      'small brown detective deerstalker hat, holding a golden magnifying glass, ' +
      'cheerful confident smile, full body standing pose front view' + STYLE,
  },
  {
    file: 'heroine_face.png', // 顔アイコン用
    prompt: 'cute magical girl detective heroine face portrait, long pink twin-tail hair with heart ribbons, ' +
      'big sparkling pink eyes, small brown detective deerstalker hat, ' +
      'cheerful big smile, bust up portrait centered' + STYLE,
  },
  {
    file: 'heroine_thinking.png', // 推理ポーズ
    prompt: 'cute magical girl detective heroine thinking pose, long pink twin-tail hair with heart ribbons, ' +
      'big sparkling pink eyes, frilly pink and white magical girl dress, ' +
      'small brown detective deerstalker hat, finger on chin thinking hard, sparkles of inspiration, ' +
      'full body front view' + STYLE,
  },
];

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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
  let data = await res.json();
  if (data.status === 'succeeded') return data.output;
  if (data.status === 'failed')    throw new Error(data.error || '生成失敗');
  const pollUrl = data.urls?.get;
  if (!pollUrl) throw new Error('ポーリングURL取得失敗');
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pr = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    data = await pr.json();
    if (data.status === 'succeeded') return data.output;
    if (data.status === 'failed')    throw new Error(data.error || '生成失敗');
  }
  throw new Error('タイムアウト');
}

async function getRembgVersion() {
  const res = await fetch('https://api.replicate.com/v1/models/cjwbw/rembg', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  if (!res.ok) return 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';
  const data = await res.json();
  return data.latest_version?.id
    || 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003';
}

async function main() {
  console.log(`🔑 APIキー: ${API_KEY.slice(0, 6)}...${API_KEY.slice(-4)}\n`);
  const rembgVersion = await getRembgVersion();

  for (let i = 0; i < CHARS.length; i++) {
    const c = CHARS[i];
    process.stdout.write(`[${i+1}/${CHARS.length}] ${c.file.padEnd(22)} 生成中... `);
    try {
      const out1 = await waitForResult(await fetchWithRetry(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
        { method: 'POST', headers: HEADERS, body: JSON.stringify({ input: {
          prompt: c.prompt, num_outputs: 1, aspect_ratio: '1:1',
          output_format: 'png', output_quality: 100,
        } }) }
      ));
      const imageUrl = Array.isArray(out1) ? out1[0] : String(out1);

      const out2 = await waitForResult(await fetchWithRetry(
        'https://api.replicate.com/v1/predictions',
        { method: 'POST', headers: HEADERS, body: JSON.stringify({
          version: rembgVersion, input: { image: imageUrl }
        }) }
      ));
      const bgUrl = Array.isArray(out2) ? out2[0] : String(out2);

      const res = await fetch(bgUrl);
      if (!res.ok) throw new Error(`DL失敗: ${res.status}`);
      fs.writeFileSync(path.join(OUT_DIR, c.file), Buffer.from(await res.arrayBuffer()));
      console.log('✅');
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
    if (i < CHARS.length - 1) await new Promise(r => setTimeout(r, 13000));
  }
  console.log('\n🎉 主人公画像 生成完了！');
}

main().catch(e => { console.error('致命的エラー:', e.message); process.exit(1); });
