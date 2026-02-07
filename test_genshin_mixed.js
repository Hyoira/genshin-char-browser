import genshin from 'genshin-db';
import fs from 'fs';

genshin.setOptions({ resultLanguage: 'Japanese' });
const dbNames = genshin.characters('names', { matchCategories: true });

const jsonContent = fs.readFileSync('genshin-char-browser/src/characters.json', 'utf8');
const jsonData = JSON.parse(jsonContent);
const jsonNames = jsonData.map(c => c.name);

const missingInJson = dbNames.filter(n => !jsonNames.includes(n));
const missingInDb = jsonNames.filter(n => !dbNames.includes(n));

console.log('In DB but not JSON:', missingInJson.length);
if (missingInJson.length > 0) console.log(missingInJson.slice(0, 5));

console.log('In JSON but not DB:', missingInDb.length);
if (missingInDb.length > 0) console.log(missingInDb.slice(0, 5));
