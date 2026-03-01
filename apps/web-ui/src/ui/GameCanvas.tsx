import { useRef, useEffect } from 'react';
import { GameEngine } from '@game/GameEngine';

interface GameCanvasProps {
  onGameOver: (score: number, level: number) => void;
  soundEnabled: boolean;
}

function GameCanvas({ onGameOver, soundEnabled }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    const engine = new GameEngine(container);
    engineRef.current = engine;

    const setup = async () => {
      await engine.init();
      if (destroyed) {
        engine.destroy();
        return;
      }
      engine.setOnGameOver(onGameOver);
      engine.setSoundEnabled(soundEnabled);
      engine.start();
    };

    setup();

    return () => {
      destroyed = true;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [onGameOver, soundEnabled]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        maxWidth: '800px',
        maxHeight: '600px',
      }}
    />
  );
}

export default GameCanvas;
