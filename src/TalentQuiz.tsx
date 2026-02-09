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
  showHint: boolean;
}

type QuizMode = 'skill' | 'burst';

const MAX_QUESTIONS = 10;

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
  
  // Game State
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [isFinished, setIsFinished] = useState(false);

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

    setQuiz({
      options,
      answer: answerChar.name,
      talentIcon: talent.icon,
      talentName: talent.name,
      element,
      answered: false,
      selected: null,
      showHint: false
    });
    
    setLoading(false);
  }, [mode]);

  // Reset game when mode changes
  useEffect(() => {
    setScore(0);
    setQuestionCount(1);
    setIsFinished(false);
    setQuiz(null);
  }, [mode]);

  // Initial load
  useEffect(() => {
    if (!quiz && !isFinished) generateQuiz();
  }, [generateQuiz, quiz, isFinished]);

  const handleAnswer = (option: string) => {
    if (quiz?.answered || isFinished) return;
    
    const isCorrect = option === quiz?.answer;
    
    setQuiz(prev => prev ? {
      ...prev,
      answered: true,
      selected: option
    } : null);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (questionCount >= MAX_QUESTIONS) {
      setIsFinished(true);
    } else {
      setQuestionCount(prev => prev + 1);
      generateQuiz();
    }
  };

  const restartGame = () => {
    setScore(0);
    setQuestionCount(1);
    setIsFinished(false);
    setQuiz(null); // Triggers generateQuiz via useEffect
  };

  const handleModeChange = (newMode: QuizMode) => {
    setMode(newMode);
    // useEffect handles reset
  };

  const showHint = () => {
    setQuiz(prev => prev ? { ...prev, showHint: true } : null);
  };

  if (isFinished) {
    return (
      <div className="talent-quiz result-screen">
        <div className="quiz-card">
          <h2>🎉 結果発表 🎉</h2>
          <div className="final-score">
            {score} / {MAX_QUESTIONS}
          </div>
          <div className="result-comment">
            {score === MAX_QUESTIONS ? '素晴らしい！全問正解です！🏆' :
             score >= MAX_QUESTIONS * 0.8 ? '惜しい！あと少しです！✨' :
             score >= MAX_QUESTIONS * 0.5 ? 'ナイスファイト！👍' :
             'まだまだ修行が必要ですね...💪'}
          </div>
          <button className="restart-btn" onClick={restartGame}>もう一度挑戦する</button>
        </div>
        <style>{`
          .talent-quiz { max-width: 600px; margin: 0 auto; }
          .quiz-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          .final-score {
            font-size: 3rem;
            font-weight: bold;
            color: #646cff;
          }
          .result-comment { font-size: 1.2rem; color: #ddd; }
          .restart-btn {
            padding: 0.8rem 2rem;
            font-size: 1.1rem;
            background: #646cff;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .restart-btn:hover { background: #535bf2; }
        `}</style>
      </div>
    );
  }

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
        問題: {questionCount} / {MAX_QUESTIONS} | スコア: {score}
      </div>

      <div className="quiz-card">
        {quiz.answered && (
          <button className="next-btn top" onClick={nextQuestion}>
            {questionCount >= MAX_QUESTIONS ? '結果を見る' : '次の問題へ'}
          </button>
        )}

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
      </div>

      <style>{`
        .talent-quiz {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mode-selector {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
        }
        .mode-selector button {
          padding: 0.5rem 1rem;
          font-size: 0.95rem;
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
            font-size: 1rem;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            padding: 0 1rem;
        }
        .quiz-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 1.2rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .quiz-card h2 {
            font-size: 1.2rem;
            margin: 0;
        }
        .quiz-image {
            width: 100px;
            height: 100px;
            background: rgba(0,0,0,0.2);
            border-radius: 50%;
            padding: 8px;
            border: 2px solid #444;
            transition: all 0.3s;
        }
        .quiz-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .hint-btn {
            padding: 0.4rem 1rem;
            font-size: 0.9rem;
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
            font-size: 1rem;
            font-weight: bold;
            padding: 0.3rem 0.8rem;
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
        }
        .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
            width: 100%;
        }
        .option-btn {
            padding: 0.8rem;
            font-size: 1rem;
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
            font-size: 1.1rem;
            font-weight: bold;
            padding: 0.5rem;
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
            font-size: 0.8rem;
            font-weight: normal;
            margin-top: 0.2rem;
            color: #aaa;
        }
        .element-info {
            font-size: 0.8rem;
            font-weight: normal;
            margin-top: 0.1rem;
        }
        .next-btn {
            padding: 0.6rem 1.5rem;
            font-size: 1rem;
            background: #646cff;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
        }
        .next-btn.top {
            margin-bottom: 0.5rem;
        }
        .next-btn:hover {
            background: #535bf2;
        }
      `}</style>
    </div>
  );
}