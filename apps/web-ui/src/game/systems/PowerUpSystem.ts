import type { GameState, PowerUp, PowerUpType } from '../GameState';
import { LevelSystem } from './LevelSystem';

const POWERUP_SPEED = 120;
const POWERUP_WIDTH = 24;
const POWERUP_HEIGHT = 16;

export class PowerUpSystem {
  trySpawnPowerUp(
    brickX: number,
    brickY: number,
    state: GameState,
    level: number
  ): void {
    const dropChance = LevelSystem.getPowerUpChance(level);
    if (Math.random() > dropChance) return;

    const type: PowerUpType = Math.random() < 0.5 ? 'multiball' : 'bigpaddle';

    const powerUp: PowerUp = {
      x: brickX - POWERUP_WIDTH / 2,
      y: brickY,
      vy: POWERUP_SPEED,
      type,
      width: POWERUP_WIDTH,
      height: POWERUP_HEIGHT,
      active: true,
    };

    state.powerUps.push(powerUp);
  }

  update(
    deltaTime: number,
    state: GameState,
    onCollect: (type: PowerUpType, x: number, y: number) => void
  ): void {
    for (const powerUp of state.powerUps) {
      if (!powerUp.active) continue;

      powerUp.y += powerUp.vy * deltaTime;

      // Off screen
      if (powerUp.y > 600) {
        powerUp.active = false;
        continue;
      }

      // Paddle collision
      if (this.checkPaddleCollision(powerUp, state)) {
        powerUp.active = false;
        this.collectPowerUp(powerUp.type, state);
        onCollect(powerUp.type, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
      }
    }

    // Clean up inactive power-ups
    state.powerUps = state.powerUps.filter((p) => p.active);
  }

  private checkPaddleCollision(powerUp: PowerUp, state: GameState): boolean {
    const paddle = state.paddle;
    return (
      powerUp.x + powerUp.width > paddle.x &&
      powerUp.x < paddle.x + paddle.width &&
      powerUp.y + powerUp.height > paddle.y &&
      powerUp.y < paddle.y + paddle.height
    );
  }

  collectPowerUp(type: PowerUpType, state: GameState): void {
    switch (type) {
      case 'multiball': {
        const activeBall = state.balls.find((b) => b.active);
        if (activeBall) {
          const speed = Math.sqrt(activeBall.vx * activeBall.vx + activeBall.vy * activeBall.vy);
          const currentAngle = Math.atan2(activeBall.vy, activeBall.vx);

          const ball1 = {
            x: activeBall.x,
            y: activeBall.y,
            vx: Math.cos(currentAngle - Math.PI / 6) * speed,
            vy: Math.sin(currentAngle - Math.PI / 6) * speed,
            radius: activeBall.radius,
            active: true,
          };

          const ball2 = {
            x: activeBall.x,
            y: activeBall.y,
            vx: Math.cos(currentAngle + Math.PI / 6) * speed,
            vy: Math.sin(currentAngle + Math.PI / 6) * speed,
            radius: activeBall.radius,
            active: true,
          };

          state.balls.push(ball1, ball2);
        }
        break;
      }
      case 'bigpaddle': {
        // Check if already active, reset timer
        const existing = state.activePowerUps.find((p) => p.type === 'bigpaddle');
        if (existing) {
          existing.remainingMs = 10000;
        } else {
          state.activePowerUps.push({ type: 'bigpaddle', remainingMs: 10000 });
        }
        state.paddle.width = state.paddle.baseWidth * 1.5;
        break;
      }
    }
  }

  updateTimers(deltaTime: number, state: GameState): void {
    const deltaMs = deltaTime * 1000;

    for (let i = state.activePowerUps.length - 1; i >= 0; i--) {
      const active = state.activePowerUps[i];
      active.remainingMs -= deltaMs;

      if (active.remainingMs <= 0) {
        if (active.type === 'bigpaddle') {
          state.paddle.width = state.paddle.baseWidth;
        }
        state.activePowerUps.splice(i, 1);
      }
    }
  }
}
