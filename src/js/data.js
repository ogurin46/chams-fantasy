'use strict';

// ─────────────── ヒーローステータス成長 ───────────────
function getHeroStats(lv) {
  return { maxHp: 50 + lv * 12, maxMp: 20 + lv * 7, expToNext: lv * 16 + 8 };
}

// ─────────────── 魔法データ ───────────────
const MAGIC_DATA = [
  { id:"hikari",   name:"ひかりだま",    minLv:1,  mp:3,  power:14, emoji:"✨", desc:"ひかりのたまを なげつける" },
  { id:"honoo",    name:"ほのおだま",    minLv:3,  mp:6,  power:26, emoji:"🔥", desc:"もえる ほのおで こうげき" },
  { id:"koori",    name:"こおりのやいば",minLv:5,  mp:9,  power:38, emoji:"❄️", desc:"するどい こおりで きりつける" },
  { id:"kaminari", name:"かみなり",      minLv:7,  mp:13, power:54, emoji:"⚡", desc:"そらから かみなりを おとす" },
  { id:"kotodama", name:"ことだまほう",  minLv:10, mp:22, power:85, emoji:"🌟", desc:"ことばの ちからで だいこうげき！" },
];

// ─────────────── こびと進化データ ───────────────
const KOBITO_EVO = {
  riku: [
    { minPt:0,  form:1, name:"リク",        title:"ゆうかんな こびと",     atkBonus:0  },
    { minPt:30, form:2, name:"リク・ソード",  title:"けんを もつ こびと",    atkBonus:12 },
    { minPt:70, form:3, name:"リク・ナイト", title:"まぼろしの きしどう",   atkBonus:28 },
  ],
  paku: [
    { minPt:0,  form:1, name:"パク",          title:"げんきな こびと",       atkBonus:0  },
    { minPt:30, form:2, name:"パク・マジック",  title:"まほうを おぼえた こびと", atkBonus:12 },
    { minPt:70, form:3, name:"パク・ウィザード",title:"でんせつの まどうし",   atkBonus:28 },
  ],
  mimi: [
    { minPt:0,  form:1, name:"ミミ",          title:"やさしい こびと",       atkBonus:0  },
    { minPt:30, form:2, name:"ミミ・フェアリー",title:"つばさを もつ こびと",  atkBonus:12 },
    { minPt:70, form:3, name:"ミミ・セイント", title:"せいじゃの こびと",     atkBonus:28 },
  ],
};

function getKobitoEvo(kobitKey, pt) {
  const list = KOBITO_EVO[kobitKey];
  return list.reduce((best, e) => pt >= e.minPt ? e : best, list[0]);
}

function getKobitoAtk(kobitKey, pt) {
  const base = { riku:14, paku:12, mimi:10 }[kobitKey] ?? 12;
  return base + getKobitoEvo(kobitKey, pt).atkBonus + Math.floor(pt / 8);
}

function getAvailableMagic(heroLv) {
  return MAGIC_DATA.filter(m => m.minLv <= heroLv);
}

