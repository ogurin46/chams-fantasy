'use strict';
// 使い方: node scripts/generate_animals.js
// ことばのもりの住人「かわいい動物たち」12体を生成（モンスターからの置き換え）

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
  'thick crisp clean outlines, big sparkling eyes, friendly smile, front view full body centered, ' +
  'no smoke, no fog, plain pure white background, kawaii';

const CHARS = [
  { file:'animal_rabbit.png',   prompt:'cute chibi white rabbit with long floppy ears, pink inner ears, small round body' + STYLE },
  { file:'animal_squirrel.png', prompt:'cute chibi brown squirrel with big fluffy tail, holding a tiny acorn' + STYLE },
  { file:'animal_bear.png',     prompt:'cute chibi brown bear cub, round belly, small round ears' + STYLE },
  { file:'animal_bird.png',     prompt:'cute chibi small yellow bird, round fluffy body, tiny wings' + STYLE },
  { file:'animal_fox.png',      prompt:'cute chibi orange fox with fluffy tail with white tip, pointed ears' + STYLE },
  { file:'animal_owl.png',      prompt:'cute chibi owl professor with round glasses, brown feathers, wise look' + STYLE },
  { file:'animal_penguin.png',  prompt:'cute chibi baby penguin, black and white, tiny flippers' + STYLE },
  { file:'animal_dolphin.png',  prompt:'cute chibi light blue dolphin with pink ribbon on head, jumping pose' + STYLE },
  { file:'animal_turtle.png',   prompt:'cute chibi old sea turtle grandpa with green shell, white beard, gentle eyes' + STYLE },
  { file:'animal_cat.png',      prompt:'cute chibi calico cat, orange and white fur, big round eyes' + STYLE },
  { file:'animal_dog.png',      prompt:'cute chibi beige puppy dog, floppy ears, wagging tail' + STYLE },
  { file:'animal_panda.png',    prompt:'cute chibi baby panda, black and white, round body, sitting' + STYLE },
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
  console.log('\n🎉 どうぶつたち 生成完了！');
}

main().catch(e => { console.error('致命的エラー:', e.message); process.exit(1); });
