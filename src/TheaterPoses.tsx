import { useMemo, useState } from 'react';
import characters from './characters.json';
import theaterPosesData from './generated/theater-poses.json';
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

interface PoseEntry {
  name: string;
  poses: string[];
}

const poseMap = new Map<string, string[]>();
for (const entry of theaterPosesData as PoseEntry[]) {
  poseMap.set(entry.name, entry.poses);
}

type Filter = 'all' | 'with' | 'without';

export default function TheaterPoses() {
  const [filter, setFilter] = useState<Filter>('all');

  const charList = useMemo(() => {
    let list = [...(characters as Character[])];
    if (filter === 'with') {
      list = list.filter(ch => (poseMap.get(ch.name)?.length ?? 0) > 0);
    } else if (filter === 'without') {
      list = list.filter(ch => !poseMap.has(ch.name));
    }
    list.sort((a, b) => {
      const pa = poseMap.get(a.name)?.length ?? 0;
      const pb = poseMap.get(b.name)?.length ?? 0;
      if (pa !== pb) return pb - pa;
      return b.rarity - a.rarity || a.name.localeCompare(b.name);
    });
    return list;
  }, [filter]);

  const total = (characters as Character[]).length;
  const withPose = (characters as Character[]).filter(ch => poseMap.has(ch.name)).length;
  const multiPose = theaterPosesData.filter(e => e.poses.length > 1).length;

  return (
    <div className="theater-poses">
      <div className="theater-stats">
        ポーズあり: <strong>{withPose}</strong> / 全{total}キャラ
        　複数ポーズ: <strong>{multiPose}</strong>キャラ
      </div>
      <div className="controls">
        <span>絞り込み: </span>
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>全員</button>
        <button onClick={() => setFilter('with')} className={filter === 'with' ? 'active' : ''}>ポーズあり</button>
        <button onClick={() => setFilter('without')} className={filter === 'without' ? 'active' : ''}>ポーズなし</button>
      </div>
      <div className="pose-char-grid">
        {charList.map(ch => {
          const poses = poseMap.get(ch.name) ?? [];
          const hasPose = poses.length > 0;
          const isMulti = poses.length > 1;
          return (
            <div
              key={ch.id}
              className={[
                'pose-char-card',
                `element-${ch.element.toLowerCase()}`,
                `rarity-${ch.rarity}`,
                !hasPose ? 'no-pose' : '',
                isMulti ? 'multi-pose' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="icon-wrapper">
                {ch.icon
                  ? <img src={ch.icon} alt={ch.name} loading="lazy" onError={e => (e.currentTarget.style.display = 'none')} />
                  : <div className="no-icon">?</div>
                }
              </div>
              <div className="pose-card-content">
                <div className="name">{ch.name}</div>
                {hasPose ? (
                  <div className="pose-tags">
                    {poses.map(p => <span key={p} className="pose-tag">{p}</span>)}
                  </div>
                ) : (
                  <div className="no-pose-label">なし</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
