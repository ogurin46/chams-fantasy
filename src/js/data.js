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

// ─── ことばのもりの かわいい どうぶつたち ───
const RESIDENTS = {
  rabbit:   { name:'うさちゃん',     img:'img/animal_rabbit.png',   emoji:'🐰' },
  squirrel: { name:'りすさん',       img:'img/animal_squirrel.png', emoji:'🐿️' },
  bear:     { name:'くまくん',       img:'img/animal_bear.png',     emoji:'🐻' },
  bird:     { name:'ことりちゃん',   img:'img/animal_bird.png',     emoji:'🐦' },
  fox:      { name:'きつねくん',     img:'img/animal_fox.png',      emoji:'🦊' },
  owl:      { name:'ふくろうはかせ', img:'img/animal_owl.png',      emoji:'🦉' },
  penguin:  { name:'ぺんぎんくん',   img:'img/animal_penguin.png',  emoji:'🐧' },
  dolphin:  { name:'いるかちゃん',   img:'img/animal_dolphin.png',  emoji:'🐬' },
  turtle:   { name:'かめじいさん',   img:'img/animal_turtle.png',   emoji:'🐢' },
  cat:      { name:'ねこちゃん',     img:'img/animal_cat.png',      emoji:'🐱' },
  dog:      { name:'いぬくん',       img:'img/animal_dog.png',      emoji:'🐶' },
  panda:    { name:'ぱんださん',     img:'img/animal_panda.png',    emoji:'🐼' },
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
  'きがつくと、そこは 「ことばのもり」。こびとの チャムズたちと かわいい どうぶつたちが すむ せかい！',
  'リク「たすけて めいたんてい！ このもりでは こまった じけんが いっぱい おきてるんだ！」',
  'パク「このせかいの どうぶつたちは えいごで おはなしするよ。ぼくたちが てつだうね！」',
  'ミミ「でもね、わたしたち、えいごを まちがえちゃうことも あるの…」',
  'だから きみの でばん！ ただしい えいごを いっている チャムズを みぬいて、じけんを かいけつしよう！',
];

// ─── 英語 → 日本語訳（キャラクターが話した後に表示する字幕） ───
const EN_JP = {
  'Hello!':'こんにちは！',
  'Good night!':'おやすみなさい',
  'Banana!':'バナナ！',
  'Thank you!':'ありがとう！',
  "I'm sorry!":'ごめんなさい',
  'Dog!':'いぬ！',
  'Where is Dolphin?':'いるかちゃんは どこ？',
  'What time is it?':'いま なんじ？',
  "I'm hungry!":'おなかが すいた！',
  'Are you OK?':'だいじょうぶ？',
  'Cat!':'ねこ！',
  'Whose hat is this?':'これは だれの ぼうし？',
  'How much is this?':'これは いくら？',
  'Apple!':'りんご！',
  'Here you are!':'はい、どうぞ！',
  'Give me!':'ちょうだい！',
  'Goodbye!':'さようなら！',
  'Do you like cake?':'ケーキは すき？',
  'Can you fly?':'そらを とべる？',
  'Good morning!':'おはよう！',
  'Did you eat the cake?':'ケーキを たべた？',
  "What's your name?":'なまえは なに？',
  'Sunny!':'はれ！',
  'Did you hear anything?':'なにか きこえた？',
  'Are you sleepy?':'ねむい？',
  'Melon!':'メロン！',
  'Can you play the guitar?':'ギターを ひける？',
  'Can you swim?':'およげる？',
  'Pencil!':'えんぴつ！',
  'How many eggs?':'たまごは いくつ？',
  'How are you?':'げんき？',
  'Red!':'あか！',
  'Where is my hat?':'わたしの ぼうしは どこ？',
  'Juice!':'ジュース！',
  'Which one is big and blue?':'おおきくて あおいのは どれ？',
  'I like honey very much!':'はちみつが だいすき！',
  "I don't like honey.":'はちみつは すきじゃない',
  'I like apples very much!':'りんごが だいすき！',
  'She has a pink ribbon!':'ピンクの リボンを つけてるよ！',
  'She has a blue hat!':'あおい ぼうしを かぶってるよ',
  'I am very hungry!':'とっても おなかが すいた！',
  'I lost my hat. It is red.':'ぼうしを なくしたんだ。あかいろだよ',
  'I bought new shoes today.':'きょう あたらしい くつを かったんだ',
  "I don't have a hat.":'ぼうしは もってないよ',
  'The panda loves sweets!':'ぱんださんは あまいものが だいすき！',
  'The panda loves vegetables!':'ぱんださんは やさいが だいすき！',
  'The bear ate the cake!':'くまくんが ケーキを たべたよ！',
  'The dog can play the guitar!':'いぬくんは ギターが ひけるよ！',
  'The dog can play the piano!':'いぬくんは ピアノが ひけるよ！',
  'The dog can dance!':'いぬくんは ダンスが できるよ！',
  'The turtle lost a big blue egg!':'かめじいさんが おおきくて あおい たまごを なくしたよ！',
  'The turtle found a small red egg!':'かめじいさんが ちいさくて あかい たまごを みつけたよ！',
  "The turtle doesn't like eggs!":'かめじいさんは たまごが すきじゃないよ！',
  'I lost my hat yesterday. It is red.':'きのう ぼうしを なくしたんだ。あかいろだよ',
};

