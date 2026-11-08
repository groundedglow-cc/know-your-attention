const svg = (body, color = '#fff') => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="32" fill="${color}"/>${body}</svg>`)}`;
// Bundled word audio is served from OSS; the files under public/.../audio are
// retained for local generation and upload verification.
const audio = id => `https://japaflow-audio-bucket.oss-cn-shanghai.aliyuncs.com/memory-match/audio/${id}.mp3`;
const animal = (id, name, japanese, body, color) => ({ id, name, japanese, audio: audio(id), src: svg(body, color) });
export const builtInThemes = {
  animals: { name: '小动物', back: '#90c7b1', images: [
    animal('neko', '小猫', 'ねこ', '<path d="M43 65 50 35l20 18h20l20-18 7 30" fill="#efae72"/><circle cx="80" cy="91" r="47" fill="#efae72"/><circle cx="64" cy="87" r="5"/><circle cx="96" cy="87" r="5"/><path d="M80 96l-7 7h14zM80 104v12M55 106l-20 6m70-6 20 6" stroke="#704b3d" stroke-width="4" fill="none" stroke-linecap="round"/>', '#fff8ed'),
    animal('inu', '小狗', 'いぬ', '<ellipse cx="47" cy="76" rx="19" ry="35" fill="#a96f4c" transform="rotate(25 47 76)"/><ellipse cx="113" cy="76" rx="19" ry="35" fill="#a96f4c" transform="rotate(-25 113 76)"/><circle cx="80" cy="90" r="47" fill="#c98c61"/><circle cx="63" cy="85" r="5"/><circle cx="97" cy="85" r="5"/><ellipse cx="80" cy="101" rx="9" ry="6" fill="#573d35"/><path d="M80 108q0 17-14 10m14-10q0 17 14 10" stroke="#573d35" stroke-width="4" fill="none"/>', '#fff8ed'),
    animal('usagi', '小兔子', 'うさぎ', '<ellipse cx="57" cy="45" rx="15" ry="35" fill="#f1a5b6" transform="rotate(-13 57 45)"/><ellipse cx="103" cy="45" rx="15" ry="35" fill="#f1a5b6" transform="rotate(13 103 45)"/><circle cx="80" cy="96" r="45" fill="#f7c4ce"/><circle cx="64" cy="91" r="5"/><circle cx="96" cy="91" r="5"/><path d="M80 101l-7 7h14zM80 108v11" stroke="#815365" stroke-width="4" fill="none"/>', '#fff8ed'),
    animal('zou', '大象', 'ぞう', '<circle cx="80" cy="85" r="48" fill="#9bb8c8"/><circle cx="40" cy="87" r="28" fill="#9bb8c8"/><circle cx="120" cy="87" r="28" fill="#9bb8c8"/><circle cx="65" cy="78" r="5"/><circle cx="95" cy="78" r="5"/><path d="M72 94q8 7 16 0v32q0 12-12 12" stroke="#617d8c" stroke-width="8" stroke-linecap="round" fill="none"/>', '#f0f8fb'),
    animal('panda', '熊猫', 'パンダ', '<circle cx="47" cy="50" r="16" fill="#313d45"/><circle cx="113" cy="50" r="16" fill="#313d45"/><circle cx="80" cy="89" r="49" fill="#fff"/><ellipse cx="62" cy="84" rx="14" ry="18" fill="#313d45" transform="rotate(30 62 84)"/><ellipse cx="98" cy="84" rx="14" ry="18" fill="#313d45" transform="rotate(-30 98 84)"/><circle cx="63" cy="84" r="4"/><circle cx="97" cy="84" r="4"/><ellipse cx="80" cy="103" rx="8" ry="5" fill="#313d45"/>', '#f5f7f4'),
    animal('pengin', '企鹅', 'ペンギン', '<ellipse cx="80" cy="88" rx="43" ry="55" fill="#354c5c"/><ellipse cx="80" cy="101" rx="29" ry="36" fill="#fff"/><circle cx="65" cy="76" r="5" fill="#fff"/><circle cx="95" cy="76" r="5" fill="#fff"/><path d="m80 85-10 12h20z" fill="#f3ae4e"/><ellipse cx="56" cy="137" rx="16" ry="7" fill="#f3ae4e"/><ellipse cx="104" cy="137" rx="16" ry="7" fill="#f3ae4e"/>', '#eff8fb') ] },
  vehicles: { name: '交通工具', back: '#84b8df', images: [['kuruma','汽车','くるま','🚗'],['basu','公交车','バス','🚌'],['densha','火车','でんしゃ','🚂'],['hikouki','飞机','ひこうき','✈️'],['fune','轮船','ふね','🚢'],['shoberukaa','挖掘机','ショベルカー','🚜']].map(([id,name,japanese,icon]) => ({ id, name, japanese, audio: audio(id), src: svg(`<text x="80" y="103" text-anchor="middle" font-size="76">${icon}</text>`, '#f3f9ff') })) },
  fruits: { name: '水果', back: '#eea47d', images: [['ringo','苹果','りんご','🍎'],['banana','香蕉','バナナ','🍌'],['ichigo','草莓','いちご','🍓'],['budou','葡萄','ぶどう','🍇'],['suika','西瓜','すいか','🍉'],['orenji','橙子','オレンジ','🍊']].map(([id,name,japanese,icon]) => ({ id, name, japanese, audio: audio(id), src: svg(`<text x="80" y="105" text-anchor="middle" font-size="75">${icon}</text>`, '#fff9ef') })) },
};

