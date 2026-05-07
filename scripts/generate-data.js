import fs from 'fs';
import path from 'path';
import genshin from 'genshin-db';
import characters from '../src/characters.json' with { type: 'json' };

const WIKI_URL = 'https://wikiwiki.jp/genshinwiki/%E5%B9%BB%E6%83%B3%E3%82%B7%E3%82%A2%E3%82%BF%E3%83%BC';

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

async function fetchTheaterPoses(charNames) {
  const res = await fetch(WIKI_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; genshin-char-browser/1.0)',
      'Accept': 'text/html',
      'Accept-Language': 'ja,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // wikiwiki uses: <a class="anchor_super" name ="rewardpose">
  const anchorIdx = html.search(/name\s*=\s*["']rewardpose["']/i);
  if (anchorIdx === -1) throw new Error('rewardpose anchor not found');

  const sectionHtml = html.slice(anchorIdx);
  const charSet = new Set(charNames);
  const posesMap = new Map();

  // Each data cell is: <td><strong>キャラ名</strong><br class="spacer">ポーズ名</td>
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let tdMatch;
  while ((tdMatch = tdRegex.exec(sectionHtml)) !== null) {
    const tdHtml = tdMatch[1];

    const strongMatch = tdHtml.match(/<strong>([\s\S]*?)<\/strong>/i);
    if (!strongMatch) continue;
    const charName = stripHtml(strongMatch[1]);
    if (!charSet.has(charName)) continue;

    // Pose name is the text after the first <br>
    const brIdx = tdHtml.indexOf('<br');
    if (brIdx === -1) continue;
    const afterBr = tdHtml.slice(tdHtml.indexOf('>', brIdx) + 1);
    const poseName = stripHtml(afterBr);
    if (!poseName || poseName === 'xxxx') continue;

    if (!posesMap.has(charName)) posesMap.set(charName, new Set());
    posesMap.get(charName).add(poseName);
  }

  return Array.from(posesMap.entries()).map(([name, poses]) => ({ name, poses: Array.from(poses) }));
}

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

// 3. Theater Poses (wiki scraping)
console.log('Fetching theater poses from wiki...');
try {
  const theaterPoses = await fetchTheaterPoses(characters.map(c => c.name));
  if (theaterPoses.length < 40) {
    console.warn(`Only ${theaterPoses.length} pose entries found — keeping existing theater-poses.json`);
  } else {
    fs.writeFileSync(path.join(OUTPUT_DIR, 'theater-poses.json'), JSON.stringify(theaterPoses, null, 2));
    console.log(`Saved ${theaterPoses.length} theater pose entries.`);
  }
} catch (err) {
  console.warn(`Could not fetch theater poses: ${err.message} — keeping existing file`);
}
