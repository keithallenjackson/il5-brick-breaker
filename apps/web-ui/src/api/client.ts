const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ScoreSubmission {
  player_name: string;
  score: number;
  level_reached: number;
}

export interface ScoreResponse {
  id: string;
  player_name: string;
  score: number;
  level_reached: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level_reached: number;
  created_at: string;
}

export interface LeaderboardResponse {
  scores: LeaderboardEntry[];
  total_count: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body.detail) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      // Use default message
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function submitScore(data: ScoreSubmission): Promise<ScoreResponse> {
  const response = await fetch(`${API_BASE}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<ScoreResponse>(response);
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<LeaderboardResponse>(response);
}
