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

const english = { neko: 'Cat', inu: 'Dog', usagi: 'Rabbit', zou: 'Elephant', panda: 'Panda', pengin: 'Penguin', kuruma: 'Car', basu: 'Bus', densha: 'Train', hikouki: 'Airplane', fune: 'Ship', shoberukaa: 'Excavator', ringo: 'Apple', banana: 'Banana', ichigo: 'Strawberry', budou: 'Grapes', suika: 'Watermelon', orenji: 'Orange' };
for (const theme of Object.values(builtInThemes)) {
  for (const image of theme.images) {
    image.english = english[image.id];
    image.audio = { ja: image.audio, en: image.audio.replace(/\.mp3$/, '-en.mp3') };
  }
}
