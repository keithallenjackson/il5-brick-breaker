import { describe, it, expect } from 'vitest';
import { PowerUpSystem } from '../../src/game/systems/PowerUpSystem';
import type { GameState, Ball, Paddle } from '../../src/game/GameState';

function createBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 400,
    y: 300,
    vx: 100,
    vy: -300,
    radius: 6,
    active: true,
    ...overrides,
  };
}

function createPaddle(overrides: Partial<Paddle> = {}): Paddle {
  return {
    x: 350,
    y: 560,
    width: 100,
    height: 14,
    baseWidth: 100,
    ...overrides,
  };
}

function createState(overrides: Partial<GameState> = {}): GameState {
  return {
    status: 'playing',
    score: 0,
    lives: 3,
    level: 1,
    balls: [createBall()],
    paddle: createPaddle(),
    bricks: [],
    powerUps: [],
    activePowerUps: [],
    ...overrides,
  };
}

describe('PowerUpSystem', () => {
  it('should spawn 2 extra balls with multiball power-up', () => {
    const powerUpSystem = new PowerUpSystem();
    const state = createState({ balls: [createBall()] });

    expect(state.balls.length).toBe(1);

    powerUpSystem.collectPowerUp('multiball', state);

    expect(state.balls.length).toBe(3);
    expect(state.balls.every((b) => b.active)).toBe(true);
  });

  it('should increase paddle width by 50% with bigpaddle power-up', () => {
    const powerUpSystem = new PowerUpSystem();
    const state = createState();

    const originalWidth = state.paddle.baseWidth;
    powerUpSystem.collectPowerUp('bigpaddle', state);

    expect(state.paddle.width).toBe(originalWidth * 1.5);
    expect(state.activePowerUps.length).toBe(1);
    expect(state.activePowerUps[0].type).toBe('bigpaddle');
    expect(state.activePowerUps[0].remainingMs).toBe(10000);
  });

  it('should restore paddle width when bigpaddle timer expires', () => {
    const powerUpSystem = new PowerUpSystem();
    const state = createState();
    const originalWidth = state.paddle.baseWidth;

    powerUpSystem.collectPowerUp('bigpaddle', state);
    expect(state.paddle.width).toBe(originalWidth * 1.5);

    // Simulate time passing beyond the timer
    powerUpSystem.updateTimers(11, state); // 11 seconds > 10 second timer

    expect(state.paddle.width).toBe(originalWidth);
    expect(state.activePowerUps.length).toBe(0);
  });

  it('should detect power-up collection on paddle collision', () => {
    const powerUpSystem = new PowerUpSystem();
    const paddle = createPaddle({ x: 350, y: 560 });
    const state = createState({
      paddle,
      powerUps: [
        {
          x: 380,
          y: 555,
          vy: 120,
          type: 'multiball',
          width: 24,
          height: 16,
          active: true,
        },
      ],
    });

    let collected = false;
    powerUpSystem.update(1 / 60, state, () => {
      collected = true;
    });

    expect(collected).toBe(true);
  });
});
