import type { GameState, GameStatus, Ball, Paddle, BrickType } from './GameState';
import { LevelSystem } from './systems/LevelSystem';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const INITIAL_LIVES = 3;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const BALL_RADIUS = 6;

const BRICK_SCORES: Record<BrickType, number> = {
  normal: 10,
  tough: 25,
  armored: 50,
  indestructible: 0,
};

export class GameManager {
  private state: GameState;
  private onStateChange: ((state: GameState) => void) | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  private createInitialState(): GameState {
    return {
      status: 'menu',
      score: 0,
      lives: INITIAL_LIVES,
      level: 1,
      balls: [],
      paddle: this.createPaddle(),
      bricks: [],
      powerUps: [],
      activePowerUps: [],
    };
  }

  private createPaddle(): Paddle {
    return {
      x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: GAME_HEIGHT - 40,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      baseWidth: PADDLE_WIDTH,
    };
  }

  private createBall(speed: number): Ball {
    const paddle = this.state.paddle;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    return {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - BALL_RADIUS - 1,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: BALL_RADIUS,
      active: true,
    };
  }

  startGame(): void {
    this.state = this.createInitialState();
    this.state.status = 'playing';
    this.loadLevel(1);
    this.notifyStateChange();
  }

  loadLevel(level: number): void {
    this.state.level = level;
    this.state.bricks = LevelSystem.generateLevel(level);
    this.state.powerUps = [];
    this.state.activePowerUps = [];
    this.state.paddle = this.createPaddle();

    const speed = LevelSystem.getBallSpeed(level);
    this.state.balls = [this.createBall(speed)];
    this.state.status = 'playing';
    this.notifyStateChange();
  }

  launchBall(): void {
    if (this.state.balls.length === 0) {
      const speed = LevelSystem.getBallSpeed(this.state.level);
      this.state.balls.push(this.createBall(speed));
    }
  }

  addScore(brickType: BrickType): void {
    this.state.score += BRICK_SCORES[brickType];
    this.notifyStateChange();
  }

  loseLife(): void {
    this.state.lives -= 1;
    if (this.state.lives <= 0) {
      this.state.status = 'gameOver';
      this.notifyStateChange();
    } else {
      const speed = LevelSystem.getBallSpeed(this.state.level);
      this.state.balls = [this.createBall(speed)];
      this.state.paddle.width = this.state.paddle.baseWidth;
      this.state.activePowerUps = [];
      this.notifyStateChange();
    }
  }

  completeLevel(): void {
    const bonus = this.state.level * 100;
    this.state.score += bonus;
    this.state.status = 'levelComplete';
    this.notifyStateChange();

    setTimeout(() => {
      this.loadLevel(this.state.level + 1);
    }, 1500);
  }

  checkLevelComplete(): boolean {
    const destroyableBricks = this.state.bricks.filter(
      (b) => b.active && b.type !== 'indestructible'
    );
    return destroyableBricks.length === 0;
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      this.notifyStateChange();
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.notifyStateChange();
    }
  }

  setStatus(status: GameStatus): void {
    this.state.status = status;
    this.notifyStateChange();
  }

  getState(): GameState {
    return this.state;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
}
