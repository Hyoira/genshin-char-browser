import fs from 'fs';
import path from 'path';
import genshin from 'genshin-db';
import characters from '../src/characters.json' with { type: 'json' };

const OUTPUT_DIR = 'src/generated';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Generating data...');

// Setup options
genshin.setOptions({ resultLanguage: 'Japanese', queryLanguages: ['Japanese', 'English'] });

// 1. Birthday Data
console.log('Processing birthdays...');
const birthdayData = [];
const allNames = genshin.characters('names', { matchCategories: true });

for (const name of allNames) {
  const char = genshin.characters(name);
  if (!char || !char.birthdaymmdd) continue;

  const [m, d] = char.birthdaymmdd.split('/').map(Number);
  
  // Find matching visual data from characters.json
  const visualData = characters.find(c => c.name === name);
  
  // Try to find icon
  let icon = visualData?.icon;
  if (!icon && char.images) {
      const imgs = char.images;
      icon = imgs.mihoyo_icon || imgs.hoyowiki_icon || imgs.icon;
  }

  birthdayData.push({
    name,
    month: m,
    day: d,
    icon,
    rarity: visualData?.rarity || char.rarity,
    element: visualData?.element || char.elementText
  });
}

// Sort by month then day
birthdayData.sort((a, b) => (a.month - b.month) || (a.day - b.day));

fs.writeFileSync(path.join(OUTPUT_DIR, 'birthdays.json'), JSON.stringify(birthdayData, null, 2));
console.log(`Saved ${birthdayData.length} birthday entries.`);

// 2. Talent Quiz Data
console.log('Processing talent quiz...');
const quizData = [];
const quizCandidates = characters
    .map(c => c.name)
    .filter(n => !['空', '蛍', '旅人', 'アーロイ'].includes(n));

for (const name of quizCandidates) {
    const t = genshin.talents(name);
    if (!t) {
        console.warn(`Skipping ${name}: No talent data found.`);
        continue;
    }

    const talents = [];
    ['combat1', 'combat2', 'combat3'].forEach(key => {
        const talent = t[key];
        if (!talent) return;
        
        let filename = '';
        if (t.images && t.images[`filename_${key}`]) {
            filename = t.images[`filename_${key}`];
        }

        if (filename) {
            talents.push({
                name: talent.name,
                icon: `https://enka.network/ui/${filename}.png`,
                type: key
            });
        }
    });

    if (talents.length > 0) {
        // Find matching character metadata for element hint
        const charMeta = characters.find(c => c.name === name);
        quizData.push({
            name,
            element: charMeta?.element || 'None',
            talents
        });
    }
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'quiz-talents.json'), JSON.stringify(quizData, null, 2));
console.log(`Saved ${quizData.length} characters for quiz.`);
