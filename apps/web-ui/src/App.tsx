import { useState, useCallback } from 'react';
import GameCanvas from '@ui/GameCanvas';
import MainMenu from '@ui/MainMenu';
import GameOverScreen from '@ui/GameOverScreen';
import Leaderboard from '@ui/Leaderboard';

type AppScreen = 'menu' | 'playing' | 'gameOver' | 'leaderboard';

interface GameResult {
  score: number;
  level: number;
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, level: 1 });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleStartGame = useCallback(() => {
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number, level: number) => {
    setGameResult({ score, level });
    setScreen('gameOver');
  }, []);

  const handleShowLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {screen === 'menu' && (
        <MainMenu
          onStart={handleStartGame}
          onLeaderboard={handleShowLeaderboard}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}
      {screen === 'playing' && (
        <GameCanvas
          onGameOver={handleGameOver}
          soundEnabled={soundEnabled}
        />
      )}
      {screen === 'gameOver' && (
        <GameOverScreen
          score={gameResult.score}
          level={gameResult.level}
          onPlayAgain={handleStartGame}
          onLeaderboard={handleShowLeaderboard}
        />
      )}
      {screen === 'leaderboard' && (
        <Leaderboard onBack={handleBackToMenu} />
      )}
    </div>
  );
}

export default App;
