import genshin from 'genshin-db';

// Set options
genshin.setOptions({ resultLanguage: 'Japanese', queryLanguages: ['Japanese', 'English'] });

const t = genshin.talents('アンバー');
console.log('Result for アンバー:', t ? 'Found' : 'Not Found');

if (t) {
  console.log('Images:', t.images);
  console.log('Combat1:', t.combat1);
}

const tEn = genshin.talents('Amber');
console.log('Result for Amber:', tEn ? 'Found' : 'Not Found');
if (tEn) {
    console.log('Images (Amber):', tEn.images);
}
