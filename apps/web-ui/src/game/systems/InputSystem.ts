export class InputSystem {
  private canvas: HTMLCanvasElement;
  private gameWidth: number;
  private paddleTarget: number | null = null;
  private keysDown: Set<string> = new Set();
  private launchPressed = false;
  private pausePressed = false;

  private handlePointerMove: (e: PointerEvent) => void;
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, gameWidth: number) {
    this.canvas = canvas;
    this.gameWidth = gameWidth;

    this.handlePointerMove = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.gameWidth / rect.width;
      this.paddleTarget = (e.clientX - rect.left) * scaleX;
    };

    this.handleKeyDown = (e: KeyboardEvent) => {
      this.keysDown.add(e.key);

      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        this.launchPressed = true;
      }
      if (e.key === 'Escape') {
        this.pausePressed = true;
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.key);
    };

    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  getPaddleTarget(): number | null {
    return this.paddleTarget;
  }

  getKeysPressed(): { left: boolean; right: boolean } {
    return {
      left: this.keysDown.has('ArrowLeft') || this.keysDown.has('a'),
      right: this.keysDown.has('ArrowRight') || this.keysDown.has('d'),
    };
  }

  isLaunchPressed(): boolean {
    if (this.launchPressed) {
      this.launchPressed = false;
      return true;
    }
    return false;
  }

  isPausePressed(): boolean {
    if (this.pausePressed) {
      this.pausePressed = false;
      return true;
    }
    return false;
  }

  destroy(): void {
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
