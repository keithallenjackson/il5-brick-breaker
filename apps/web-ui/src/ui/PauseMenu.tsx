interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#ffffff',
  marginBottom: '24px',
  letterSpacing: '6px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#2255aa',
  border: '2px solid #4488ff',
  borderRadius: '8px',
  cursor: 'pointer',
  minWidth: '180px',
};

const secondaryStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1a1a3a',
  border: '2px solid #555588',
};

const dangerStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#552222',
  border: '2px solid #884444',
};

function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <div style={overlayStyle}>
      <h2 style={titleStyle}>PAUSED</h2>
      <button style={buttonStyle} onClick={onResume}>
        Resume
      </button>
      <button style={secondaryStyle} onClick={onRestart}>
        Restart
      </button>
      <button style={dangerStyle} onClick={onQuit}>
        Quit to Menu
      </button>
    </div>
  );
}

export default PauseMenu;
