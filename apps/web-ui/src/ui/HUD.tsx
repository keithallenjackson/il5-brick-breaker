import type { GameState } from '@game/GameState';

interface HUDProps {
  state: GameState;
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 16px',
};

const leftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const rightStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '4px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#ffffff',
  background: 'rgba(0, 0, 0, 0.5)',
  padding: '2px 8px',
  borderRadius: '4px',
};

const livesStyle: React.CSSProperties = {
  ...labelStyle,
  color: '#ff4444',
  fontSize: '18px',
  letterSpacing: '4px',
};

const powerUpStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#88ffff',
  background: 'rgba(0, 0, 0, 0.4)',
  padding: '2px 6px',
  borderRadius: '3px',
};

function HUD({ state }: HUDProps) {
  const hearts = '\u2665'.repeat(Math.max(0, state.lives));

  return (
    <div style={containerStyle}>
      <div style={leftStyle}>
        <span style={labelStyle}>Score: {state.score}</span>
        <span style={labelStyle}>Level: {state.level}</span>
      </div>
      <div style={rightStyle}>
        <span style={livesStyle}>{hearts}</span>
        {state.activePowerUps.map((p, i) => (
          <span key={`${p.type}-${i}`} style={powerUpStyle}>
            {p.type} {Math.ceil(p.remainingMs / 1000)}s
          </span>
        ))}
      </div>
    </div>
  );
}

export default HUD;
