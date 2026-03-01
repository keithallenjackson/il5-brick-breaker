import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Leaderboard from '../../src/ui/Leaderboard';

const mockGetLeaderboard = vi.fn();

vi.mock('../../src/api/client', () => ({
  getLeaderboard: (...args: unknown[]) => mockGetLeaderboard(...args),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe('Leaderboard', () => {
  const defaultProps = {
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render leaderboard data', async () => {
    mockGetLeaderboard.mockResolvedValue({
      scores: [
        {
          id: '1',
          player_name: 'Alice',
          score: 5000,
          level_reached: 10,
          created_at: '2026-01-15T12:00:00Z',
        },
        {
          id: '2',
          player_name: 'Bob',
          score: 3000,
          level_reached: 7,
          created_at: '2026-01-14T12:00:00Z',
        },
      ],
    });

    render(<Leaderboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.getByText('5000')).toBeTruthy();
      expect(screen.getByText('3000')).toBeTruthy();
    });
  });

  it('should show loading state', () => {
    mockGetLeaderboard.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<Leaderboard {...defaultProps} />);

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should show empty state', async () => {
    mockGetLeaderboard.mockResolvedValue({ scores: [] });

    render(<Leaderboard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No scores yet. Be the first to play!')).toBeTruthy();
    });
  });
});
