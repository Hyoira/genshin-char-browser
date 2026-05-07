import { useMemo, useState, useRef, useEffect } from 'react';
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

interface ContextMenuState {
  x: number;
  y: number;
  character: Character;
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

const birthdayMap = new Map<string, { month: number; day: number }>();
for (const b of birthdays as BirthdayEntry[]) {
  if (b.month > 0 && b.day > 0) {
    birthdayMap.set(b.name, { month: b.month, day: b.day });
  }
}

const getGachaUrl = (iconUrl: string) =>
  iconUrl.replace('UI_AvatarIcon_', 'UI_Gacha_AvatarImg_');

const downloadImage = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
};

const copyImageToClipboard = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
  return 'コピーしました';
};

export default function CharacterList() {
  const [sortKey, setSortKey] = useState<'rarity' | 'element' | 'version' | 'birthday'>('rarity');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const openMenu = (clientX: number, clientY: number, ch: Character) => {
    const menuW = 200;
    const menuH = 170;
    const x = Math.min(clientX, window.innerWidth - menuW - 8);
    const y = Math.min(clientY, window.innerHeight - menuH - 8);
    setContextMenu({ x, y, character: ch });
  };

  const handleContextMenu = (e: React.MouseEvent, ch: Character) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY, ch);
  };

  const handleTouchStart = (e: React.TouchEvent, ch: Character) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY, ch);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMenuAction = async (action: () => Promise<string>) => {
    setContextMenu(null);
    try {
      const msg = await action();
      showToast(msg);
    } catch {
      showToast('操作に失敗しました');
    }
  };

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
                <div
                  key={ch.id}
                  className={`card element-${ch.element.toLowerCase()} rarity-${ch.rarity}`}
                  onContextMenu={(e) => handleContextMenu(e, ch)}
                  onTouchStart={(e) => handleTouchStart(e, ch)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
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

      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-header">{contextMenu.character.name}</div>
          {contextMenu.character.icon && (
            <>
              <button onClick={() => handleMenuAction(() => downloadImage(contextMenu.character.icon, `${contextMenu.character.name}_icon.png`).then(() => 'ダウンロードしました'))}>
                アイコンをダウンロード
              </button>
              <button onClick={() => handleMenuAction(() => copyImageToClipboard(contextMenu.character.icon))}>
                アイコンをコピー
              </button>
              <button onClick={() => handleMenuAction(() => downloadImage(getGachaUrl(contextMenu.character.icon), `${contextMenu.character.name}_gacha.png`).then(() => 'ダウンロードしました'))}>
                全身立ち絵をダウンロード
              </button>
              <button onClick={() => handleMenuAction(() => copyImageToClipboard(getGachaUrl(contextMenu.character.icon)))}>
                全身立ち絵をコピー
              </button>
            </>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
