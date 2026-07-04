'use strict';
// ═══════════════════════════════════════════════════════════
// めいたんてい チャムズ 〜えいごじけんぼ〜  ゲームデータ
// ═══════════════════════════════════════════════════════════

// ─── チャムズ（3人とも捜査に同行する） ───
const CHAMS = {
  riku: { name:'リク', img:'img/riku.png', color:'#e74c3c', voice:{ pitch:1.2,  rate:0.9,  female:false } },
  paku: { name:'パク', img:'img/paku.png', color:'#f1c40f', voice:{ pitch:0.72, rate:0.82, female:false } },
  mimi: { name:'ミミ', img:'img/mimi.png', color:'#f78fb3', voice:{ pitch:1.5,  rate:0.95, female:true  } },
};
const CHAM_KEYS = ['riku', 'paku', 'mimi'];

// ─── ことばのもりの住人たち（旧モンスター画像を再利用） ───
const RESIDENTS = {
  slime:       { name:'スライムくん',     img:'img/enemy_slime.png',        emoji:'🟢' },
  mushroom:    { name:'キノコさん',       img:'img/enemy_mushroom.png',     emoji:'🍄' },
  leafBug:     { name:'はっぱちゃん',     img:'img/enemy_leafBug.png',      emoji:'🐛' },
  bat:         { name:'コウモリくん',     img:'img/enemy_bat.png',          emoji:'🦇' },
  spider:      { name:'クモちゃん',       img:'img/enemy_spider.png',       emoji:'🕷️' },
  skeleton:    { name:'ガイコツさん',     img:'img/enemy_skeleton.png',     emoji:'💀' },
  crab:        { name:'カニさん',         img:'img/enemy_crab.png',         emoji:'🦀' },
  jellyfish:   { name:'クラゲちゃん',     img:'img/enemy_jellyfish.png',    emoji:'🪼' },
  fishKnight:  { name:'さかなのきし',     img:'img/enemy_fishKnight.png',   emoji:'🐟' },
  stormBird:   { name:'とりさん',         img:'img/enemy_stormBird.png',    emoji:'🦅' },
  darkCloud:   { name:'くもくん',         img:'img/enemy_darkCloud.png',    emoji:'☁️' },
  giantSpider: { name:'クモのおかあさん', img:'img/enemy_giantSpider.png',  emoji:'🕸️' },
  seaKing:     { name:'うみのおうさま',   img:'img/enemy_seaKing.png',      emoji:'🔱' },
  shadowKnight:{ name:'よろいのきし',     img:'img/enemy_shadowKnight.png', emoji:'🗡️' },
  bigSlime:    { name:'おおきなスライム', img:'img/enemy_darkSlime.png',    emoji:'⬛' },
};

// ─── 探偵ランク（解決した事件の数で上がる） ───
const RANKS = [
  { need:0, name:'みならい たんてい',       icon:'🔰' },
  { need:1, name:'ちいさな たんてい',       icon:'🕵️' },
  { need:2, name:'いっぱしの たんてい',     icon:'⭐' },
  { need:4, name:'すごうでの たんてい',     icon:'🌟' },
  { need:6, name:'でんせつの めいたんてい', icon:'👑' },
];
function getRank(solvedCount) {
  return RANKS.reduce((best, r) => solvedCount >= r.need ? r : best, RANKS[0]);
}

// ─── オープニング（はじめてプレイするとき） ───
const PROLOGUE = [
  'ある日、まほうしょうじょの めいたんていは、ふしぎな ひかりに つつまれた…！',
  'きがつくと、そこは 「ことばのもり」。こびとの チャムズたちが すむ せかい！',
  'リク「たすけて めいたんてい！ このもりでは こまった じけんが いっぱい おきてるんだ！」',
  'パク「このせかいの みんなは えいごで おはなしするよ。ぼくたちが てつだうね！」',
  'ミミ「でもね、わたしたち、えいごを まちがえちゃうことも あるの…」',
  'だから きみの でばん！ ただしい えいごを いっている チャムズを みぬいて、じけんを かいけつしよう！',
];

