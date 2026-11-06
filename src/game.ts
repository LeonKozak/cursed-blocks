import { Board } from './board';
import { PieceBag, pieceName, rotateClockwise, typesUnlockingAt } from './pieces';
import type { GameState, LineFlash, Piece } from './types';

// How long the piece waits before falling one row at level 1, in milliseconds.
const START_DROP_INTERVAL_MS = 1000;
// Each level makes the drop this many milliseconds faster...
const SPEEDUP_PER_LEVEL_MS = 90;
// ...but never faster than this.
const MIN_DROP_INTERVAL_MS = 100;
// Clear this many lines to go up one level.
const LINES_PER_LEVEL = 10;

// Points for clearing 0, 1, 2, 3 or 4 lines with one piece (our tallest
// piece is 4 rows, so 4 is the most possible). Multiplied by the level.
// Clearing several lines at once is worth much more than one at a time.
const LINE_POINTS = [0, 100, 300, 500, 800];

// How long the line-clear flash lasts, in milliseconds.
export const FLASH_DURATION_MS = 350;
// How long the "new piece unlocked" banner stays up, in milliseconds.
const UNLOCK_NOTICE_MS = 2500;

// When a rotation doesn't fit, try nudging the piece sideways by these
// amounts (0 = no nudge, then 1 left, 1 right, 2 left, 2 right).
// This lets you rotate a piece that is touching a wall.
const ROTATION_NUDGES = [0, -1, 1, -2, 2];

// The Game class holds the game state and the rules. It never draws anything.
export class Game {
  readonly board: Board;
  // The piece that is currently falling.
  piece: Piece;
  // The piece that will come after it (shown in the "Next" preview).
  nextPiece: Piece;
  // Milliseconds collected since the piece last moved down.
  private dropTimer = 0;
  // ^ A property can get its starting value right here, instead of in the constructor.

  // Progress. Other code may read these but only Game changes them.
  score = 0;
  lines = 0;
  level = 1;

  state: GameState = 'playing';
  // The current line-clear flash, or null when there isn't one.
  // `LineFlash | null` is a union again: either a flash object or nothing.
  flash: LineFlash | null = null;
  // The "new piece unlocked" banner, or null when it isn't showing.
  // This object type is written inline instead of as a named interface.
  unlockNotice: { names: string[]; timeLeft: number } | null = null;

  // Hands out pieces fairly; see PieceBag in pieces.ts.
  private bag = new PieceBag();

  constructor(board: Board) {
    this.board = board;
    this.piece = this.bag.next(this.level, board.cols);
    this.nextPiece = this.bag.next(this.level, board.cols);
  }

  // Called once per frame. `dt` ("delta time") is how many milliseconds
  // passed since the last frame.
  update(dt: number): void {
    // Let the flash fade out, then remove it.
    if (this.flash) {
      this.flash.timeLeft -= dt;
      if (this.flash.timeLeft <= 0) this.flash = null;
    }

    // Nothing falls (and the banner doesn't count down) while paused or after game over.
    if (this.state !== 'playing') return;

    if (this.unlockNotice) {
      this.unlockNotice.timeLeft -= dt;
      if (this.unlockNotice.timeLeft <= 0) this.unlockNotice = null;
    }

    this.dropTimer += dt;

    if (this.dropTimer >= this.dropInterval()) {
      this.dropTimer = 0;
      if (!this.tryMove(0, 1)) {
        this.lockPiece();
      }
    }
  }

  // ----- Player actions (called from input.ts) -----

  // Every action starts with `if (!this.isPlaying()) return;` so the keys
  // do nothing while paused or on the game-over screen.

  moveLeft(): void {
    if (!this.isPlaying()) return;
    this.tryMove(-1, 0);
  }

  moveRight(): void {
    if (!this.isPlaying()) return;
    this.tryMove(1, 0);
  }

  // Move down one row right now. Restart the gravity timer so the piece
  // doesn't immediately drop a second row.
  softDrop(): void {
    if (!this.isPlaying()) return;
    if (this.tryMove(0, 1)) {
      this.dropTimer = 0;
    } else {
      this.lockPiece();
    }
  }