const generatedTheme = (id, name, back, entries) => ({
  name, back,
  images: entries.map(([key, chinese, japanese, english], index) => ({
    id: key, name: chinese, japanese, english,
    audio: { ja: audio(key), en: audio(`${key}-en`) },
    src: `/game/memory/assets/${id}-${index + 1}.png?v=2`,
  })),
});

Object.assign(builtInThemes, {
  body: generatedTheme('body', '身体', '#c9a9d9', [
    ['atama','头','あたま','Head'],['me','眼睛','め','Eye'],['hana','鼻子','はな','Nose'],['mimi','耳朵','みみ','Ear'],['kuchi','嘴巴','くち','Mouth'],['te','手','て','Hand'],['onaka','肚子','おなか','Tummy'],['hiza','膝盖','ひざ','Knee'],['kata','肩膀','かた','Shoulder'],['ashi','脚','あし','Foot'],['kami','头发','かみ','Hair'],['yubi','手指','ゆび','Finger'],
  ]),
  food: generatedTheme('food', '食物', '#f2c26b', [
    ['gohan','米饭','ごはん','Rice'],['pan','面包','パン','Bread'],['sandoicchi','三明治','サンドイッチ','Sandwich'],['onigiri','饭团','おにぎり','Rice ball'],['sushi','寿司','すし','Sushi'],['tamago','鸡蛋','たまご','Egg'],['ringo2','苹果','りんご','Apple'],['banana2','香蕉','バナナ','Banana'],['miruku','牛奶','ミルク','Milk'],['mizu','水','みず','Water'],['chiizu','奶酪','チーズ','Cheese'],['ichigo2','草莓','いちご','Strawberry'],
  ]),
  home: generatedTheme('home', '房子', '#a9c5d8', [
    ['reizoko','冰箱','れいぞうこ','Fridge'],['sentakuki','洗衣机','せんたくき','Washing machine'],['daidokoro','厨房','だいどころ','Kitchen'],['genkan','玄关','げんかん','Entryway'],['doa','门','ドア','Door'],['kabe','墙壁','かべ','Wall'],['mado','窗户','まど','Window'],['beddo','床','ベッド','Bed'],['ofuro','浴室','おふろ','Bath'],['toire','厕所','トイレ','Toilet'],['table','桌子','テーブル','Table'],['ranpu','台灯','ランプ','Lamp'],
  ]),
  routines: generatedTheme('routines', '日常习惯', '#e6ad9f', [
    ['hamigaki','刷牙','はを みがく','Brush teeth'],['tearau','洗手','てを あらう','Wash hands'],['gohan2','吃饭','ごはんを たべる','Eat a meal'],['mizu2','喝水','みずを のむ','Drink water'],['sanpo','散步','さんぽ','Take a walk'],['okiru','起床','おきる','Wake up'],['kigaeru','换衣服','きがえる','Get dressed'],['neru','睡觉','ねる','Sleep'],['kutsu','穿鞋','くつを はく','Put on shoes'],['hon','读书','ほんを よむ','Read a book'],['wakete','分享玩具','おもちゃを わける','Share a toy'],['katazuke','收拾玩具','かたづける','Tidy up'],
  ]),
  weather: generatedTheme('weather', '天气', '#9bc5d4', [
    ['ame','下雨','あめ','Rain'],['hare','晴天','はれ','Sunny'],['kumori','阴天','くもり','Cloudy'],['kaze','风','かぜ','Wind'],['yuki','下雪','ゆき','Snow'],['taiyo','太阳','たいよう','Sun'],['atsui','热','あつい','Hot'],['samui','冷','さむい','Cold'],['niji','彩虹','にじ','Rainbow'],['kasa','雨伞','かさ','Umbrella'],['mizutamari','水洼','みずたまり','Puddle'],['tsuki','月亮','つき','Moon'],
  ]),
  greetings: generatedTheme('greetings', '问候礼貌', '#f0b7a5', [
    ['konnichiwa','你好','こんにちは','Hello'],['ohayo','早上好','おはよう','Good morning'],['konbanwa','晚上好','こんばんは','Good evening'],['oyasumi','晚安','おやすみ','Good night'],['arigato','谢谢','ありがとう','Thank you'],['gomen','对不起','ごめんね','Sorry'],['onegai','请','おねがい','Please'],['matane','再见','またね','See you'],['okaeri','欢迎回家','おかえり','Welcome home'],['highfive','击掌','ハイタッチ','High five'],['egao','笑脸','えがお','Smile'],['kokoro','爱心','こころ','Heart'],
  ]),
  clothes: generatedTheme('clothes', '衣物', '#d9b6cb', [
    ['shatsu','上衣','シャツ','Shirt'],['zubon','裤子','ズボン','Pants'],['kutsu2','鞋子','くつ','Shoes'],['kutsushita','袜子','くつした','Socks'],['boushi','帽子','ぼうし','Hat'],['kooto','外套','コート','Coat'],['sukaato','裙子','スカート','Skirt'],['uwagi','衬衫','うわぎ','Jacket'],['tebukuro','手套','てぶくろ','Gloves'],['mafuraa','围巾','マフラー','Scarf'],['amegappa','雨衣','あめがっぱ','Raincoat'],['nemaki','睡衣','ねまき','Pajamas'],
  ]),
  colors: generatedTheme('colors', '颜色大小', '#b9cbe3', [
    ['aka','红色','あか','Red'],['ao','蓝色','あお','Blue'],['kiiro','黄色','きいろ','Yellow'],['midori','绿色','みどり','Green'],['orenji2','橙色','オレンジ','Orange'],['murasaki','紫色','むらさき','Purple'],['pink','粉色','ピンク','Pink'],['kuro','黑色','くろ','Black'],['shiro','白色','しろ','White'],['chairo','棕色','ちゃいろ','Brown'],['ookii','大','おおきい','Big'],['chiisai','小','ちいさい','Small'],
  ]),
  toys: generatedTheme('toys', '玩具', '#d8b6d7', [
    ['booru','球','ボール','Ball'],['tsumiki','积木','つみき','Blocks'],['omochacar','玩具车','おもちゃのくるま','Toy car'],['ningyou','娃娃','にんぎょう','Doll'],['kuma','玩具熊','くま','Teddy bear'],['pazuru','拼图','パズル','Puzzle'],['iroenpitsu','蜡笔','いろえんぴつ','Crayons'],['fuusen','气球','ふうせん','Balloon'],['takko','风筝','たこ','Kite'],['ehon','故事书','えほん','Story book'],['awa','泡泡','あわ','Bubbles'],['robotto','机器人','ロボット','Robot'],
  ]),
  school: generatedTheme('school', '幼儿园', '#b9d6c0', [
    ['youchien','幼儿园','ようちえん','Preschool'],['sensei','老师','せんせい','Teacher'],['tomodachi','朋友','ともだち','Friend'],['hon2','书','ほん','Book'],['enpitsu','铅笔','えんぴつ','Pencil'],['e','画画','え','Drawing'],['hasami','剪刀','はさみ','Scissors'],['tsukue','桌子','つくえ','Desk'],['isu','椅子','いす','Chair'],['randoseru','书包','ランドセル','Backpack'],['hirune','午睡','ひるね','Nap'],['kouen','操场','こうえん','Playground'],
  ]),
  nature: generatedTheme('nature', '大自然', '#b5d5c5', [
    ['ki','树','き','Tree'],['hana2','花','はな','Flower'],['kusa','草','くさ','Grass'],['ha','叶子','は','Leaf'],['yama','山','やま','Mountain'],['kawa','河流','かわ','River'],['kumo','云','くも','Cloud'],['hoshi','星星','ほし','Star'],['tsuki2','月亮','つき','Moon'],['taiyo2','太阳','たいよう','Sun'],['ishi','石头','いし','Stone'],['mushi','小虫','むし','Bug'],
  ]),
  feelings: generatedTheme('feelings', '我的心情', '#e8b3b0', [
    ['ureshii','我开心','うれしい','I am happy'],['kanashii','我难过','かなしい','I am sad'],['tsukareta','我累了','つかれた','I am tired'],['onakaSuita','我饿了','おなかすいた','I am hungry'],['nodoKawaita','我渴了','のどかわいた','I am thirsty'],['suki','我喜欢','すき','I like it'],['kirai','我不喜欢','きらい','I do not like it'],['kowai','我害怕','こわい','I am scared'],['daijobu','没关系','だいじょうぶ','No problem'],['asobo','一起玩吧','あそぼう','Let us play'],['bokuNoBan','轮到我了','ぼくのばん','My turn'],['kimiNoBan','轮到你了','きみのばん','Your turn'],
  ]),
  requests: generatedTheme('requests', '请求表达', '#e0c18e', [
    ['kudasai','请给我','ください','Please give me'],['hoshii','我想要','ほしい','I want it'],['iranai','我不要','いらない','I do not want it'],['mouIchi','再来一次','もういちど','Again please'],['chottoMatte','等一下','ちょっとまって','Wait a moment'],['kocchi','看这里','こっちをみて','Look here'],['kiite','听我说','きいて','Listen to me'],['ikou','我们走吧','いこう','Let us go'],['issho','一起玩吧','いっしょにあそぼう','Let us play together'],['tetsudete','帮助我','てつだって','Help me'],['dekita','我完成了','できた','I did it'],['wakatta','我知道了','わかった','I understand'],
  ]),
  socialphrases: generatedTheme('socialphrases', '相处短句', '#c1c7df', [
    ['watashiNo','这是我的','これは わたしの','This is mine'],['douzo','给你','どうぞ','Here you are'],['arigato2','谢谢你','ありがとう','Thank you'],['gomen2','对不起','ごめんね','Sorry'],['tasukete','请帮帮我','たすけて','Please help me'],['iiDesuKa','我可以吗','いいですか','May I?'],['genki','你好吗','げんき？','How are you?'],['genkiDesu','我很好','げんきです','I am fine'],['okaeri2','欢迎回家','おかえり','Welcome home'],['ohayo2','早安','おはよう','Good morning'],['oyasumi2','晚安','おやすみ','Good night'],['mataNe2','再见','またね','See you'],
  ]),
  animals2: generatedTheme('animals2', '更多动物', '#9fc8b5', [
    ['choucho','蝴蝶','ちょうちょ','Butterfly'],['sakana','鱼','さかな','Fish'],['mushi2','虫子','むし','Bug'],['kaeru','青蛙','かえる','Frog'],['niwatori','鸡','にわとり','Chicken'],['hakucho','天鹅','はくちょう','Swan'],['hitsuji','羊','ひつじ','Sheep'],['kirin','长颈鹿','きりん','Giraffe'],['saru','猴子','さる','Monkey'],['kame','乌龟','かめ','Turtle'],['uma','马','うま','Horse'],['kirameki','瓢虫','てんとうむし','Ladybug'],
  ]),
  sizespeed: generatedTheme('sizespeed', '大小速度', '#c6b5d8', [
    ['ookii2','大','おおきい','Big'],['chiisai2','小','ちいさい','Small'],['takai','高','たかい','Tall'],['hikui','矮','ひくい','Short'],['futoi','胖','ふとい','Fat'],['hosoi','瘦','ほそい','Thin'],['hayai','快','はやい','Fast'],['osoi','慢','おそい','Slow'],['ooku','多','おおい','Many'],['sukunai','少','すくない','Few'],['kirei','美','きれい','Beautiful'],['minikui','丑','みにくい','Ugly'],
  ]),
  family: generatedTheme('family', '家人称呼', '#efc0a8', [
    ['otousan','爸爸','おとうさん','Dad'],['okaasan','妈妈','おかあさん','Mom'],['ojiichan','爷爷','おじいちゃん','Grandpa'],['obaachan','奶奶','おばあちゃん','Grandma'],['oniichan','哥哥','おにいちゃん','Older brother'],['oneechan','姐姐','おねえちゃん','Older sister'],['otouto','弟弟','おとうと','Younger brother'],['imouto','妹妹','いもうと','Younger sister'],['sensei2','老师','せんせい','Teacher'],['obasan','阿姨','おばさん','Auntie'],['ojisan','叔叔','おじさん','Uncle'],['tomodachi2','朋友','ともだち','Friend'],
  ]),
  jobs: generatedTheme('jobs', '常见职业', '#b5cce0', [
    ['sensei3','老师','せんせい','Teacher'],['keisatsukan','警察','けいさつかん','Police officer'],['shoboshi','消防员','しょうぼうし','Firefighter'],['isha','医生','いしゃ','Doctor'],['kangoshi','护士','かんごし','Nurse'],['supotsu','运动员','スポーツせんしゅ','Athlete'],['bengoshi','律师','べんごし','Lawyer'],['ryorinin','厨师','りょうりにん','Chef'],['nouka','农民','のうか','Farmer'],['pairotto','飞行员','パイロット','Pilot'],['yubin','邮递员','ゆうびんやさん','Mail carrier'],['untenshu','司机','うんてんしゅ','Driver'],
  ]),
});

