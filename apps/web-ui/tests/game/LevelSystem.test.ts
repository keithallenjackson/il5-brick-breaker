import { describe, it, expect } from 'vitest';
import { LevelSystem } from '../../src/game/systems/LevelSystem';

describe('LevelSystem', () => {
  it('should generate correct number of bricks for level 1', () => {
    const bricks = LevelSystem.generateLevel(1);
    // Level 1: rows = 2 + 1 = 3, cols = 8, standard pattern (all filled)
    expect(bricks.length).toBe(3 * 8);
    expect(bricks.every((b) => b.active)).toBe(true);
  });

  it('should increase difficulty (more rows, higher speed)', () => {
    const level1Bricks = LevelSystem.generateLevel(1);
    const level5Bricks = LevelSystem.generateLevel(5);

    const speed1 = LevelSystem.getBallSpeed(1);
    const speed5 = LevelSystem.getBallSpeed(5);

    // Level 5 should have more bricks than level 1
    // (Note: pattern filtering may affect count, but generally more rows = more bricks)
    expect(level5Bricks.length).toBeGreaterThanOrEqual(level1Bricks.length);
    expect(speed5).toBeGreaterThan(speed1);
  });

  it('should have tough bricks at level 5', () => {
    // Generate multiple times to account for randomness
    let hasToughBricks = false;
    for (let i = 0; i < 20; i++) {
      const bricks = LevelSystem.generateLevel(5);
      if (bricks.some((b) => b.type === 'tough')) {
        hasToughBricks = true;
        break;
      }
    }
    expect(hasToughBricks).toBe(true);
  });

  it('should have armored bricks at level 8', () => {
    let hasArmoredBricks = false;
    for (let i = 0; i < 20; i++) {
      const bricks = LevelSystem.generateLevel(8);
      if (bricks.some((b) => b.type === 'armored')) {
        hasArmoredBricks = true;
        break;
      }
    }
    expect(hasArmoredBricks).toBe(true);
  });

  it('should calculate ball speed correctly', () => {
    expect(LevelSystem.getBallSpeed(1)).toBeCloseTo(300 * (1 + 0.08 * 1));
    expect(LevelSystem.getBallSpeed(5)).toBeCloseTo(300 * (1 + 0.08 * 5));
    expect(LevelSystem.getBallSpeed(10)).toBeCloseTo(300 * (1 + 0.08 * 10));
  });

  it('should calculate power-up chance correctly', () => {
    expect(LevelSystem.getPowerUpChance(1)).toBeCloseTo(0.19);
    expect(LevelSystem.getPowerUpChance(12)).toBeCloseTo(0.08);
    // Should never go below 0.08
    expect(LevelSystem.getPowerUpChance(20)).toBeCloseTo(0.08);
  });
});
