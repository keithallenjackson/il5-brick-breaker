import { describe, it, expect } from 'vitest';
import { PhysicsSystem } from '../../src/game/systems/PhysicsSystem';
import type { GameState, Ball, Paddle } from '../../src/game/GameState';

function createBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 400,
    y: 300,
    vx: 0,
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

describe('PhysicsSystem', () => {
  const physics = new PhysicsSystem(800, 600);

  it('should move ball with velocity * delta', () => {
    const ball = createBall({ x: 400, y: 300, vx: 100, vy: -200 });
    const state = createState({ balls: [ball] });
    const deltaTime = 1 / 60;

    physics.update(deltaTime, state);

    // Ball should have moved approximately by velocity * delta
    expect(ball.x).toBeCloseTo(400 + 100 * deltaTime, 0);
    expect(ball.y).toBeCloseTo(300 + -200 * deltaTime, 0);
  });

  it('should reflect ball off top wall', () => {
    const ball = createBall({ x: 400, y: 3, vx: 0, vy: -300 });
    const state = createState({ balls: [ball] });

    const events = physics.update(1 / 60, state);

    // Ball should have positive vy after hitting top
    expect(ball.vy).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'wallBounce')).toBe(true);
  });

  it('should reflect ball off left wall', () => {
    const ball = createBall({ x: 3, y: 300, vx: -300, vy: 0 });
    const state = createState({ balls: [ball] });

    const events = physics.update(1 / 60, state);

    expect(ball.vx).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'wallBounce')).toBe(true);
  });

  it('should reflect ball off right wall', () => {
    const ball = createBall({ x: 797, y: 300, vx: 300, vy: 0 });
    const state = createState({ balls: [ball] });

    const events = physics.update(1 / 60, state);

    expect(ball.vx).toBeLessThan(0);
    expect(events.some((e) => e.type === 'wallBounce')).toBe(true);
  });

  it('should detect ball as lost when passing bottom', () => {
    const ball = createBall({ x: 400, y: 598, vx: 0, vy: 300 });
    const state = createState({ balls: [ball] });

    const events = physics.update(1 / 60, state);

    expect(ball.active).toBe(false);
    expect(events.some((e) => e.type === 'ballLost')).toBe(true);
  });

  it('should change ball direction on paddle collision', () => {
    const ball = createBall({ x: 400, y: 554, vx: 0, vy: 300 });
    const paddle = createPaddle({ x: 350, y: 560 });
    const state = createState({ balls: [ball], paddle });

    physics.update(1 / 60, state);

    // Ball should bounce upward after hitting paddle
    expect(ball.vy).toBeLessThan(0);
  });

  it('should affect ball angle based on paddle hit position', () => {
    // Hit left side of paddle
    const ballLeft = createBall({ x: 355, y: 554, vx: 0, vy: 300 });
    const paddleLeft = createPaddle({ x: 350, y: 560 });
    const stateLeft = createState({ balls: [ballLeft], paddle: paddleLeft });

    physics.update(1 / 60, stateLeft);
    const leftVx = ballLeft.vx;

    // Hit right side of paddle
    const ballRight = createBall({ x: 445, y: 554, vx: 0, vy: 300 });
    const paddleRight = createPaddle({ x: 350, y: 560 });
    const stateRight = createState({ balls: [ballRight], paddle: paddleRight });

    physics.update(1 / 60, stateRight);
    const rightVx = ballRight.vx;

    // Left hit should send ball left (negative vx), right hit should send ball right (positive vx)
    expect(leftVx).toBeLessThan(0);
    expect(rightVx).toBeGreaterThan(0);
  });
});