// ─────────────── エリアデータ ───────────────
const AREA_DATA = [
  {
    id:"mori",  name:"もりのはじまり", emoji:"🌲", bgClass:"bg-mori", unlockLv:1,
    enemies:["slime","mushroom","leafBug"], boss:"darkSlime", stagesTotal:4,
    intro:["むかし、ことだまの もりは しずかで おだやかでした。","ある日、やみのちからが あふれ、もりの いきものたちが どうかしてしまいました……","さあ、ぼうけんへ でかけよう！"],
    bossIntro:"もりの おくに、やみに そまった おおきなスライムが いた！",
    clear:"やったー！ もりに ひかりが もどってきた！ つぎは どうくつへ！",
  },
  {
    id:"cave",  name:"まよいのどうくつ", emoji:"🌑", bgClass:"bg-cave", unlockLv:4,
    enemies:["bat","spider","skeleton"], boss:"giantSpider", stagesTotal:4,
    intro:["もりを ぬけると、くらい どうくつが……","てきが ひそんでいる。きをつけろ！"],
    bossIntro:"どうくつの おくに、きょだいな クモが すを はっていた！",
    clear:"どうくつを ぬけた！ うみのまちが みえてきたぞ！",
  },
  {
    id:"umi",   name:"うみべのまち", emoji:"🌊", bgClass:"bg-umi", unlockLv:7,
    enemies:["crab","jellyfish","fishKnight"], boss:"seaKing", stagesTotal:4,
    intro:["うつくしい うみべのまちに たどりついた。","でも うみも やみに おかされている……まちのひとを たすけろ！"],
    bossIntro:"うみの そこから、うみおうが あらわれた！",
    clear:"うみおうを たおした！ つぎは そらのしろへ！",
  },
  {
    id:"sora",  name:"そらのしろ", emoji:"☁️", bgClass:"bg-sora", unlockLv:10,
    enemies:["stormBird","darkCloud","shadowKnight"], boss:"darkLord", stagesTotal:4,
    intro:["そらに うかぶ しろ。ここに やみのぬしが いる。","これが さいごの たたかいだ！ ことばのちからで やみをはらえ！"],
    bossIntro:"やみのぬしが あらわれた！ すべての やみの もと！",
    clear:"🎊 やったー！ やみのぬしを たおした！\nことだまのもりに ひかりが もどった！！",
  },
];

// ─────────────── 敵データ ───────────────
// Lv2でやっと倒せる設計。英会話でLvを上げないと進めない。
const ENEMY_DATA = {
  // ── もりのはじまり（Lv2-4推奨）──
  slime:       { name:"スライム",      hp:75,  atk:16, def:4,  exp:12, emoji:"🟢", desc:"みどりの ぷるぷるスライム。よわいが なかまを よぶ。" },
  mushroom:    { name:"キノコおに",    hp:100, atk:20, def:5,  exp:15, emoji:"🍄", desc:"あたまにきのこが はえた てき。あたまをふると むしをはなつ。" },
  leafBug:     { name:"はっぱむし",    hp:80,  atk:22, def:3,  exp:13, emoji:"🐛", desc:"はっぱに かくれる はやいむし。みつけにくい。" },
  darkSlime:   { name:"やみのスライム",hp:160, atk:20, def:7,  exp:40, emoji:"⬛", desc:"やみにそまった おおきなスライム。もりのボス。", boss:true },

  // ── まよいのどうくつ（Lv5-6推奨）──
  bat:         { name:"コウモリ",      hp:115, atk:24, def:5,  exp:20, emoji:"🦇", desc:"どうくつの コウモリ。たかいところから おそってくる。" },
  spider:      { name:"クモ",          hp:135, atk:26, def:7,  exp:24, emoji:"🕷️", desc:"くものすで てきを まつ。ねっとりした いとが じゃま。" },
  skeleton:    { name:"ガイコツ",      hp:155, atk:22, def:9,  exp:27, emoji:"💀", desc:"どうくつに のこった ほねのせんし。かなしいめをしている。" },
  giantSpider: { name:"きょだいクモ",  hp:360, atk:38, def:13, exp:70, emoji:"🕸️", desc:"どうくつぜんたいに すをはった でかいクモ。どうくつのボス。", boss:true },

  // ── うみべのまち（Lv7-8推奨）──
  crab:        { name:"カニぞく",      hp:150, atk:30, def:10, exp:32, emoji:"🦀", desc:"はさみで きりつける かいぞくカニ。かたいこうらが じゃま。" },
  jellyfish:   { name:"クラゲ",        hp:130, atk:32, def:6,  exp:30, emoji:"🪼", desc:"ひかるクラゲ。さわると しびれる。ふわふわうごく。" },
  fishKnight:  { name:"さかなのへいし",hp:170, atk:28, def:9,  exp:36, emoji:"🐟", desc:"さかなのかぶとの へいし。うみおうの てしたたち。" },
  seaKing:     { name:"うみおう",      hp:460, atk:50, def:16, exp:95, emoji:"🔱", desc:"うみをしはいする おう。やみにおかされ てきになった。", boss:true },

  // ── そらのしろ（Lv9-10推奨）──
  stormBird:     { name:"あらしのとり",  hp:190, atk:40, def:8,  exp:42, emoji:"🦅", desc:"かみなりをあやつる とり。そらからおそってくる。" },
  darkCloud:     { name:"やみのくも",    hp:210, atk:44, def:12, exp:46, emoji:"⛈️", desc:"やみにそまったくも。なかにのりこんでこうげきする。" },
  shadowKnight:  { name:"かげのきし",    hp:230, atk:48, def:15, exp:50, emoji:"🗡️", desc:"やみのぬしのてしたで いちばんつよいきし。" },
  darkLord:      { name:"やみのぬし",    hp:620, atk:65, def:20, exp:0,  emoji:"👑", desc:"すべてのやみのもと。たおせばことだまのもりにひかりがもどる。", boss:true },
};

