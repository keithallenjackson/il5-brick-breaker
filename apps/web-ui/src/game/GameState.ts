export type GameStatus = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';
export type BrickType = 'normal' | 'tough' | 'armored' | 'indestructible';
export type PowerUpType = 'multiball' | 'bigpaddle';

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  baseWidth: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  health: number;
  maxHealth: number;
  color: number;
  active: boolean;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  width: number;
  height: number;
  active: boolean;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingMs: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  level: number;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
}
