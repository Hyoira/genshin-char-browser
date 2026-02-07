import genshin from 'genshin-db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 元素タイプのマッピング
const elementMap = {
    'ELEMENT_PYRO': 'Pyro',
    'ELEMENT_HYDRO': 'Hydro',
    'ELEMENT_ANEMO': 'Anemo',
    'ELEMENT_ELECTRO': 'Electro',
    'ELEMENT_DENDRO': 'Dendro',
    'ELEMENT_CRYO': 'Cryo',
    'ELEMENT_GEO': 'Geo',
    'ELEMENT_NONE': 'None'
};

// 日本語データを取得する設定
genshin.setOptions({ queryLanguages: ['Japanese'], resultLanguage: 'Japanese' });

// 全キャラクター名（日本語）を取得
const names = genshin.characters('names', { matchCategories: true });

console.log(`Fetching data for ${names.length} characters...`);

const characters = [];

for (const name of names) {
    const char = genshin.characters(name);
    if (!char) {
        console.warn(`Skipping ${name}: No data found.`);
        continue;
    }

    // 元素名の変換
    const element = elementMap[char.elementType] || 'None';
    
    // アイコンURLの優先順位
    let icon = char.images?.mihoyo_icon || char.images?.icon || char.images?.mihoyo_sideIcon || '';
    
    // データ構築
    const data = {
        id: String(char.id),
        name: char.name,
        rarity: Number(char.rarity),
        element: element,
        version: char.version,
        va: char.cv?.japanese || 'Unknown',
        icon: icon
    };

    characters.push(data);
}

// データ書き出し
const outputPath = path.resolve(__dirname, 'src/characters.json');
fs.writeFileSync(outputPath, JSON.stringify(characters, null, 2));

console.log(`Successfully wrote ${characters.length} characters to ${outputPath}`);
