import genshin from 'genshin-db';

genshin.setOptions({ resultLanguage: 'Japanese' });
console.log('Amber (JP):', genshin.characters('Amber').name);
console.log('Bennett (JP):', genshin.characters('Bennett').name);

// Get all characters in Japanese
const jpNames = genshin.characters('names', { matchCategories: true });
console.log('First 5 JP names:', jpNames.slice(0, 5));
