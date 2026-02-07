import { useState, useEffect, useCallback } from 'react';
import quizData from './generated/quiz-talents.json';
import characters from './characters.json';

interface Talent {
  name: string;
  icon: string;
  type: string;
}

interface QuizCharacter {
  name: string;
  talents: Talent[];
}

interface QuizState {
  options: string[];
  answer: string;
  talentIcon: string;
  talentName: string;
  element: string;
  answered: boolean;
  selected: string | null;
  score: number;
  total: number;
  showHint: boolean;
}

type QuizMode = 'skill' | 'burst';

const elementColors: Record<string, string> = {
  Pyro: '#ff6b6b',
  Hydro: '#4cc3f8',
  Electro: '#ae68ff',
  Cryo: '#a0e6ff',
  Anemo: '#70e6d6',
  Geo: '#f8d66d',
  Dendro: '#80d64d',
  None: '#888'
};

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

export default function TalentQuiz() {
  const [mode, setMode] = useState<QuizMode>('skill');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = useCallback(() => {
    setLoading(true);
    
    // Filter characters that have the selected talent type
    const talentType = mode === 'skill' ? 'combat2' : 'combat3';
    const availableChars = (quizData as QuizCharacter[])
      .map(char => ({
        ...char,
        talents: char.talents.filter(t => t.type === talentType)
      }))
      .filter(char => char.talents.length > 0);

    if (availableChars.length < 4) {
      setLoading(false);
      return;
    }

    // Pick a random character
    const answerChar = availableChars[Math.floor(Math.random() * availableChars.length)];
    
    // Pick a random talent (should be only one of the selected type)
    const talent = answerChar.talents[Math.floor(Math.random() * answerChar.talents.length)];
    
    // Get element from characters.json
    const charData = characters.find(c => c.name === answerChar.name);
    const element = charData?.element || 'None';
    
    // Pick 3 wrong options
    const wrongOptions = new Set<string>();
    while (wrongOptions.size < 3) {
      const r = availableChars[Math.floor(Math.random() * availableChars.length)];
      if (r.name !== answerChar.name) wrongOptions.add(r.name);
    }
    
    const options = [...wrongOptions, answerChar.name].sort(() => Math.random() - 0.5);

    setQuiz(prev => ({
      options,
      answer: answerChar.name,
      talentIcon: talent.icon,
      talentName: talent.name,
      element,
      answered: false,
      selected: null,
      showHint: false,
      score: prev && prev.total > 0 ? prev.score : 0,
      total: prev && prev.total > 0 ? prev.total : 0
    }));
    
    setLoading(false);
  }, [mode]);

  // Reset quiz when mode changes
  useEffect(() => {
    setQuiz(null);
  }, [mode]);

  // Initial load
  useEffect(() => {
    if (!quiz) generateQuiz();
  }, [generateQuiz, quiz]);

  const handleAnswer = (option: string) => {
    if (quiz?.answered) return;
    
    const isCorrect = option === quiz?.answer;
    setQuiz(prev => prev ? {
      ...prev,
      answered: true,
      selected: option,
      score: isCorrect ? prev.score + 1 : prev.score,
      total: prev.total + 1
    } : null);
  };

  const nextQuestion = () => {
    generateQuiz();
  };

  const handleModeChange = (newMode: QuizMode) => {
    setMode(newMode);
    setQuiz(null);
  };

  const showHint = () => {
    setQuiz(prev => prev ? { ...prev, showHint: true } : null);
  };

  if (!quiz || loading) return <div className="quiz-loading">読み込み中...</div>;

  return (
    <div className="talent-quiz">
      <div className="mode-selector">
        <button 
          className={mode === 'skill' ? 'active' : ''} 
          onClick={() => handleModeChange('skill')}
        >
          元素スキル
        </button>
        <button 
          className={mode === 'burst' ? 'active' : ''} 
          onClick={() => handleModeChange('burst')}
        >
          元素爆発
        </button>
      </div>

      <div className="score-board">
        スコア: {quiz.score} / {quiz.total}
      </div>

      <div className="quiz-card">
        <h2>この{mode === 'skill' ? '元素スキル' : '元素爆発'}は誰のもの？</h2>
        <div 
          className="quiz-image" 
          style={quiz.showHint ? {
            borderColor: elementColors[quiz.element],
            boxShadow: `0 0 20px ${elementColors[quiz.element]}`
          } : {}}
        >
            <img src={quiz.talentIcon} alt="Talent" />
        </div>
        
        {quiz.showHint && !quiz.answered && (
          <div className="hint-display" style={{ color: elementColors[quiz.element] }}>
            💡 元素: {elementLabels[quiz.element]}
          </div>
        )}

        {!quiz.answered && !quiz.showHint && (
          <button className="hint-btn" onClick={showHint}>
            💡 ヒントを見る
          </button>
        )}
        
        {quiz.answered && (
            <div className={`result-message ${quiz.selected === quiz.answer ? 'correct' : 'wrong'}`}>
                {quiz.selected === quiz.answer ? '正解！' : `残念... 正解は ${quiz.answer}`}
                <div className="talent-name">天賦名: {quiz.talentName}</div>
                <div className="element-info" style={{ color: elementColors[quiz.element] }}>
                  元素: {elementLabels[quiz.element]}
                </div>
            </div>
        )}

        <div className="options-grid">
          {quiz.options.map(option => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`option-btn 
                ${quiz.answered && option === quiz.answer ? 'correct' : ''}
                ${quiz.answered && option === quiz.selected && option !== quiz.answer ? 'wrong' : ''}
              `}
              disabled={quiz.answered}
            >
              {option}
            </button>
          ))}
        </div>

        {quiz.answered && (
          <button className="next-btn" onClick={nextQuestion}>次の問題へ</button>
        )}
      </div>

      <style>{`
        .talent-quiz {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .mode-selector {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
        }
        .mode-selector button {
          padding: 0.8rem 1.5rem;
          font-size: 1.1rem;
          background: #444;
          color: white;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-selector button:hover {
          background: #555;
        }
        .mode-selector button.active {
          background: #646cff;
          border-color: #535bf2;
        }
        .score-board {
            font-size: 1.2rem;
            font-weight: bold;
        }
        .quiz-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        .quiz-image {
            width: 128px;
            height: 128px;
            background: rgba(0,0,0,0.2);
            border-radius: 50%;
            padding: 10px;
            border: 2px solid #444;
            transition: all 0.3s;
        }
        .quiz-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .hint-btn {
            padding: 0.6rem 1.5rem;
            font-size: 1rem;
            background: #555;
            color: #ffd700;
            border: 2px solid #777;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .hint-btn:hover {
            background: #666;
            border-color: #ffd700;
        }
        .hint-display {
            font-size: 1.2rem;
            font-weight: bold;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
        }
        .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            width: 100%;
        }
        .option-btn {
            padding: 1rem;
            font-size: 1.1rem;
            background: #444;
            color: white;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .option-btn:hover:not(:disabled) {
            background: #555;
            transform: translateY(-2px);
        }
        .option-btn.correct {
            background: #2e7d32;
            border-color: #4caf50;
        }
        .option-btn.wrong {
            background: #c62828;
            border-color: #ef5350;
            opacity: 0.7;
        }
        .result-message {
            font-size: 1.2rem;
            font-weight: bold;
            padding: 1rem;
            border-radius: 8px;
            width: 100%;
            text-align: center;
        }
        .result-message.correct {
            color: #4caf50;
            background: rgba(76, 175, 80, 0.1);
        }
        .result-message.wrong {
            color: #ef5350;
            background: rgba(239, 83, 80, 0.1);
        }
        .talent-name {
            font-size: 0.9rem;
            font-weight: normal;
            margin-top: 0.5rem;
            color: #aaa;
        }
        .element-info {
            font-size: 0.85rem;
            font-weight: normal;
            margin-top: 0.3rem;
        }
        .next-btn {
            padding: 0.8rem 2rem;
            font-size: 1.1rem;
            background: #646cff;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        .next-btn:hover {
            background: #535bf2;
        }
      `}</style>
    </div>
  );
}