// ─────────────── 英会話フレーズ ───────────────
const ENGLISH_PHRASES = [
  { lv:1, says:"Hello!",          prompt:"なんて こたえる？",         choices:["Hello!","Goodbye!","Thank you!"],    best:"Hello!",         reaction:"Hello! Great!" },
  { lv:1, says:"How are you?",    prompt:"きもちを えいごで！",       choices:["I'm happy!","I'm fine!","I'm sleepy!"], best:null,          reaction:"I'm glad to hear that!" },
  { lv:1, says:"Good morning!",   prompt:"あさの あいさつは？",       choices:["Good morning!","Good night!","Goodbye!"], best:"Good morning!",  reaction:"Good morning! Rise and shine!" },
  { lv:1, says:"Thank you!",      prompt:"ありがとうって えいごで？",  choices:["Thank you!","I'm sorry!","Please!"],  best:"Thank you!",     reaction:"You're welcome!" },
  { lv:1, says:"Goodbye!",        prompt:"わかれる ときは？",         choices:["Goodbye!","Hello!","Thank you!"],     best:"Goodbye!",       reaction:"See you later!" },
  { lv:1, says:"Good night!",     prompt:"ねるまえの あいさつは？",   choices:["Good night!","Good morning!","Hello!"],best:"Good night!",    reaction:"Sweet dreams!" },
  { lv:3, says:"What's your name?",prompt:"なまえを きかれたら？",    choices:["My name is...","I'm fine!","How are you?"], best:"My name is...", reaction:"Nice to meet you!" },
  { lv:3, says:"How old are you?", prompt:"としを きかれたら？",      choices:["I'm 7 years old!","I'm happy!","Yes please!"], best:"I'm 7 years old!", reaction:"Wonderful!" },
  { lv:3, says:"Do you like cats?",prompt:"ねこが すきか きかれたら？",choices:["Yes, I do!","No, I don't!","I'm fine!"], best:null,          reaction:"Cats are so cute!" },
  { lv:3, says:"What do you like?",prompt:"すきなものを えいごで！",  choices:["I like soccer!","I like apples!","I like music!"], best:null, reaction:"That's cool!" },
  { lv:5, says:"Can I help you?",  prompt:"なんて こたえる？",        choices:["Yes please!","I'm fine, thank you.","No thank you."], best:null, reaction:"Great response!" },
  { lv:5, says:"What time is it?", prompt:"じかんを きかれたら？",    choices:["It's three o'clock!","I'm sleepy!","Goodbye!"], best:"It's three o'clock!", reaction:"Thank you!" },
  { lv:5, says:"Where is the park?",prompt:"こうえんの ばしょは？",   choices:["Turn left!","I'm hungry!","Yes please!"], best:"Turn left!",  reaction:"Arigatou! Thank you!" },
  { lv:7, says:"Excuse me, where is the station?",prompt:"えきを きかれたら？",choices:["Go straight ahead!","I like trains!","It's sunny!"], best:"Go straight ahead!", reaction:"Thank you so much!" },
  { lv:7, says:"How much is this?", prompt:"ねだんを きかれたら？",   choices:["It's 100 yen!","I'm fine!","Turn right!"], best:"It's 100 yen!", reaction:"What a great price!" },
  { lv:10,says:"I'm lost. Can you help me?",prompt:"まいごに なったひとに？",choices:["Of course! Follow me!","I'm sorry.","Turn left."], best:"Of course! Follow me!", reaction:"You're so kind!" },
];

