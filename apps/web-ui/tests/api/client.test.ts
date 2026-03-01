import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitScore, getLeaderboard, ApiError } from '../../src/api/client';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitScore', () => {
    it('should send correct POST request', async () => {
      const scoreData = {
        player_name: 'TestPlayer',
        score: 1500,
        level_reached: 5,
      };

      const responseData = {
        id: 'abc-123',
        ...scoreData,
        created_at: '2026-01-15T12:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await submitScore(scoreData);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });
      expect(result).toEqual(responseData);
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: 'Validation error' }),
      });

      await expect(
        submitScore({ player_name: '', score: 0, level_reached: 0 })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getLeaderboard', () => {
    it('should send correct GET request', async () => {
      const leaderboardData = {
        entries: [
          {
            id: '1',
            player_name: 'Alice',
            score: 5000,
            level_reached: 10,
            created_at: '2026-01-15T12:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(leaderboardData),
      });

      const result = await getLeaderboard(10);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/leaderboard?limit=10', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      expect(result).toEqual(leaderboardData);
    });

    it('should use default limit of 20', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ entries: [] }),
      });

      await getLeaderboard();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/leaderboard?limit=20',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Error handling', () => {
    it('should parse error detail from response body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Bad request' }),
      });

      try {
        await submitScore({ player_name: 'x', score: 0, level_reached: 0 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as InstanceType<typeof ApiError>;
        expect(apiErr.status).toBe(400);
        expect(apiErr.message).toBe('Bad request');
      }
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      try {
        await getLeaderboard();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as InstanceType<typeof ApiError>;
        expect(apiErr.status).toBe(500);
        expect(apiErr.message).toContain('500');
      }
    });
  });
});
