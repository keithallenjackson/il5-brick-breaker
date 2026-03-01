import { Application } from 'pixi.js';
import { GameManager } from './GameManager';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { RenderSystem } from './systems/RenderSystem';
import { InputSystem } from './systems/InputSystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { SoundSystem } from './systems/SoundSystem';
import { PowerUpSystem } from './systems/PowerUpSystem';
import type { GameState } from './GameState';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export class GameEngine {
  private app: Application;
  private container: HTMLElement;
  private manager: GameManager;
  private physicsSystem: PhysicsSystem;
  private renderSystem!: RenderSystem;
  private inputSystem!: InputSystem;
  private particleSystem!: ParticleSystem;
  private soundSystem: SoundSystem;
  private powerUpSystem: PowerUpSystem;
  private running = false;
  private onGameOver: ((score: number, level: number) => void) | null = null;
  private onStateChange: ((state: GameState) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.app = new Application();
    this.manager = new GameManager();
    this.physicsSystem = new PhysicsSystem(GAME_WIDTH, GAME_HEIGHT);
    this.soundSystem = new SoundSystem();
    this.powerUpSystem = new PowerUpSystem();
  }

  async init(): Promise<void> {
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0a0a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas as HTMLCanvasElement);

    this.renderSystem = new RenderSystem(this.app);
    this.inputSystem = new InputSystem(this.app.canvas as HTMLCanvasElement, GAME_WIDTH);
    this.particleSystem = new ParticleSystem();

    this.soundSystem.init();

    this.manager.setOnStateChange((state: GameState) => {
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    });
  }

  setOnGameOver(callback: (score: number, level: number) => void): void {
    this.onGameOver = callback;
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundSystem.setMuted(!enabled);
  }

  start(): void {
    this.manager.startGame();
    this.running = true;

    this.app.ticker.add(() => {
      if (!this.running) return;
      const deltaMs = this.app.ticker.deltaMS;
      const deltaSec = deltaMs / 1000;
      this.update(deltaSec);
    });
  }

  private update(deltaTime: number): void {
    const state = this.manager.getState();

    if (state.status !== 'playing') {
      this.renderSystem.render(state, this.particleSystem);
      return;
    }

    // Handle input
    const paddleTarget = this.inputSystem.getPaddleTarget();
    if (paddleTarget !== null) {
      const targetX = paddleTarget - state.paddle.width / 2;
      const clampedX = Math.max(0, Math.min(GAME_WIDTH - state.paddle.width, targetX));
      state.paddle.x = clampedX;
    }

    const keys = this.inputSystem.getKeysPressed();
    const paddleSpeed = 500;
    if (keys.left) {
      state.paddle.x = Math.max(0, state.paddle.x - paddleSpeed * deltaTime);
    }
    if (keys.right) {
      state.paddle.x = Math.min(
        GAME_WIDTH - state.paddle.width,
        state.paddle.x + paddleSpeed * deltaTime
      );
    }

    if (this.inputSystem.isLaunchPressed()) {
      this.manager.launchBall();
    }

    if (this.inputSystem.isPausePressed()) {
      this.manager.pause();
      return;
    }

    // Handle paddle width transitions (lerp toward target)
    const hasBigPaddle = state.activePowerUps.some((p) => p.type === 'bigpaddle');
    const targetWidth = hasBigPaddle
      ? state.paddle.baseWidth * 1.5
      : state.paddle.baseWidth;
    state.paddle.width += (targetWidth - state.paddle.width) * Math.min(1, deltaTime * 8);

    // Update physics
    const physicsEvents = this.physicsSystem.update(deltaTime, state);

    // Handle physics events
    for (const event of physicsEvents) {
      switch (event.type) {
        case 'wallBounce':
          this.soundSystem.playWallBounce();
          break;
        case 'paddleHit':
          this.soundSystem.playPaddleHit(event.hitPosition ?? 0.5);
          this.particleSystem.emitBallTrail(event.x ?? 0, event.y ?? 0);
          break;
        case 'brickHit':
          if (event.destroyed) {
            this.soundSystem.playBrickBreak();
            this.particleSystem.emitBrickDestroy(
              event.x ?? 0,
              event.y ?? 0,
              event.color ?? 0xffffff
            );
            this.manager.addScore(event.brickType ?? 'normal');
            this.powerUpSystem.trySpawnPowerUp(
              event.x ?? 0,
              event.y ?? 0,
              state,
              this.manager.getState().level
            );
          }
          break;
        case 'ballLost':
          this.soundSystem.playLifeLost();
          break;
      }
    }

    // Check if all balls are lost
    const activeBalls = state.balls.filter((b) => b.active);
    if (activeBalls.length === 0) {
      this.manager.loseLife();
      if (this.manager.getState().status === 'gameOver') {
        this.soundSystem.playGameOver();
        if (this.onGameOver) {
          const finalState = this.manager.getState();
          this.onGameOver(finalState.score, finalState.level);
        }
        return;
      }
    }

    // Update power-ups
    this.powerUpSystem.update(deltaTime, state, (type, x, y) => {
      this.soundSystem.playPowerUpCollect();
      this.particleSystem.emitPowerUpCollect(x, y);
    });
    this.powerUpSystem.updateTimers(deltaTime, state);

    // Check level completion
    if (this.manager.checkLevelComplete()) {
      this.soundSystem.playLevelComplete();
      this.particleSystem.emitLevelComplete(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      this.manager.completeLevel();
    }

    // Update particles
    this.particleSystem.update(deltaTime);

    // Ball trails
    for (const ball of state.balls) {
      if (ball.active) {
        this.particleSystem.emitBallTrail(ball.x, ball.y);
      }
    }

    // Render
    this.renderSystem.render(state, this.particleSystem);
  }

  pause(): void {
    this.manager.pause();
  }

  resume(): void {
    this.manager.resume();
  }

  restart(): void {
    this.manager.startGame();
  }

  destroy(): void {
    this.running = false;
    this.inputSystem.destroy();
    this.app.destroy(true);
  }
}
