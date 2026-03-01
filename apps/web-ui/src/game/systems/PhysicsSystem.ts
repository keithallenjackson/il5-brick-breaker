import type { GameState, Ball, Brick, BrickType } from '../GameState';

export interface PhysicsEvent {
  type: 'wallBounce' | 'paddleHit' | 'brickHit' | 'ballLost';
  x?: number;
  y?: number;
  hitPosition?: number;
  destroyed?: boolean;
  brickType?: BrickType;
  color?: number;
}

export class PhysicsSystem {
  private gameWidth: number;
  private gameHeight: number;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
  }

  update(deltaTime: number, state: GameState): PhysicsEvent[] {
    const events: PhysicsEvent[] = [];

    for (const ball of state.balls) {
      if (!ball.active) continue;

      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const maxStepSize = 25; // roughly half a brick dimension
      const steps = speed * deltaTime > maxStepSize ? Math.ceil((speed * deltaTime) / maxStepSize) : 1;
      const subDelta = deltaTime / steps;

      for (let step = 0; step < steps; step++) {
        this.updateBall(ball, subDelta, state, events);
        if (!ball.active) break;
      }
    }

    return events;
  }

  private updateBall(
    ball: Ball,
    deltaTime: number,
    state: GameState,
    events: PhysicsEvent[]
  ): void {
    ball.x += ball.vx * deltaTime;
    ball.y += ball.vy * deltaTime;

    // Clamp speed to prevent tunneling
    const maxSpeed = 64 * 0.8; // brick_width * 0.8 approximately
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > maxSpeed * 10) {
      const scale = (maxSpeed * 10) / speed;
      ball.vx *= scale;
      ball.vy *= scale;
    }

    // Wall collisions
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      events.push({ type: 'wallBounce', x: ball.x, y: ball.y });
    }
    if (ball.x + ball.radius >= this.gameWidth) {
      ball.x = this.gameWidth - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      events.push({ type: 'wallBounce', x: ball.x, y: ball.y });
    }
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      events.push({ type: 'wallBounce', x: ball.x, y: ball.y });
    }

    // Bottom - ball lost
    if (ball.y + ball.radius >= this.gameHeight) {
      ball.active = false;
      events.push({ type: 'ballLost', x: ball.x, y: ball.y });
      return;
    }

    // Paddle collision
    this.checkPaddleCollision(ball, state, events);

    // Brick collisions
    this.checkBrickCollisions(ball, state, events);
  }

  private checkPaddleCollision(
    ball: Ball,
    state: GameState,
    events: PhysicsEvent[]
  ): void {
    const paddle = state.paddle;

    if (
      ball.vy > 0 &&
      ball.x + ball.radius >= paddle.x &&
      ball.x - ball.radius <= paddle.x + paddle.width &&
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height
    ) {
      // Calculate hit position (0 = left edge, 1 = right edge)
      const hitPosition = (ball.x - paddle.x) / paddle.width;
      const clampedHit = Math.max(0, Math.min(1, hitPosition));

      // Reflect angle based on hit position
      const maxAngle = Math.PI * 0.4; // ~72 degrees max deflection from vertical
      const reflectAngle = (clampedHit - 0.5) * maxAngle * 2;

      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = Math.sin(reflectAngle) * speed;
      ball.vy = -Math.cos(reflectAngle) * speed;

      // Push ball above paddle
      ball.y = paddle.y - ball.radius - 1;

      events.push({
        type: 'paddleHit',
        x: ball.x,
        y: ball.y,
        hitPosition: clampedHit,
      });
    }
  }

  private checkBrickCollisions(
    ball: Ball,
    state: GameState,
    events: PhysicsEvent[]
  ): void {
    for (const brick of state.bricks) {
      if (!brick.active) continue;

      if (this.aabbIntersect(ball, brick)) {
        // Determine hit face and reflect
        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ball.vx = -ball.vx;
          if (overlapLeft < overlapRight) {
            ball.x = brick.x - ball.radius;
          } else {
            ball.x = brick.x + brick.width + ball.radius;
          }
        } else {
          ball.vy = -ball.vy;
          if (overlapTop < overlapBottom) {
            ball.y = brick.y - ball.radius;
          } else {
            ball.y = brick.y + brick.height + ball.radius;
          }
        }

        // Reduce brick health
        brick.health -= 1;
        const destroyed = brick.health <= 0 && brick.type !== 'indestructible';
        if (destroyed) {
          brick.active = false;
        }

        events.push({
          type: 'brickHit',
          x: brick.x + brick.width / 2,
          y: brick.y + brick.height / 2,
          destroyed,
          brickType: brick.type,
          color: brick.color,
        });

        // Only collide with one brick per sub-step
        break;
      }
    }
  }

  private aabbIntersect(ball: Ball, brick: Brick): boolean {
    return (
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    );
  }
}