// ═══════════════════════════════════════════════════════════
// 事件データ
//   step.type 'ask'    = なんて いえばいい？（チャムズが英語を提案 → 正しい英語を選ぶ）
//   step.type 'listen' = なんて いってた？（動物の英語を聞いて → 正しい意味を選ぶ）
//   options は実行時にチャムズ3人へランダムに割り当てられる
// ═══════════════════════════════════════════════════════════
const CASES = [

  // ─────────── 事件1 ───────────
  {
    id:'honey', title:'きえた はちみつ', emoji:'🍯', diff:1,
    client:'squirrel',
    intro:[
      'たいへん たいへん！ りすさんが かけこんできた！',
      'りすさん「たいせつな はちみつが きえちゃったの！ めいたんてい、さがして！」',
      'よし、ききこみ かいし！ もりの みんなに はなしを きこう！',
    ],
    steps:[
      {
        type:'ask', witness:'rabbit',
        scene:'まずは うさちゃんに あいさつしよう！',
        question:'「こんにちは」って えいごで なんて いう？',
        options:[
          { text:'Hello!',      ok:true  },
          { text:'Good night!', ok:false },
          { text:'Banana!',     ok:false },
        ],
        reply:{ en:'Hello! I saw someone big and brown!', jp:'こんにちは！おおきくて ちゃいろい だれかを みたよ！' },
        clue:{ icon:'🟤', jp:'はんにんは おおきくて ちゃいろい' },
      },
      {
        type:'listen', witness:'bear',
        scene:'くまくんに はなしを きこう。よーく きいてね！',
        witnessSays:{ en:'I like honey very much!', jp:null },
        question:'くまくんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'I like honey very much!',  ok:true  },
          { text:"I don't like honey.",      ok:false },
          { text:'I like apples very much!', ok:false },
        ],
        reply:{ en:'Yes! Honey is yummy!', jp:'そうだよ！はちみつは おいしいよね！' },
        clue:{ icon:'🍯', jp:'くまくんは はちみつが だいすき' },
      },
      {
        type:'ask', witness:'bird',
        scene:'そらの うえから みていた ことりちゃんが きた！おれいを いってから きこう。',
        question:'「ありがとう」って えいごで なんて いう？',
        options:[
          { text:'Thank you!', ok:true  },
          { text:"I'm sorry!", ok:false },
          { text:'Dog!',       ok:false },
        ],
        reply:{ en:'You\'re welcome! I saw the bear go to the honey house at night!', jp:'どういたしまして！よるに くまくんが はちみつのいえに いくのを みたよ！' },
        clue:{ icon:'🌙', jp:'よる、くまくんが はちみつのいえへ いった' },
      },
    ],
    deduce:{
      question:'てがかりが そろった！ はちみつを たべたのは… だれだ！？',
      suspects:[
        { res:'bear',    ok:true  },
        { res:'penguin', ok:false },
        { res:'rabbit',  ok:false },
      ],
      hint:'おおきくて ちゃいろい… はちみつが だいすき… よるに いった…',
    },
    resolve:[
      'くまくん「I\'m sorry... とっても おなかが すいてたんだ…」',
      'りすさん「そうだったのね。じゃあ こんどからは いっしょに たべましょ！」',
      'みんなで はちみつを わけっこ して なかなおり！ めでたし めでたし！',
    ],
  },

  // ─────────── 事件2 ───────────
  {
    id:'dolphin', title:'まいごの いるかちゃん', emoji:'🐬', diff:1,
    client:'turtle',
    intro:[
      'うみの ちょうろう、かめじいさんが しんぱいそうに やってきた。',
      'かめじいさん「いるかちゃんが まいごに なってしまった！ さがしてくれ！」',
      'いるかちゃんは どこに いるんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'penguin',
        scene:'ぺんぎんくんに いるかちゃんの ばしょを きこう！',
        question:'「いるかちゃんは どこ？」って えいごで なんて きく？',
        options:[
          { text:'Where is Dolphin?', ok:true  },
          { text:'What time is it?',  ok:false },
          { text:"I'm hungry!",       ok:false },
        ],
        reply:{ en:'I saw her near the big rock!', jp:'おおきな いわの ちかくで みたよ！' },
        clue:{ icon:'🪨', jp:'おおきな いわの ちかくに いる' },
      },
      {
        type:'listen', witness:'cat',
        scene:'ねこちゃんも なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'She has a pink ribbon!', jp:null },
        question:'ねこちゃんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'She has a pink ribbon!', ok:true  },
          { text:'She has a blue hat!',    ok:false },
          { text:'I am very hungry!',      ok:false },
        ],
        reply:{ en:'Yes! A cute pink ribbon!', jp:'そう！かわいい ピンクの リボンだよ！' },
        clue:{ icon:'🎀', jp:'いるかちゃんは ピンクの リボンを つけている' },
      },
      {
        type:'ask', witness:'dolphin',
        scene:'おおきな いわの ちかくに ピンクのリボンの こが いた！こえを かけよう！',
        question:'「だいじょうぶ？」って えいごで なんて いう？',
        options:[
          { text:'Are you OK?',  ok:true  },
          { text:'Good night!',  ok:false },
          { text:'Cat!',         ok:false },
        ],
        reply:{ en:'Thank you! I was so scared!', jp:'ありがとう！とっても こわかったの！' },
        clue:{ icon:'😢', jp:'いるかちゃんを はっけん！こわがっている' },
      },
    ],
    deduce:{
      question:'いるかちゃんが みつかった ばしょは… どこだった！？',
      suspects:[
        { icon:'🪨', name:'おおきな いわの ちかく', ok:true  },
        { icon:'🌊', name:'ふかい うみの そこ',     ok:false },
        { icon:'⛵', name:'ふねの うえ',             ok:false },
      ],
      hint:'ぺんぎんくんは どこで みたって いってたかな…？',
    },
    resolve:[
      'かめじいさん「おお！いるかちゃん！ぶじで よかった！」',
      'いるかちゃん「Thank you, great detective!（めいたんてい、ありがとう！）」',
      'うみに えがおが もどった！ さすが めいたんてい！',
    ],
  },

  // ─────────── 事件3 ───────────
  {
    id:'hat', title:'おとしものの ぼうし', emoji:'🎩', diff:2,
    client:'bird',
    intro:[
      'ことりちゃんが なにかを もって やってきた。',
      'ことりちゃん「もりで すてきな ぼうしを ひろったの。おとしぬしを さがして！」',
      'この ぼうしは だれの ものだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'cat',
        scene:'ねこちゃんに ぼうしの ことを きいてみよう！',
        question:'「これは だれの ぼうし？」って えいごで なんて きく？',
        options:[
          { text:'Whose hat is this?',  ok:true  },
          { text:'How much is this?',   ok:false },
          { text:'Apple!',              ok:false },
        ],
        reply:{ en:"It's not mine. Fox always wears a hat!", jp:'わたしのじゃ ないわ。きつねくんは いつも ぼうしを かぶってるわよ！' },
        clue:{ icon:'🦊', jp:'きつねくんは いつも ぼうしを かぶっている' },
      },
      {
        type:'listen', witness:'fox',
        scene:'きつねくんに あいにいこう。よーく きいてね！',
        witnessSays:{ en:'I lost my hat yesterday. It is red.', jp:null },
        question:'きつねくんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'I lost my hat. It is red.',  ok:true  },
          { text:'I bought new shoes today.',  ok:false },
          { text:"I don't have a hat.",        ok:false },
        ],
        reply:{ en:'Yes... I miss my red hat.', jp:'そうなんだ…あかい ぼうしが ないと さみしいよ。' },
        clue:{ icon:'🔴', jp:'きつねくんは きのう「あかい ぼうし」を なくした' },
      },
      {
        type:'ask', witness:'fox',
        scene:'ひろった ぼうしは あかだった！ きつねくんに わたそう！',
        question:'「はい、どうぞ」って えいごで なんて いう？',
        options:[
          { text:'Here you are!',  ok:true  },
          { text:'Give me!',       ok:false },
          { text:'Goodbye!',       ok:false },
        ],
        reply:{ en:'Wow! Thank you so much! This is my hat!', jp:'わあ！ほんとうに ありがとう！これ ぼくの ぼうしだ！' },
        clue:{ icon:'🎩', jp:'あかい ぼうしは きつねくんの ものだった' },
      },
    ],
    deduce:{
      question:'ぼうしの おとしぬしは… だれだった！？',
      suspects:[
        { res:'fox',     ok:true  },
        { res:'cat',     ok:false },
        { res:'penguin', ok:false },
      ],
      hint:'あかい ぼうしを なくしたのは だれだったかな…？',
    },
    resolve:[
      'きつねくん「Thank you! I\'m so happy!（ありがとう！うれしいよ！）」',
      'ことりちゃん「おとしぬしが みつかって よかった〜！」',
      'きつねくんは おれいに たのしい ダンスを おどってくれた！',
    ],
  },

  // ─────────── 事件4 ───────────
  {
    id:'cake', title:'はんぶんに なった ケーキ', emoji:'🍰', diff:2,
    client:'cat',
    intro:[
      'ねこちゃんが おおあわてで やってきた！',
      'ねこちゃん「あした パーティーなのに、ケーキが はんぶん たべられてる〜！」',
      'いったい だれが たべたんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'rabbit',
        scene:'あまいもの だいすきな うさちゃんに きいてみよう！',
        question:'「ケーキは すき？」って えいごで なんて きく？',
        options:[
          { text:'Do you like cake?', ok:true  },
          { text:'Can you fly?',      ok:false },
          { text:'Good morning!',     ok:false },
        ],
        reply:{ en:"Yes, I do! But I didn't eat it. I saw black and white footprints!", jp:'すきだよ！でも わたしじゃないよ。しろと くろの あしあとを みたの！' },
        clue:{ icon:'👣', jp:'ケーキのそばに しろと くろの あしあとが あった' },
      },
      {
        type:'listen', witness:'bird',
        scene:'ことりちゃんが なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'The panda loves sweets!', jp:null },
        question:'ことりちゃんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'The panda loves sweets!',     ok:true  },
          { text:'The panda loves vegetables!', ok:false },
          { text:'The bear ate the cake!',      ok:false },
        ],
        reply:{ en:'Yes! He eats sweets every day!', jp:'そう！まいにち あまいものを たべてるよ！' },
        clue:{ icon:'🍬', jp:'ぱんださんは あまいものが だいすき' },
      },
      {
        type:'ask', witness:'panda',
        scene:'しろと くろの ぱんださんに ちょくせつ きいてみよう！ゆうきを だして！',
        question:'「ケーキを たべた？」って えいごで なんて きく？',
        options:[
          { text:'Did you eat the cake?', ok:true  },
          { text:"What's your name?",     ok:false },
          { text:'Sunny!',                ok:false },
        ],
        reply:{ en:"...Yes. I'm sorry. It was so yummy.", jp:'…うん。ごめんなさい。とっても おいしくて…' },
        clue:{ icon:'🙇', jp:'ぱんださんが「たべた」と はくじょうした' },
      },
    ],
    deduce:{
      question:'ケーキを たべたのは… だれだ！？',
      suspects:[
        { res:'panda',  ok:true  },
        { res:'rabbit', ok:false },
        { res:'bear',   ok:false },
      ],
      hint:'しろと くろの あしあと… あまいもの だいすき… はくじょう…',
    },
    resolve:[
      'ぱんださん「I\'m sorry...（ごめんなさい…）」',
      'ねこちゃん「しょうがないなあ。じゃあ いっしょに あたらしい ケーキを つくろう！」',
      '「Let\'s make a cake together!」みんなで ケーキづくり！パーティーは だいせいこう！',
    ],
  },

  // ─────────── 事件5 ───────────
  {
    id:'sound', title:'よなかの ものおと', emoji:'🎸', diff:3,
    client:'rabbit',
    intro:[
      'うさちゃんが ねむそうな かおで やってきた。',
      'うさちゃん「まよなかに へんな おとが して ねむれないの…しらべて！」',
      'よなかの ものおとの しょうたいは なんだろう？ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'owl',
        scene:'よるに おきている ふくろうはかせに きいてみよう！',
        question:'「なにか きこえた？」って えいごで なんて きく？',
        options:[
          { text:'Did you hear anything?', ok:true  },
          { text:'Are you sleepy?',        ok:false },
          { text:'Melon!',                 ok:false },
        ],
        reply:{ en:'Yes! I heard music at night!', jp:'うむ！よるに おんがくが きこえたぞ！' },
        clue:{ icon:'🎵', jp:'よなかに「おんがく」が きこえていた' },
      },
      {
        type:'listen', witness:'bird',
        scene:'ことりちゃんも なにか みたみたい。よーく きいてね！',
        witnessSays:{ en:'The dog can play the guitar!', jp:null },
        question:'ことりちゃんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'The dog can play the guitar!', ok:true  },
          { text:'The dog can play the piano!',  ok:false },
          { text:'The dog can dance!',           ok:false },
        ],
        reply:{ en:'Yes! He is a good guitar player!', jp:'そう！ギターが じょうずなんだよ！' },
        clue:{ icon:'🎸', jp:'いぬくんは ギターが ひける' },
      },
      {
        type:'ask', witness:'dog',
        scene:'いぬくんに かくにん しよう！',
        question:'「ギターを ひける？」って えいごで なんて きく？',
        options:[
          { text:'Can you play the guitar?', ok:true  },
          { text:'Can you swim?',            ok:false },
          { text:'Pencil!',                  ok:false },
        ],
        reply:{ en:'Yes, I can! I practice at night... Sorry, was it loud?', jp:'ひけるよ！よるに れんしゅう してたんだ…うるさかった？ごめんね。' },
        clue:{ icon:'🌙', jp:'いぬくんが よなかに ギターの れんしゅうを していた' },
      },
    ],
    deduce:{
      question:'よなかの ものおとの しょうたいは… なんだ！？',
      suspects:[
        { icon:'🎸', name:'いぬくんの ギターの れんしゅう', ok:true  },
        { icon:'👻', name:'おばけの こえ',                   ok:false },
        { icon:'⚡', name:'かみなりの おと',                 ok:false },
      ],
      hint:'おんがく… ギター… よなかの れんしゅう…',
    },
    resolve:[
      'いぬくん「I\'m sorry! これからは おひるに れんしゅうするよ！」',
      'うさちゃん「よかった〜。これで ぐっすり ねむれるわ♪」',
      'いぬくんは おわびに ミニコンサートを ひらいた！すてきな おんがくかいに なった！',
    ],
  },

  // ─────────── 事件6 ───────────
  {
    id:'egg', title:'ふしぎな たまご', emoji:'🥚', diff:3,
    client:'bird',
    intro:[
      'ことりちゃんが くびを かしげながら やってきた。',
      'ことりちゃん「すの なかの たまごが 1つ ふえてる！？ だれかの たまごが まざったみたい！」',
      'ふしぎな たまごの もちぬしを さがそう！ ききこみ かいし！',
    ],
    steps:[
      {
        type:'ask', witness:'bird',
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
        type:'listen', witness:'dolphin',
        scene:'うみから きた いるかちゃんが なにか しってるみたい。よーく きいてね！',
        witnessSays:{ en:'The turtle lost a big blue egg!', jp:null },
        question:'いるかちゃんと おなじことを いってるのは どの チャムズ？',
        options:[
          { text:'The turtle lost a big blue egg!',   ok:true  },
          { text:'The turtle found a small red egg!', ok:false },
          { text:"The turtle doesn't like eggs!",     ok:false },
        ],
        reply:{ en:'Yes! He is looking for it everywhere!', jp:'そう！あちこち さがしてるんだよ！' },
        clue:{ icon:'🔵', jp:'かめじいさんが「おおきくて あおい たまご」を なくした' },
      },
      {
        type:'ask', witness:'bird',
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
        { res:'turtle', ok:true  },
        { res:'cat',    ok:false },
        { res:'rabbit', ok:false },
      ],
      hint:'おおきくて あおい たまごを なくしたのは だれだったかな…？',
    },
    resolve:[
      'かめじいさん「おお！わしの たまごじゃ！なみに さらわれて しまったのじゃ！」',
      'かめじいさん「Thank you, great detective!（めいたんてい、ありがとう！）」',
      'たまごは ぶじ うみへ かえった。ことりちゃんも あんしん！',
    ],
  },
];
