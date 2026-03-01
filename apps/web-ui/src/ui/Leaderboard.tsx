import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, ApiError } from '@api/client';
import type { LeaderboardEntry } from '@api/client';

interface LeaderboardProps {
  onBack: () => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  gap: '16px',
  padding: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#4488ff',
  letterSpacing: '4px',
  marginBottom: '16px',
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  maxWidth: '600px',
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  borderBottom: '2px solid #4488ff',
  color: '#aabbcc',
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #222244',
  color: '#ccccee',
  fontSize: '14px',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: '#1a1a3a',
  border: '2px solid #555588',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '16px',
};

const loadingStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#8888aa',
};

const errorStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#ff6666',
  textAlign: 'center',
};

const emptyStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#666688',
  fontStyle: 'italic',
};

function Leaderboard({ onBack }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard(20);
      setEntries(data.entries);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load leaderboard.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>LEADERBOARD</h1>

      {loading && <p style={loadingStyle}>Loading...</p>}

      {error && (
        <div>
          <p style={errorStyle}>{error}</p>
          <button style={buttonStyle} onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p style={emptyStyle}>No scores yet. Be the first to play!</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Player</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.id ?? index}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}>{entry.player_name}</td>
                <td style={tdStyle}>{entry.score}</td>
                <td style={tdStyle}>{entry.level_reached}</td>
                <td style={tdStyle}>{formatDate(entry.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button style={buttonStyle} onClick={onBack}>
        Back to Menu
      </button>
    </div>
  );
}

export default Leaderboard;
