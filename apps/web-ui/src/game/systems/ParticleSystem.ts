import { Graphics } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

const MAX_PARTICLES = 500;

export class ParticleSystem {
  private particles: Particle[] = [];

  emitBrickDestroy(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i++) {
      this.addParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 300,
        life: 0.5,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  emitPowerUpCollect(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 100 + Math.random() * 100;
      const isGold = Math.random() > 0.5;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color: isGold ? 0xffdd44 : 0xffffff,
        size: 2 + Math.random() * 2,
      });
    }
  }

  emitBallTrail(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      this.addParticle({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.15,
        maxLife: 0.15,
        color: 0xffffff,
        size: 1 + Math.random(),
      });
    }
  }

  emitLevelComplete(cx: number, cy: number): void {
    const colors = [0xff4444, 0xff8844, 0xffff44, 0x44ff44, 0x4488ff, 0x8844ff, 0xff44ff];
    for (let i = 0; i < 50; i++) {
      const angle = (Math.random()) * Math.PI * 2;
      const speed = 50 + Math.random() * 250;
      this.addParticle({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5,
        maxLife: 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
      });
    }
  }

  private addParticle(p: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) {
      // Replace oldest particle
      this.particles.shift();
    }
    this.particles.push(p);
  }

  update(deltaTime: number): void {
    const gravity = 200;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += gravity * deltaTime;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(graphics: Graphics): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      graphics.circle(p.x, p.y, p.size * alpha);
      graphics.fill({ color: p.color, alpha });
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
