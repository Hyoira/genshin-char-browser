import { useMemo } from 'react';
import birthdays from './generated/birthdays.json';

interface BirthdayCharacter {
  name: string;
  month: number;
  day: number;
  icon?: string;
  rarity?: number;
  element?: string;
}

export default function BirthdayList() {
  const currentMonth = new Date().getMonth() + 1;

  const birthdayCharacters = useMemo(() => {
    return (birthdays as BirthdayCharacter[]).filter(c => c.month === currentMonth);
  }, [currentMonth]);

  return (
    <div className="birthday-list">
      <h2>{currentMonth}月の誕生日キャラクター</h2>
      
      {birthdayCharacters.length === 0 ? (
        <p>今月誕生日のキャラクターはいません。</p>
      ) : (
        <div className="cards">
          {birthdayCharacters.map((ch) => (
            <div key={ch.name} className={`card element-${ch.element?.toLowerCase()} rarity-${ch.rarity}`}>
              <div className="card-bg"></div>
              <div className="icon-wrapper">
                {ch.icon ? 
                  <img src={ch.icon} alt={ch.name} loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> 
                  : <div className="no-icon">?</div>
                }
              </div>
              <div className="content">
                <div className="name">{ch.name}</div>
                <div className="meta">
                  <span className="birthday-date">{ch.month}月{ch.day}日</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .birthday-date {
            font-size: 0.9rem;
            color: #ffd700;
            font-weight: bold;
            width: 100%;
            text-align: center;
        }
      `}</style>
    </div>
  );
}
