import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameOverScreen from '../../src/ui/GameOverScreen';

// Mock the API client
vi.mock('../../src/api/client', () => ({
  submitScore: vi.fn().mockResolvedValue({ id: '1', player_name: 'Test', score: 100, level_reached: 1, created_at: '2026-01-01' }),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe('GameOverScreen', () => {
  const defaultProps = {
    score: 1500,
    level: 5,
    onPlayAgain: vi.fn(),
    onLeaderboard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render game over screen with score and level', () => {
    render(<GameOverScreen {...defaultProps} />);

    expect(screen.getByText('GAME OVER')).toBeTruthy();
    expect(screen.getByText(/1500/)).toBeTruthy();
    expect(screen.getByText(/Level Reached/)).toBeTruthy();
  });

  it('should reject empty name in form validation', () => {
    render(<GameOverScreen {...defaultProps} />);

    const submitButton = screen.getByText('Submit Score');
    fireEvent.click(submitButton);

    expect(screen.getByText('Please enter a name.')).toBeTruthy();
  });

  it('should reject special characters in name', () => {
    render(<GameOverScreen {...defaultProps} />);

    const input = screen.getByLabelText('Player name');
    fireEvent.change(input, { target: { value: 'test@user!' } });
    fireEvent.click(screen.getByText('Submit Score'));

    expect(
      screen.getByText(
        'Name can only contain letters, numbers, spaces, hyphens, and underscores.'
      )
    ).toBeTruthy();
  });
});
