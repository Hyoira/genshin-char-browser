import { useState, Suspense, lazy } from 'react';
import CharacterList from './CharacterList';
import './App.css';

// Lazy load heavy components
const TalentQuiz = lazy(() => import('./TalentQuiz'));

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'quiz'>('list');

  return (
    <div className="app">
      <header>
        <h1>Genshin キャラソートビューワ</h1>
        <nav className="tabs">
          <button 
            className={activeTab === 'list' ? 'active' : ''} 
            onClick={() => setActiveTab('list')}
          >
            キャラ一覧
          </button>
          <button 
            className={activeTab === 'quiz' ? 'active' : ''} 
            onClick={() => setActiveTab('quiz')}
          >
            クイズ
          </button>
        </nav>
      </header>

      <main>
        <Suspense fallback={<div className="loading">読み込み中...</div>}>
          {activeTab === 'list' && <CharacterList />}
          {activeTab === 'quiz' && <TalentQuiz />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