// ═══════════════════════════════════════════════════════════
// 事件データ
//   step.type 'ask'    = なんて いえばいい？（チャムズが英語を提案 → 正しい英語を選ぶ）
//   step.type 'listen' = なんて いってた？（住人の英語を聞いて → 正しい意味を選ぶ）
//   options は実行時にチャムズ3人へランダムに割り当てられる
// ═══════════════════════════════════════════════════════════
const CASES = [

  // ─────────── 事件1 ───────────
  {
    id:'honey', title:'きえた はちみつ', emoji:'🍯', diff:1,
    client:'mushroom',
    intro:[
      'たいへん たいへん！ キノコさんが かけこんできた！',
      'キノコさん「たいせつな はちみつが きえちゃったの！ めいたんてい、さがして！」',
      'よし、ききこみ かいし！ もりの みんなに はなしを きこう！',
    ],
    steps:[
      {
        type:'ask', witness:'slime',
        scene:'まずは スライムくんに あいさつしよう！',
        question:'「こんにちは」って えいごで なんて いう？',
        options:[
          { text:'Hello!',      ok:true  },
          { text:'Good night!', ok:false },
          { text:'Banana!',     ok:false },
        ],
        reply:{ en:'Hello! I saw someone big... It had black wings!', jp:'こんにちは！おおきな だれかを みたよ…くろい つばさが あったんだ！' },
        clue:{ icon:'🖤', jp:'はんにんには くろい つばさが ある' },
      },
      {
        type:'listen', witness:'bat',
        scene:'コウモリくんに はなしを きこう。よーく きいてね！',
        witnessSays:{ en:'I like honey very much!', jp:null },
        question:'コウモリくんは なんて いった？',
        options:[
          { text:'「はちみつが だいすき」って いった', ok:true  },
          { text:'「はちみつは きらい」って いった',   ok:false },
          { text:'「りんごが すき」って いった',       ok:false },
        ],
        reply:{ en:'Yes! Honey is yummy!', jp:'そうだよ！はちみつは おいしいよね！' },
        clue:{ icon:'🍯', jp:'コウモリくんは はちみつが だいすき' },
      },
      {
        type:'ask', witness:'stormBird',
        scene:'そらの うえから みていた とりさんが きた！おれいを いってから きこう。「ありがとう」は？',
        question:'「ありがとう」って えいごで なんて いう？',
        options:[
          { text:'Thank you!', ok:true  },
          { text:"I'm sorry!", ok:false },
          { text:'Dog!',       ok:false },
        ],
        reply:{ en:'You\'re welcome! I saw the bat fly to the honey house at night!', jp:'どういたしまして！よるに コウモリくんが はちみつのいえに とんでいくのを みたよ！' },
        clue:{ icon:'🌙', jp:'よる、コウモリくんが はちみつのいえへ とんでいった' },
      },
    ],
    deduce:{
      question:'てがかりが そろった！ はちみつを たべたのは… だれだ！？',
      suspects:[
        { res:'bat',   ok:true  },
        { res:'crab',  ok:false },
        { res:'slime', ok:false },
      ],
      hint:'くろい つばさ… はちみつが だいすき… よるに とんでいった…',
    },
    resolve:[
      'コウモリくん「I\'m sorry... とっても おなかが すいてたんだ…」',
      'キノコさん「そうだったのね。じゃあ こんどからは いっしょに たべましょ！」',
      'みんなで はちみつを わけっこ して なかなおり！ めでたし めでたし！',
    ],
  },

  // ─────────── 事件2 ───────────
  {
    id:'jelly', title:'まいごの クラゲちゃん', emoji:'🪼', diff:1,
    client:'seaKing',
    intro:[
      'うみのおうさまが しんぱいそうに やってきた。',
      'うみのおうさま「クラゲちゃんが まいごに なってしまった！ さがしてくれ！」',
      'クラゲちゃんは どこに いるんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'crab',
        scene:'カニさんに クラゲちゃんの ばしょを きこう！',
        question:'「クラゲちゃんは どこ？」って えいごで なんて きく？',
        options:[
          { text:'Where is Jelly?',   ok:true  },
          { text:'What time is it?',  ok:false },
          { text:"I'm hungry!",       ok:false },
        ],
        reply:{ en:'I saw her near the big rock!', jp:'おおきな いわの ちかくで みたよ！' },
        clue:{ icon:'🪨', jp:'おおきな いわの ちかくに いる' },
      },
      {
        type:'listen', witness:'fishKnight',
        scene:'さかなのきしも なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'She has a pink ribbon!', jp:null },
        question:'さかなのきしは なんて いった？',
        options:[
          { text:'「ピンクの リボンを つけてる」って いった', ok:true  },
          { text:'「あおい ぼうしを かぶってる」って いった', ok:false },
          { text:'「おなかが すいた」って いった',             ok:false },
        ],
        reply:{ en:'Yes! A cute pink ribbon!', jp:'そう！かわいい ピンクの リボンだよ！' },
        clue:{ icon:'🎀', jp:'クラゲちゃんは ピンクの リボンを つけている' },
      },
      {
        type:'ask', witness:'jellyfish',
        scene:'おおきな いわの ちかくに ピンクのリボンの こが いた！こえを かけよう！',
        question:'「だいじょうぶ？」って えいごで なんて いう？',
        options:[
          { text:'Are you OK?',  ok:true  },
          { text:'Good night!',  ok:false },
          { text:'Cat!',         ok:false },
        ],
        reply:{ en:'Thank you! I was so scared!', jp:'ありがとう！とっても こわかったの！' },
        clue:{ icon:'😢', jp:'クラゲちゃんを はっけん！こわがっている' },
      },
    ],
    deduce:{
      question:'クラゲちゃんが みつかった ばしょは… どこだった！？',
      suspects:[
        { icon:'🪨', name:'おおきな いわの ちかく', ok:true  },
        { icon:'🌊', name:'ふかい うみの そこ',     ok:false },
        { icon:'⛵', name:'ふねの うえ',             ok:false },
      ],
      hint:'カニさんは どこで みたって いってたかな…？',
    },
    resolve:[
      'うみのおうさま「おお！クラゲちゃん！ぶじで よかった！」',
      'クラゲちゃん「Thank you, great detective!（めいたんてい、ありがとう！）」',
      'うみに えがおが もどった！ さすが めいたんてい！',
    ],
  },

  // ─────────── 事件3 ───────────
  {
    id:'hat', title:'おとしものの ぼうし', emoji:'🎩', diff:2,
    client:'leafBug',
    intro:[
      'はっぱちゃんが なにかを もって やってきた。',
      'はっぱちゃん「もりで すてきな ぼうしを ひろったの。おとしぬしを さがして！」',
      'この ぼうしは だれの ものだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'spider',
        scene:'クモちゃんに ぼうしの ことを きいてみよう！',
        question:'「これは だれの ぼうし？」って えいごで なんて きく？',
        options:[
          { text:'Whose hat is this?',  ok:true  },
          { text:'How much is this?',   ok:false },
          { text:'Apple!',              ok:false },
        ],
        reply:{ en:"It's not mine. Skeleton always wears a hat!", jp:'わたしのじゃ ないわ。ガイコツさんは いつも ぼうしを かぶってるわよ！' },
        clue:{ icon:'💀', jp:'ガイコツさんは いつも ぼうしを かぶっている' },
      },
      {
        type:'listen', witness:'skeleton',
        scene:'ガイコツさんに あいにいこう。よーく きいてね！',
        witnessSays:{ en:'I lost my hat yesterday. It is red.', jp:null },
        question:'ガイコツさんは なんて いった？',
        options:[
          { text:'「きのう あかい ぼうしを なくした」って いった', ok:true  },
          { text:'「きょう あおい くつを かった」って いった',     ok:false },
          { text:'「ぼうしは もってない」って いった',             ok:false },
        ],
        reply:{ en:"Yes... I miss my red hat.", jp:'そうなんだ…あかい ぼうしが ないと さみしいよ。' },
        clue:{ icon:'🔴', jp:'ガイコツさんは きのう「あかい ぼうし」を なくした' },
      },
      {
        type:'ask', witness:'skeleton',
        scene:'ひろった ぼうしは あかだった！ ガイコツさんに わたそう！',
        question:'「はい、どうぞ」って えいごで なんて いう？',
        options:[
          { text:'Here you are!',  ok:true  },
          { text:'Give me!',       ok:false },
          { text:'Goodbye!',       ok:false },
        ],
        reply:{ en:'Wow! Thank you so much! This is my hat!', jp:'わあ！ほんとうに ありがとう！これ ぼくの ぼうしだ！' },
        clue:{ icon:'🎩', jp:'あかい ぼうしは ガイコツさんの ものだった' },
      },
    ],
    deduce:{
      question:'ぼうしの おとしぬしは… だれだった！？',
      suspects:[
        { res:'skeleton', ok:true  },
        { res:'spider',   ok:false },
        { res:'crab',     ok:false },
      ],
      hint:'あかい ぼうしを なくしたのは だれだったかな…？',
    },
    resolve:[
      'ガイコツさん「Thank you! I\'m so happy!（ありがとう！うれしいよ！）」',
      'はっぱちゃん「おとしぬしが みつかって よかった〜！」',
      'ガイコツさんは おれいに たのしい ダンスを おどってくれた！',
    ],
  },

  // ─────────── 事件4 ───────────
  {
    id:'cake', title:'はんぶんに なった ケーキ', emoji:'🍰', diff:2,
    client:'crab',
    intro:[
      'カニさんが おおあわてで やってきた！',
      'カニさん「あした パーティーなのに、ケーキが はんぶん たべられてる〜！」',
      'いったい だれが たべたんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'slime',
        scene:'あまいもの だいすきな スライムくんに きいてみよう！',
        question:'「ケーキは すき？」って えいごで なんて きく？',
        options:[
          { text:'Do you like cake?', ok:true  },
          { text:'Can you fly?',      ok:false },
          { text:'Good morning!',     ok:false },
        ],
        reply:{ en:"Yes, I do! But I didn't eat it. I saw green footprints!", jp:'すきだよ！でも ぼくじゃないよ。みどりの あしあとを みたんだ！' },
        clue:{ icon:'👣', jp:'ケーキのそばに みどりの あしあとが あった' },
      },
      {
        type:'listen', witness:'leafBug',
        scene:'はっぱちゃんが なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'The big slime loves sweets!', jp:null },
        question:'はっぱちゃんは なんて いった？',
        options:[
          { text:'「おおきなスライムは あまいものが だいすき」って いった', ok:true  },
          { text:'「おおきなスライムは やさいが すき」って いった',         ok:false },
          { text:'「コウモリくんが たべた」って いった',                     ok:false },
        ],
        reply:{ en:'Yes! He eats sweets every day!', jp:'そう！まいにち あまいものを たべてるよ！' },
        clue:{ icon:'🍬', jp:'おおきなスライムは あまいものが だいすき' },
      },
      {
        type:'ask', witness:'bigSlime',
        scene:'みどりいろの おおきなスライムに ちょくせつ きいてみよう！ゆうきを だして！',
        question:'「ケーキを たべた？」って えいごで なんて きく？',
        options:[
          { text:'Did you eat the cake?', ok:true  },
          { text:"What's your name?",     ok:false },
          { text:'Sunny!',                ok:false },
        ],
        reply:{ en:"...Yes. I'm sorry. It was so yummy.", jp:'…うん。ごめんなさい。とっても おいしくて…' },
        clue:{ icon:'🙇', jp:'おおきなスライムが「たべた」と はくじょうした' },
      },
    ],
    deduce:{
      question:'ケーキを たべたのは… だれだ！？',
      suspects:[
        { res:'bigSlime', ok:true  },
        { res:'slime',    ok:false },
        { res:'bat',      ok:false },
      ],
      hint:'みどりの あしあと… あまいもの だいすき… はくじょう…',
    },
    resolve:[
      'おおきなスライム「I\'m sorry...（ごめんなさい…）」',
      'カニさん「しょうがないなあ。じゃあ いっしょに あたらしい ケーキを つくろう！」',
      '「Let\'s make a cake together!」みんなで ケーキづくり！パーティーは だいせいこう！',
    ],
  },

  // ─────────── 事件5 ───────────
  {
    id:'sound', title:'よなかの ものおと', emoji:'🎸', diff:3,
    client:'giantSpider',
    intro:[
      'クモのおかあさんが ねむそうな かおで やってきた。',
      'クモのおかあさん「まよなかに へんな おとが して ねむれないの…しらべて！」',
      'よなかの ものおとの しょうたいは なんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'stormBird',
        scene:'よふかしの とりさんに きいてみよう！',
        question:'「なにか きこえた？」って えいごで なんて きく？',
        options:[
          { text:'Did you hear anything?', ok:true  },
          { text:'Are you sleepy?',        ok:false },
          { text:'Melon!',                 ok:false },
        ],
        reply:{ en:'Yes! I heard music at night!', jp:'うん！よるに おんがくが きこえたよ！' },
        clue:{ icon:'🎵', jp:'よなかに「おんがく」が きこえていた' },
      },
      {
        type:'listen', witness:'darkCloud',
        scene:'そらの くもくんも なにか みたみたい。よーく きいてね！',
        witnessSays:{ en:'The knight can play the guitar!', jp:null },
        question:'くもくんは なんて いった？',
        options:[
          { text:'「きしは ギターが ひける」って いった',     ok:true  },
          { text:'「きしは うたが へた」って いった',         ok:false },
          { text:'「きしは ダンスが とくい」って いった',     ok:false },
        ],
        reply:{ en:'Yes! He is a good guitar player!', jp:'そう！ギターが じょうずなんだよ！' },
        clue:{ icon:'🎸', jp:'よろいのきしは ギターが ひける' },
      },
      {
        type:'ask', witness:'shadowKnight',
        scene:'よろいのきしに かくにん しよう！',
        question:'「ギターを ひける？」って えいごで なんて きく？',
        options:[
          { text:'Can you play the guitar?', ok:true  },
          { text:'Can you swim?',            ok:false },
          { text:'Pencil!',                  ok:false },
        ],
        reply:{ en:'Yes, I can! I practice at night... Sorry, was it loud?', jp:'ひけるよ！よるに れんしゅう してたんだ…うるさかった？ごめんね。' },
        clue:{ icon:'🌙', jp:'きしが よなかに ギターの れんしゅうを していた' },
      },
    ],
    deduce:{
      question:'よなかの ものおとの しょうたいは… なんだ！？',
      suspects:[
        { icon:'🎸', name:'きしの ギターの れんしゅう', ok:true  },
        { icon:'👻', name:'おばけの こえ',               ok:false },
        { icon:'⚡', name:'かみなりの おと',             ok:false },
      ],
      hint:'おんがく… ギター… よなかの れんしゅう…',
    },
    resolve:[
      'よろいのきし「I\'m sorry! これからは おひるに れんしゅうするよ！」',
      'クモのおかあさん「よかった〜。これで ぐっすり ねむれるわ♪」',
      'きしは おわびに ミニコンサートを ひらいた！すてきな おんがくかい に なった！',
    ],
  },

  // ─────────── 事件6 ───────────
  {
    id:'egg', title:'ふしぎな たまご', emoji:'🥚', diff:3,
    client:'stormBird',
    intro:[
      'とりさんが くびを かしげながら やってきた。',
      'とりさん「すの なかの たまごが 1つ ふえてる！？ だれかの たまごが まざったみたい！」',
      'ふしぎな たまごの もちぬしを さがそう！ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'stormBird',
        scene:'まずは たまごの かずを かくにん しよう！',
        question:'「たまごは いくつ？」って えいごで なんて きく？',
        options:[
          { text:'How many eggs?', ok:true  },
          { text:'How are you?',   ok:false },
          { text:'Red!',           ok:false },
        ],
        reply:{ en:'I had three eggs. Now I have four!', jp:'3つ だったのに、いまは 4つ あるの！' },
        clue:{ icon:'🔢', jp:'たまごが 3つ → 4つに ふえていた' },
      },
      {
        type:'listen', witness:'fishKnight',
        scene:'うみから きた さかなのきしが なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'The sea king lost a big blue egg!', jp:null },
        question:'さかなのきしは なんて いった？',
        options:[
          { text:'「うみのおうさまが おおきな あおいたまごを なくした」って いった', ok:true  },
          { text:'「うみのおうさまが ちいさな あかいたまごを かった」って いった',   ok:false },
          { text:'「うみのおうさまは たまごが きらい」って いった',                 ok:false },
        ],
        reply:{ en:'Yes! He is looking for it everywhere!', jp:'そう！あちこち さがしてるんだよ！' },
        clue:{ icon:'🔵', jp:'うみのおうさまが「おおきくて あおい たまご」を なくした' },
      },
      {
        type:'ask', witness:'stormBird',
        scene:'すの たまごを よくみて みよう！どれか 1つだけ ちがうみたい…',
        question:'「おおきくて あおいのは どれ？」って えいごで なんて きく？',
        options:[
          { text:'Which one is big and blue?', ok:true  },
          { text:'Where is my hat?',           ok:false },
          { text:'Juice!',                     ok:false },
        ],
        reply:{ en:'This one! It is big and blue!', jp:'これだ！おおきくて あおい たまごが あった！' },
        clue:{ icon:'🥚', jp:'すの なかに「おおきくて あおい たまご」が あった' },
      },
    ],
    deduce:{
      question:'ふしぎな たまごの もちぬしは… だれだ！？',
      suspects:[
        { res:'seaKing', ok:true  },
        { res:'spider',  ok:false },
        { res:'slime',   ok:false },
      ],
      hint:'おおきくて あおい たまごを なくしたのは だれだったかな…？',
    },
    resolve:[
      'うみのおうさま「おお！わしの たまごじゃ！かぜで とばされて しまったのじゃ！」',
      'うみのおうさま「Thank you, great detective!（めいたんてい、ありがとう！）」',
      'たまごは ぶじ うみへ かえった。とりさんも あんしん！',
    ],
  },
];
