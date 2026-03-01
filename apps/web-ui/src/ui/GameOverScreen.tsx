import { useState, useCallback } from 'react';
import { submitScore, ApiError } from '@api/client';

interface GameOverScreenProps {
  score: number;
  level: number;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  gap: '12px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '42px',
  fontWeight: 'bold',
  color: '#ff4444',
  textShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
  letterSpacing: '4px',
  marginBottom: '8px',
};

const statStyle: React.CSSProperties = {
  fontSize: '20px',
  color: '#ccccee',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  margin: '16px 0',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '16px',
  backgroundColor: '#1a1a3a',
  color: '#ffffff',
  border: '2px solid #4488ff',
  borderRadius: '6px',
  width: '240px',
  textAlign: 'center',
};

const submitButtonStyle: React.CSSProperties = {
  padding: '10px 32px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#2255aa',
  border: '2px solid #4488ff',
  borderRadius: '8px',
  cursor: 'pointer',
  minWidth: '200px',
};

const disabledButtonStyle: React.CSSProperties = {
  ...submitButtonStyle,
  backgroundColor: '#333355',
  border: '2px solid #555577',
  cursor: 'not-allowed',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#2255aa',
  border: '2px solid #4488ff',
  borderRadius: '8px',
  cursor: 'pointer',
  minWidth: '200px',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  backgroundColor: '#1a1a3a',
  border: '2px solid #555588',
};

const errorStyle: React.CSSProperties = {
  color: '#ff6666',
  fontSize: '13px',
  maxWidth: '300px',
  textAlign: 'center',
};

const successStyle: React.CSSProperties = {
  color: '#44ff44',
  fontSize: '14px',
};

const NAME_PATTERN = /^[a-zA-Z0-9_\-\s]+$/;

function GameOverScreen({ score, level, onPlayAgain, onLeaderboard }: GameOverScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = useCallback((name: string): string => {
    if (!name.trim()) {
      return 'Please enter a name.';
    }
    if (name.length > 50) {
      return 'Name must be 50 characters or fewer.';
    }
    if (!NAME_PATTERN.test(name)) {
      return 'Name can only contain letters, numbers, spaces, hyphens, and underscores.';
    }
    return '';
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationError = validate(playerName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitError('');
    setLoading(true);

    try {
      await submitScore({
        player_name: playerName.trim(),
        score,
        level_reached: level,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to submit score. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [playerName, score, level, validate]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPlayerName(value);
      if (error) {
        setError(validate(value));
      }
    },
    [error, validate]
  );

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>GAME OVER</h1>
      <p style={statStyle}>
        Final Score: <strong>{score}</strong>
      </p>
      <p style={statStyle}>
        Level Reached: <strong>{level}</strong>
      </p>

      {!submitted ? (
        <div style={formStyle}>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={handleNameChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            maxLength={50}
            style={inputStyle}
            disabled={loading}
            aria-label="Player name"
          />
          {error && <p style={errorStyle}>{error}</p>}
          {submitError && <p style={errorStyle}>{submitError}</p>}
          <button
            style={loading ? disabledButtonStyle : submitButtonStyle}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Score'}
          </button>
        </div>
      ) : (
        <p style={successStyle}>Score submitted successfully!</p>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button style={actionButtonStyle} onClick={onPlayAgain}>
          Play Again
        </button>
        <button style={secondaryButtonStyle} onClick={onLeaderboard}>
          View Leaderboard
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
