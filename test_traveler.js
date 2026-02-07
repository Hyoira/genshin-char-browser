import genshin from 'genshin-db';

genshin.setOptions({ resultLanguage: 'Japanese', queryLanguages: ['Japanese', 'English'] });
const t = genshin.talents('空');
console.log('Result for 空:', t ? 'Found' : 'Not Found');
if (t) console.log(t.images);
