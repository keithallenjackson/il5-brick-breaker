import { Application, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameState } from '../GameState';
import type { ParticleSystem } from './ParticleSystem';

export class RenderSystem {
  private app: Application;
  private backgroundGraphics: Graphics;
  private brickGraphics: Graphics;
  private paddleGraphics: Graphics;
  private paddleGlowGraphics: Graphics;
  private ballGraphics: Graphics;
  private ballGlowGraphics: Graphics;
  private powerUpGraphics: Graphics;
  private particleGraphics: Graphics;
  private scoreText: Text;
  private levelText: Text;
  private livesText: Text;
  private powerUpText: Text;
  private statusText: Text;
  private elapsedTime = 0;

  constructor(app: Application) {
    this.app = app;

    this.backgroundGraphics = new Graphics();
    this.brickGraphics = new Graphics();
    this.paddleGlowGraphics = new Graphics();
    this.paddleGraphics = new Graphics();
    this.ballGlowGraphics = new Graphics();
    this.ballGraphics = new Graphics();
    this.powerUpGraphics = new Graphics();
    this.particleGraphics = new Graphics();

    const hudStyle = new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: 16,
      fill: 0xffffff,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 0,
      },
    });

    this.scoreText = new Text({ text: 'Score: 0', style: hudStyle });
    this.scoreText.x = 10;
    this.scoreText.y = 8;

    this.levelText = new Text({ text: 'Level: 1', style: hudStyle });
    this.levelText.x = 10;
    this.levelText.y = 28;

    this.livesText = new Text({ text: '', style: hudStyle });
    this.livesText.anchor = { x: 1, y: 0 };
    this.livesText.x = 790;
    this.livesText.y = 8;

    this.powerUpText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        fill: 0x88ffff,
      }),
    });
    this.powerUpText.anchor = { x: 1, y: 0 };
    this.powerUpText.x = 790;
    this.powerUpText.y = 30;

    this.statusText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 36,
        fill: 0xffffff,
        fontWeight: 'bold',
      }),
    });
    this.statusText.anchor = { x: 0.5, y: 0.5 };
    this.statusText.x = 400;
    this.statusText.y = 300;

    this.app.stage.addChild(this.backgroundGraphics);
    this.app.stage.addChild(this.brickGraphics);
    this.app.stage.addChild(this.paddleGlowGraphics);
    this.app.stage.addChild(this.paddleGraphics);
    this.app.stage.addChild(this.ballGlowGraphics);
    this.app.stage.addChild(this.ballGraphics);
    this.app.stage.addChild(this.powerUpGraphics);
    this.app.stage.addChild(this.particleGraphics);
    this.app.stage.addChild(this.scoreText);
    this.app.stage.addChild(this.levelText);
    this.app.stage.addChild(this.livesText);
    this.app.stage.addChild(this.powerUpText);
    this.app.stage.addChild(this.statusText);
  }

  render(state: GameState, particleSystem: ParticleSystem): void {
    this.elapsedTime += 1 / 60;

    this.renderBackground();
    this.renderBricks(state);
    this.renderPaddle(state);
    this.renderBalls(state);
    this.renderPowerUps(state);
    this.renderParticles(particleSystem);
    this.renderHUD(state);
    this.renderStatus(state);
  }

  private renderBackground(): void {
    this.backgroundGraphics.clear();
    this.backgroundGraphics.rect(0, 0, 800, 600);
    this.backgroundGraphics.fill(0x0a0a1a);

    // Subtle grid lines
    this.backgroundGraphics.setStrokeStyle({ width: 1, color: 0x151530, alpha: 0.3 });
    for (let x = 0; x < 800; x += 40) {
      this.backgroundGraphics.moveTo(x, 0);
      this.backgroundGraphics.lineTo(x, 600);
      this.backgroundGraphics.stroke();
    }
    for (let y = 0; y < 600; y += 40) {
      this.backgroundGraphics.moveTo(0, y);
      this.backgroundGraphics.lineTo(800, y);
      this.backgroundGraphics.stroke();
    }
  }

  private renderBricks(state: GameState): void {
    this.brickGraphics.clear();
    for (const brick of state.bricks) {
      if (!brick.active) continue;

      const alpha = 0.5 + 0.5 * (brick.health / brick.maxHealth);
      this.brickGraphics.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
      this.brickGraphics.fill({ color: brick.color, alpha });

      // Border
      this.brickGraphics.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
      this.brickGraphics.stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
    }
  }

  private renderPaddle(state: GameState): void {
    const paddle = state.paddle;

    // Glow effect
    this.paddleGlowGraphics.clear();
    this.paddleGlowGraphics.roundRect(
      paddle.x - 3,
      paddle.y - 3,
      paddle.width + 6,
      paddle.height + 6,
      5
    );
    this.paddleGlowGraphics.fill({ color: 0x44ccff, alpha: 0.15 });

    // Main paddle
    this.paddleGraphics.clear();
    this.paddleGraphics.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 4);
    this.paddleGraphics.fill({ color: 0xeeffff, alpha: 0.95 });

    // Highlight stripe
    this.paddleGraphics.rect(paddle.x + 4, paddle.y + 2, paddle.width - 8, 3);
    this.paddleGraphics.fill({ color: 0x44ccff, alpha: 0.6 });
  }

  private renderBalls(state: GameState): void {
    this.ballGlowGraphics.clear();
    this.ballGraphics.clear();

    for (const ball of state.balls) {
      if (!ball.active) continue;

      // Glow
      this.ballGlowGraphics.circle(ball.x, ball.y, ball.radius + 3);
      this.ballGlowGraphics.fill({ color: 0x4488ff, alpha: 0.2 });

      // Ball
      this.ballGraphics.circle(ball.x, ball.y, ball.radius);
      this.ballGraphics.fill({ color: 0xffffff, alpha: 1.0 });
    }
  }

  private renderPowerUps(state: GameState): void {
    this.powerUpGraphics.clear();

    for (const powerUp of state.powerUps) {
      if (!powerUp.active) continue;

      const pulseScale = 1 + 0.1 * Math.sin(this.elapsedTime * 6);
      const color = powerUp.type === 'multiball' ? 0x44ffff : 0x44ff44;
      const w = powerUp.width * pulseScale;
      const h = powerUp.height * pulseScale;
      const cx = powerUp.x + powerUp.width / 2;
      const cy = powerUp.y + powerUp.height / 2;

      this.powerUpGraphics.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
      this.powerUpGraphics.fill({ color, alpha: 0.85 });

      // Icon indicator
      this.powerUpGraphics.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
      this.powerUpGraphics.stroke({ width: 1.5, color: 0xffffff, alpha: 0.5 });
    }
  }

  private renderParticles(particleSystem: ParticleSystem): void {
    this.particleGraphics.clear();
    particleSystem.render(this.particleGraphics);
  }

  private renderHUD(state: GameState): void {
    this.scoreText.text = `Score: ${state.score}`;
    this.levelText.text = `Level: ${state.level}`;

    const hearts = '\u2665'.repeat(Math.max(0, state.lives));
    this.livesText.text = hearts;

    if (state.activePowerUps.length > 0) {
      const lines = state.activePowerUps.map((p) => {
        const secs = Math.ceil(p.remainingMs / 1000);
        return `${p.type} ${secs}s`;
      });
      this.powerUpText.text = lines.join('\n');
    } else {
      this.powerUpText.text = '';
    }
  }

  private renderStatus(state: GameState): void {
    if (state.status === 'levelComplete') {
      this.statusText.text = `Level ${state.level} Complete!`;
      this.statusText.alpha = 1;
    } else if (state.status === 'gameOver') {
      this.statusText.text = 'GAME OVER';
      this.statusText.alpha = 1;
    } else {
      this.statusText.text = '';
      this.statusText.alpha = 0;
    }
  }
}
