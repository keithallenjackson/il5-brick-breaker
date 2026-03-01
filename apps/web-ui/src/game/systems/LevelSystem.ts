import type { Brick, BrickType } from '../GameState';

const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 25;
const BRICK_GAP = 4;
const AREA_LEFT = 50;
const AREA_TOP = 50;

const BRICK_COLORS: Record<BrickType, number> = {
  normal: 0x4488ff,
  tough: 0x44cc44,
  armored: 0xff8844,
  indestructible: 0xaaaacc,
};

const BRICK_HEALTH: Record<BrickType, number> = {
  normal: 1,
  tough: 2,
  armored: 3,
  indestructible: 999,
};

type PatternFn = (row: number, col: number, rows: number, cols: number) => boolean;

const patterns: PatternFn[] = [
  // Standard (all filled)
  () => true,
  // Checkerboard
  (row, col) => (row + col) % 2 === 0,
  // Diamond
  (row, col, rows, cols) => {
    const centerR = (rows - 1) / 2;
    const centerC = (cols - 1) / 2;
    const dist = Math.abs(row - centerR) / (rows / 2) + Math.abs(col - centerC) / (cols / 2);
    return dist <= 1;
  },
  // Pyramid
  (row, col, rows, cols) => {
    const maxWidth = cols;
    const widthAtRow = Math.ceil(maxWidth * ((rows - row) / rows));
    const offset = Math.floor((maxWidth - widthAtRow) / 2);
    return col >= offset && col < offset + widthAtRow;
  },
  // Fortress (border with inner pattern)
  (row, col, rows, cols) => {
    if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) return true;
    if (rows > 3 && cols > 3) {
      return (row + col) % 3 === 0;
    }
    return false;
  },
];

export class LevelSystem {
  static generateLevel(level: number): Brick[] {
    const cols = 8;
    let rows: number;
    let typeDistribution: { type: BrickType; weight: number }[];

    if (level <= 3) {
      rows = 2 + level;
      typeDistribution = [{ type: 'normal', weight: 1 }];
    } else if (level <= 6) {
      rows = 3 + Math.floor(level / 2);
      typeDistribution = [
        { type: 'normal', weight: 0.7 },
        { type: 'tough', weight: 0.3 },
      ];
    } else if (level <= 9) {
      rows = 4 + Math.floor(level / 3);
      typeDistribution = [
        { type: 'normal', weight: 0.55 },
        { type: 'tough', weight: 0.3 },
        { type: 'armored', weight: 0.15 },
      ];
    } else {
      rows = Math.min(8, 5 + Math.floor(level / 4));
      typeDistribution = [
        { type: 'normal', weight: 0.4 },
        { type: 'tough', weight: 0.3 },
        { type: 'armored', weight: 0.15 },
        { type: 'indestructible', weight: 0.15 },
      ];
    }

    const patternIndex = (level - 1) % patterns.length;
    const patternFn = patterns[patternIndex];

    const bricks: Brick[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!patternFn(row, col, rows, cols)) continue;

        const type = this.pickBrickType(typeDistribution);
        const x = AREA_LEFT + col * (BRICK_WIDTH + BRICK_GAP);
        const y = AREA_TOP + row * (BRICK_HEIGHT + BRICK_GAP);

        bricks.push({
          x,
          y,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          type,
          health: BRICK_HEALTH[type],
          maxHealth: BRICK_HEALTH[type],
          color: BRICK_COLORS[type],
          active: true,
        });
      }
    }

    return bricks;
  }

  private static pickBrickType(
    distribution: { type: BrickType; weight: number }[]
  ): BrickType {
    const rand = Math.random();
    let cumulative = 0;
    for (const entry of distribution) {
      cumulative += entry.weight;
      if (rand <= cumulative) {
        return entry.type;
      }
    }
    return distribution[distribution.length - 1].type;
  }

  static getBallSpeed(level: number): number {
    return 300 * (1 + 0.08 * level);
  }

  static getPowerUpChance(level: number): number {
    return Math.max(0.08, 0.20 - 0.01 * level);
  }
}