const clearIcon = (emoji, color = '#fff8ed') => svg(`<text x="80" y="108" text-anchor="middle" font-size="78">${emoji}</text>`, color);
const replacements = {
  'body:0': '🧑‍🦱', 'food:0': '🍚', 'home:0': '🧊', 'routines:0': '🪥', 'weather:0': '🌧️', 'greetings:0': '👋', 'clothes:0': '👕', 'toys:0': '⚽',
};
for (const [key, emoji] of Object.entries(replacements)) { const [theme, index] = key.split(':'); if (builtInThemes[theme]?.images[index]) builtInThemes[theme].images[index].src = clearIcon(emoji); }
builtInThemes.body.images[0].src = clearIcon('🧠');
builtInThemes.home.images[0].src = svg('<rect x="42" y="28" width="76" height="108" rx="8" fill="#b9e1ef" stroke="#527d90" stroke-width="5"/><line x1="80" y1="30" x2="80" y2="134" stroke="#527d90" stroke-width="4"/><circle cx="67" cy="76" r="3" fill="#527d90"/><circle cx="93" cy="76" r="3" fill="#527d90"/>', '#f7fbff');
const animalIcons = ['🦋','🐟','🐛','🐸','🐔','🦢','🐑','🦒','🐒','🐢','🐎','🐞'];
builtInThemes.animals2.images.forEach((image, index) => { image.src = clearIcon(animalIcons[index]); });
builtInThemes.colors.images = builtInThemes.colors.images.slice(0, 10);
const phraseThemeIds = new Set(['routines', 'greetings', 'feelings', 'requests', 'socialphrases']);
for (const [id, theme] of Object.entries(builtInThemes)) theme.group = phraseThemeIds.has(id) ? '短语' : '单词';
import { preschoolThemes } from './preschool.js';
Object.assign(builtInThemes, preschoolThemes);

const english = { neko: 'Cat', inu: 'Dog', usagi: 'Rabbit', zou: 'Elephant', panda: 'Panda', pengin: 'Penguin', kuruma: 'Car', basu: 'Bus', densha: 'Train', hikouki: 'Airplane', fune: 'Ship', shoberukaa: 'Excavator', ringo: 'Apple', banana: 'Banana', ichigo: 'Strawberry', budou: 'Grapes', suika: 'Watermelon', orenji: 'Orange' };
for (const theme of Object.values(builtInThemes)) {
  for (const image of theme.images) {
    image.english = image.english || english[image.id];
    if (typeof image.audio === 'string') image.audio = { ja: image.audio, en: image.audio.replace(/\.mp3$/, '-en.mp3') };
  }
}
