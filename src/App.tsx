import { useState, Suspense, lazy } from 'react';
import CharacterList from './CharacterList';
import './App.css';

// Lazy load heavy components
const TalentQuiz = lazy(() => import('./TalentQuiz'));
const TheaterPoses = lazy(() => import('./TheaterPoses'));

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'quiz' | 'theater'>('list');

  return (
    <div className="app">
      <header>
        <h1>Teyvat Index</h1>
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
          <button
            className={activeTab === 'theater' ? 'active' : ''}
            onClick={() => setActiveTab('theater')}
          >
            幻想シアター
          </button>
        </nav>
      </header>

      <main>
        <Suspense fallback={<div className="loading">読み込み中...</div>}>
          {activeTab === 'list' && <CharacterList />}
          {activeTab === 'quiz' && <TalentQuiz />}
          {activeTab === 'theater' && <TheaterPoses />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
