import { describe, it, expect, vi } from 'vitest';
import { GameManager } from '../../src/game/GameManager';

// Mock LevelSystem to avoid randomness
vi.mock('../../src/game/systems/LevelSystem', () => ({
  LevelSystem: {
    generateLevel: (level: number) => {
      const bricks = [];
      const count = 3 + level;
      for (let i = 0; i < count; i++) {
        bricks.push({
          x: 50 + (i % 8) * 84,
          y: 50 + Math.floor(i / 8) * 29,
          width: 80,
          height: 25,
          type: 'normal' as const,
          health: 1,
          maxHealth: 1,
          color: 0x4488ff,
          active: true,
        });
      }
      return bricks;
    },
    getBallSpeed: (level: number) => 300 * (1 + 0.08 * level),
    getPowerUpChance: () => 0.15,
  },
}));

describe('GameManager', () => {
  it('should start with 3 lives, score 0, level 1', () => {
    const manager = new GameManager();
    manager.startGame();
    const state = manager.getState();

    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.status).toBe('playing');
  });

  it('should add correct score for different brick types', () => {
    const manager = new GameManager();
    manager.startGame();

    manager.addScore('normal');
    expect(manager.getState().score).toBe(10);

    manager.addScore('tough');
    expect(manager.getState().score).toBe(35);

    manager.addScore('armored');
    expect(manager.getState().score).toBe(85);

    // Indestructible gives 0 points
    manager.addScore('indestructible');
    expect(manager.getState().score).toBe(85);
  });

  it('should add level completion bonus', () => {
    const manager = new GameManager();
    manager.startGame();

    // Manually deactivate all bricks to simulate completion
    const state = manager.getState();
    for (const brick of state.bricks) {
      brick.active = false;
    }

    const scoreBefore = state.score;
    manager.completeLevel();

    // Bonus = level * 100 = 1 * 100 = 100
    expect(manager.getState().score).toBe(scoreBefore + 100);
  });

  it('should decrement lives on loseLife', () => {
    const manager = new GameManager();
    manager.startGame();

    expect(manager.getState().lives).toBe(3);

    manager.loseLife();
    expect(manager.getState().lives).toBe(2);

    manager.loseLife();
    expect(manager.getState().lives).toBe(1);
  });

  it('should transition to gameOver when lives reach 0', () => {
    const manager = new GameManager();
    manager.startGame();

    manager.loseLife(); // 2 lives
    manager.loseLife(); // 1 life
    manager.loseLife(); // 0 lives

    expect(manager.getState().lives).toBe(0);
    expect(manager.getState().status).toBe('gameOver');
  });
});