  // Fall all the way down in one go.
  hardDrop(): void {
    if (!this.isPlaying()) return;
    // Keep moving down until the move fails.
    while (this.tryMove(0, 1)) {
      // (nothing to do here: tryMove already moved the piece)
    }
    this.lockPiece();
  }

  rotate(): void {
    if (!this.isPlaying()) return;
    const rotated = rotateClockwise(this.piece.matrix);

    // `for...of` loops over the VALUES of an array.
    for (const nudge of ROTATION_NUDGES) {
      const candidate: Piece = { ...this.piece, matrix: rotated, col: this.piece.col + nudge };
      if (!this.board.collides(candidate)) {
        this.piece = candidate;
        return;
      }
    }
    // No position fit, so the rotation is simply ignored.
  }

  // Pause, or carry on if already paused. Does nothing after game over.
  togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  // Where the piece would land if dropped straight down right now.
  // The renderer draws this as the see-through "ghost" piece.
  ghostPiece(): Piece {
    let ghost = this.piece;
    // Keep moving a copy down one row while the row below is still free.
    while (!this.board.collides({ ...ghost, row: ghost.row + 1 })) {
      ghost = { ...ghost, row: ghost.row + 1 };
    }
    return ghost;
  }

  // Start a brand-new game.
  restart(): void {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.flash = null;
    this.unlockNotice = null;
    this.state = 'playing';
    this.dropTimer = 0;
    // A fresh bag, so the new game starts with only the level-1 pieces.
    this.bag = new PieceBag();
    this.piece = this.bag.next(this.level, this.board.cols);
    this.nextPiece = this.bag.next(this.level, this.board.cols);
  }

  // ----- Helpers -----

  private isPlaying(): boolean {
    return this.state === 'playing';
  }

  // Try to move the piece. Returns true if it moved, false if it was blocked.
  private tryMove(dCol: number, dRow: number): boolean {
    // `{ ...this.piece, col: ... }` is *object spread*: it copies every
    // property of the piece, then overwrites the ones listed after it.
    // We test the copy first, so a blocked move never touches the real piece.
    const moved: Piece = { ...this.piece, col: this.piece.col + dCol, row: this.piece.row + dRow };
    if (this.board.collides(moved)) {
      return false;
    }
    this.piece = moved;
    return true;
  }

  // The piece can't fall any further: glue it onto the board, clear any
  // full rows it completed, and start the next piece.
  private lockPiece(): void {
    this.board.merge(this.piece);
    const clearedRows = this.board.clearLines();
    if (clearedRows.length > 0) {
      this.flash = { rows: clearedRows, timeLeft: FLASH_DURATION_MS };
    }
    this.addLines(clearedRows.length);
    this.spawnPiece();
  }

  // Update score, line count and level after clearing `cleared` lines.
  private addLines(cleared: number): void {
    this.score += LINE_POINTS[cleared] * this.level;
    this.lines += cleared;
    // Level 1 for lines 0-9, level 2 for 10-19, and so on.
    const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;

    if (newLevel > this.level) {
      // Did any pieces unlock at the new level? Then show the banner.
      const unlocked = typesUnlockingAt(newLevel);
      if (unlocked.length > 0) {
        this.unlockNotice = { names: unlocked.map(pieceName), timeLeft: UNLOCK_NOTICE_MS };
      }
    }
    this.level = newLevel;
  }

  // How long to wait between gravity steps at the current level.
  private dropInterval(): number {
    const interval = START_DROP_INTERVAL_MS - (this.level - 1) * SPEEDUP_PER_LEVEL_MS;
    // Math.max picks the larger number, so we never go below the minimum.
    return Math.max(interval, MIN_DROP_INTERVAL_MS);
  }

  // The "next" piece becomes the falling piece, and a new "next" is picked.
  private spawnPiece(): void {
    this.piece = this.nextPiece;
    this.nextPiece = this.bag.next(this.level, this.board.cols);
    this.dropTimer = 0;

    // If the new piece already overlaps landed blocks, the stack has
    // reached the top: game over.
    if (this.board.collides(this.piece)) {
      this.state = 'gameover';
    }
  }
}
