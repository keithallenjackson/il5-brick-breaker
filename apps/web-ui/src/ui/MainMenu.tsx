interface MainMenuProps {
  onStart: () => void;
  onLeaderboard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  gap: '16px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#4488ff',
  textShadow: '0 0 20px rgba(68, 136, 255, 0.5)',
  letterSpacing: '4px',
  marginBottom: '4px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6688aa',
  marginBottom: '32px',
  fontStyle: 'italic',
};

const buttonStyle: React.CSSProperties = {
  padding: '14px 40px',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#2255aa',
  border: '2px solid #4488ff',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '200px',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a1a3a',
  border: '2px solid #555588',
  fontSize: '16px',
};

const soundButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  fontSize: '14px',
  color: '#aaaacc',
  backgroundColor: 'transparent',
  border: '1px solid #444466',
  borderRadius: '6px',
  cursor: 'pointer',
  marginTop: '16px',
};

const instructionsStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666688',
  textAlign: 'center',
  marginTop: '24px',
  lineHeight: '1.6',
};

function MainMenu({ onStart, onLeaderboard, soundEnabled, onToggleSound }: MainMenuProps) {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>BRICK BREAKER</h1>
      <p style={subtitleStyle}>IL5 Approved Edition</p>
      <button
        style={buttonStyle}
        onClick={onStart}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#3366cc';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#2255aa';
        }}
      >
        Start Game
      </button>
      <button
        style={secondaryButtonStyle}
        onClick={onLeaderboard}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#2a2a4a';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#1a1a3a';
        }}
      >
        Leaderboard
      </button>
      <button style={soundButtonStyle} onClick={onToggleSound}>
        {soundEnabled ? 'Sound: ON' : 'Sound: OFF'}
      </button>
      <p style={instructionsStyle}>
        Use mouse or arrow keys to move paddle.
        <br />
        Space to launch ball.
      </p>
    </div>
  );
}

export default MainMenu;
