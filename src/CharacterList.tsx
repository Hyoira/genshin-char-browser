import { useMemo, useState } from 'react';
import characters from './characters.json';
import birthdays from './generated/birthdays.json';
import './App.css';

interface Character {
  id: string;
  name: string;
  rarity: number;
  element: string;
  version: string;
  va: string;
  icon: string;
}

interface BirthdayEntry {
  name: string;
  month: number;
  day: number;
}

const elementsOrder = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro', 'None'];
const elementLabels: Record<string, string> = {
  Pyro: '炎',
  Hydro: '水',
  Electro: '雷',
  Cryo: '氷',
  Anemo: '風',
  Geo: '岩',
  Dendro: '草',
  None: '無'
};

const monthLabels = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// Build birthday lookup map
const birthdayMap = new Map<string, { month: number; day: number }>();
for (const b of birthdays as BirthdayEntry[]) {
  if (b.month > 0 && b.day > 0) {
    birthdayMap.set(b.name, { month: b.month, day: b.day });
  }
}

export default function CharacterList() {
  const [sortKey, setSortKey] = useState<'rarity' | 'element' | 'version' | 'birthday'>('rarity');

  const grouped = useMemo(() => {
    const list = [...(characters as Character[])];
    
    if (sortKey === 'rarity') {
      list.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    } else if (sortKey === 'element') {
      list.sort((a, b) => {
        const ea = elementsOrder.indexOf(a.element);
        const eb = elementsOrder.indexOf(b.element);
        if (ea !== eb) return ea - eb;
        return b.rarity - a.rarity || a.name.localeCompare(b.name);
      });
    } else if (sortKey === 'version') {
      list.sort((a, b) => {
        const va = parseFloat(a.version) || 0;
        const vb = parseFloat(b.version) || 0;
        return vb - va || b.rarity - a.rarity;
      });
    } else if (sortKey === 'birthday') {
      // Sort by month, then day
      list.sort((a, b) => {
        const ba = birthdayMap.get(a.name);
        const bb = birthdayMap.get(b.name);
        const ma = ba?.month ?? 99;
        const mb = bb?.month ?? 99;
        if (ma !== mb) return ma - mb;
        const da = ba?.day ?? 99;
        const db = bb?.day ?? 99;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name);
      });
    }

    const groups = new Map<string, Character[]>();
    for (const ch of list) {
      let key = '';
      if (sortKey === 'rarity') key = `★${ch.rarity}`;
      else if (sortKey === 'element') key = elementLabels[ch.element] || ch.element;
      else if (sortKey === 'version') key = `Ver. ${ch.version}`;
      else if (sortKey === 'birthday') {
        const bd = birthdayMap.get(ch.name);
        key = bd ? monthLabels[bd.month] : '不明';
      }

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ch);
    }
    return Array.from(groups.entries());
  }, [sortKey]);

  const getBirthdayLabel = (name: string) => {
    const bd = birthdayMap.get(name);
    if (!bd) return null;
    return `${bd.month}/${bd.day}`;
  };

  return (
    <div className="character-list">
      <div className="controls">
        <span>並び替え: </span>
        <button onClick={() => setSortKey('rarity')} className={sortKey === 'rarity' ? 'active' : ''}>レアリティ</button>
        <button onClick={() => setSortKey('element')} className={sortKey === 'element' ? 'active' : ''}>元素</button>
        <button onClick={() => setSortKey('version')} className={sortKey === 'version' ? 'active' : ''}>実装バージョン</button>
        <button onClick={() => setSortKey('birthday')} className={sortKey === 'birthday' ? 'active' : ''}>誕生日</button>
      </div>
      <div className="groups">
        {grouped.map(([label, chars]) => (
          <section key={label} className="group">
            <h2>{label} <span className="count">({chars.length})</span></h2>
            <div className="cards">
              {chars.map((ch) => (
                <div key={ch.id} className={`card element-${ch.element.toLowerCase()} rarity-${ch.rarity}`}>
                  <div className="card-bg"></div>
                  <div className="icon-wrapper">
                    {ch.icon ? 
                      <img src={ch.icon} alt={ch.name} loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> 
                      : <div className="no-icon">?</div>
                    }
                  </div>
                  <div className="content">
                    <div className="name">{ch.name}</div>
                    {sortKey === 'birthday' ? (
                      <div className="birthday-display">{getBirthdayLabel(ch.name) || '?'}</div>
                    ) : (
                      <>
                        <div className="meta">
                          <span className="stars">{'★'.repeat(ch.rarity)}</span>
                          <span className="ver">v{ch.version}</span>
                        </div>
                        <div className="va">{ch.va}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