function getPhrasesForLevel(heroLv, count = 3) {
  const pool = ENGLISH_PHRASES.filter(p => p.lv <= Math.max(1, heroLv));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

// ─────────────── ミニゲームデータ ───────────────
const MG_SHADOW = [
  { emoji:"🐱", word:"cat",    choices:["cat","dog","bird"],   hint:"ニャーと なく どうぶつ" },
  { emoji:"🐶", word:"dog",    choices:["dog","cat","fish"],   hint:"ワンワン なく どうぶつ" },
  { emoji:"🍎", word:"apple",  choices:["apple","banana","grape"], hint:"あかい くだもの" },
  { emoji:"🌟", word:"star",   choices:["star","moon","sun"],  hint:"よぞらに かがやく" },
  { emoji:"🏠", word:"house",  choices:["house","tree","car"], hint:"みんながくらす ばしょ" },
  { emoji:"🌸", word:"flower", choices:["flower","tree","grass"], hint:"きれいな はな" },
  { emoji:"🚗", word:"car",    choices:["car","train","bus"],  hint:"どうろを はしる のりもの" },
  { emoji:"📚", word:"book",   choices:["book","pen","bag"],   hint:"よんで まなぶ もの" },
];

const MG_WORDPOP = [
  { jp:"いぬ",   en:"dog",    c:["dog","cat","bird"] },
  { jp:"ねこ",   en:"cat",    c:["cat","dog","fish"] },
  { jp:"さかな", en:"fish",   c:["fish","bird","cat"] },
  { jp:"りんご", en:"apple",  c:["apple","banana","grape"] },
  { jp:"みず",   en:"water",  c:["water","juice","milk"] },
  { jp:"そら",   en:"sky",    c:["sky","sea","mountain"] },
  { jp:"はな",   en:"flower", c:["flower","tree","grass"] },
  { jp:"くるま", en:"car",    c:["car","bus","train"] },
  { jp:"ほん",   en:"book",   c:["book","pen","bag"] },
  { jp:"たいよう",en:"sun",   c:["sun","moon","star"] },
];

// ─────────────── 英会話モード会話データ ───────────────
const CONVERSATION_DATA = [
  {
    id:'morning', title:'あさのあいさつ', emoji:'☀️', minLv:1,
    turns:[
      { who:'k', text:'Good morning!', tts:'Good morning!' },
      { who:'p', prompt:'あいさつを かえそう！', choices:['Good morning!','Good evening!','Good night!'], best:'Good morning!', reaction:'Good morning! Rise and shine!' },
      { who:'k', text:'How are you today?', tts:'How are you today?' },
      { who:'p', prompt:'きもちを こたえよう！', choices:["I'm fine, thank you!","I'm a little sleepy.","I'm very happy!"], best:null, reaction:"That's wonderful!" },
      { who:'k', text:'Have a great day!', tts:'Have a great day!' },
      { who:'p', prompt:'おわりの あいさつは？', choices:['You too! Bye!','Good morning!','I\'m fine!'], best:'You too! Bye!', reaction:'See you! Bye bye!' },
    ]
  },
  {
    id:'intro', title:'はじめまして', emoji:'👋', minLv:1,
    turns:[
      { who:'k', text:"Hi there! What's your name?", tts:"Hi there! What's your name?" },
      { who:'p', prompt:'なまえを こたえよう！', choices:["My name is Taro!","I'm happy!","Nice to meet you!"], best:"My name is Taro!", reaction:'Nice to meet you!' },
      { who:'k', text:'How old are you?', tts:'How old are you?' },
      { who:'p', prompt:'としを こたえよう！', choices:["I'm seven years old!","I'm very old!","I'm three."], best:null, reaction:"Wow, that's cool!" },
      { who:'k', text:'Do you like playing games?', tts:'Do you like playing games?' },
      { who:'p', prompt:'こたえよう！', choices:['Yes! I love games!','No, I\'m tired.','Sometimes.'], best:'Yes! I love games!', reaction:"Me too! Let's play together!" },
    ]
  },
  {
    id:'food', title:'すきなたべもの', emoji:'🍎', minLv:2,
    turns:[
      { who:'k', text:'Are you hungry?', tts:'Are you hungry?' },
      { who:'p', prompt:'おなかは すいてる？', choices:["Yes, I'm hungry!","No, I'm full.","A little bit."], best:null, reaction:"Let's eat something yummy!" },
      { who:'k', text:"What's your favorite food?", tts:"What's your favorite food?" },
      { who:'p', prompt:'すきなたべものは？', choices:['I love sushi!','I love pizza!','I love ramen!'], best:null, reaction:'That sounds so delicious!' },
      { who:'k', text:'What fruit do you like?', tts:'What fruit do you like?' },
      { who:'p', prompt:'すきなくだものは？', choices:['I like apples!','I like bananas!','I like strawberries!'], best:null, reaction:"Yummy! That's my favorite too!" },
    ]
  },
  {
    id:'hobbies', title:'しゅみのはなし', emoji:'🎨', minLv:3,
    turns:[
      { who:'k', text:'What do you like to do?', tts:'What do you like to do?' },
      { who:'p', prompt:'すきなことは？', choices:['I like drawing!','I like playing soccer!','I like reading books!'], best:null, reaction:'That sounds really fun!' },
      { who:'k', text:'Can you play any sports?', tts:'Can you play any sports?' },
      { who:'p', prompt:'スポーツはできる？', choices:['Yes! I can swim!','Yes! I play baseball!','Not yet, but I want to try!'], best:null, reaction:"Wow, that's amazing!" },
      { who:'k', text:'What do you do on weekends?', tts:'What do you do on weekends?' },
      { who:'p', prompt:'しゅうまつは なにしてる？', choices:['I go to the park!','I play video games!','I help my family!'], best:null, reaction:'That sounds like a wonderful weekend!' },
    ]
  },
  {
    id:'weather', title:'てんきのはなし', emoji:'⛅', minLv:4,
    turns:[
      { who:'k', text:"What's the weather like today?", tts:"What's the weather like today?" },
      { who:'p', prompt:'きょうのてんきは？', choices:["It's sunny and warm!","It's rainy today.","It's cloudy."], best:null, reaction:'I see! Thanks for telling me!' },
      { who:'k', text:'Do you have an umbrella?', tts:'Do you have an umbrella?' },
      { who:'p', prompt:'かさは もってる？', choices:['Yes, I have one!','No, I forgot it.','I don\'t need one today!'], best:null, reaction:'Good thinking!' },
      { who:'k', text:"What's your favorite season?", tts:"What's your favorite season?" },
      { who:'p', prompt:'すきなきせつは？', choices:['My favorite is summer!','I love spring!','I like winter best!'], best:null, reaction:"That's a great season! I love it too!" },
    ]
  },
  {
    id:'dream', title:'しょうらいのゆめ', emoji:'🌟', minLv:6,
    turns:[
      { who:'k', text:'What do you want to be in the future?', tts:'What do you want to be in the future?' },
      { who:'p', prompt:'しょうらいのゆめは？', choices:['I want to be a doctor!','I want to be a teacher!','I want to be an astronaut!'], best:null, reaction:"That's an incredible dream!" },
      { who:'k', text:'Why do you want that job?', tts:'Why do you want that job?' },
      { who:'p', prompt:'なぜそのしごとを？', choices:['Because I want to help people!','Because it\'s exciting!','Because I love learning!'], best:null, reaction:'What a wonderful reason!' },
      { who:'k', text:'I believe in you! You can do anything!', tts:'I believe in you! You can do anything!' },
      { who:'p', prompt:'ありがとうを いおう！', choices:["Thank you! I'll do my best!",'You\'re welcome!','That\'s nice!'], best:"Thank you! I'll do my best!", reaction:"Excellent! I'm cheering for you!" },
    ]
  },
];
