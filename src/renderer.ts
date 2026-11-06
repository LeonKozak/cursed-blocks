import type { Board } from './board';
import { FLASH_DURATION_MS } from './game';
import type { Game } from './game';
import type { LineFlash, Piece } from './types';

const BACKGROUND_COLOR = '#0d0b17';
const GRID_LINE_COLOR = '#26223a';
// The "Next" preview box is this many cells wide and tall (fits our biggest piece).
const PREVIEW_CELLS = 4;

// The Renderer only DRAWS. It never changes the game state.
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  // A second canvas + context for the "Next" piece preview.
  private nextCtx: CanvasRenderingContext2D;
  private nextCanvas: HTMLCanvasElement;
  private previewCellSize: number;

  constructor(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement, board: Board, cellSize: number) {
    this.cellSize = cellSize;
    canvas.width = board.cols * cellSize;
    canvas.height = board.rows * cellSize;
    this.ctx = Renderer.getContext(canvas);

    // The preview uses slightly smaller blocks than the board.
    this.previewCellSize = Math.round(cellSize * 0.8);
    this.nextCanvas = nextCanvas;
    nextCanvas.width = PREVIEW_CELLS * this.previewCellSize;
    nextCanvas.height = PREVIEW_CELLS * this.previewCellSize;
    this.nextCtx = Renderer.getContext(nextCanvas);
  }

  // Get the 2D drawing context of a canvas, or stop with a clear error.
  private static getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D is not supported in this browser');
    }
    // After the `if` check, TypeScript knows ctx is not null here.
    // This is called *type narrowing*.
    return ctx;
  }

  // Draw everything for one frame.
  // It only READS from the game, never changes it.
  draw(game: Game): void {
    const board = game.board;
    this.drawBackground(board);
    this.drawCells(board);
    // Only show the ghost and falling piece while a game is in progress.
    if (game.state !== 'gameover') {
      this.drawGhost(game.ghostPiece());
      this.drawPiece(game.piece);
    }
    this.drawGridLines(board);
    if (game.flash) {
      this.drawFlash(board, game.flash);
    }
    this.drawNext(game.nextPiece);
  }

  private drawBackground(board: Board): void {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, board.cols * this.cellSize, board.rows * this.cellSize);
  }

  private drawCells(board: Board): void {
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const cell = board.grid[row][col];
        // Skip empty cells. Inside this `if`, TypeScript knows `cell` is a string.
        if (cell !== null) {
          this.drawBlock(this.ctx, col * this.cellSize, row * this.cellSize, this.cellSize, cell);
        }
      }
    }
  }

  // Draw the falling piece on top of the board.
  private drawPiece(piece: Piece): void {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] === 1) {
          // Matrix position + piece position = position on the board.
          const x = (piece.col + c) * this.cellSize;
          const y = (piece.row + r) * this.cellSize;
          this.drawBlock(this.ctx, x, y, this.cellSize, piece.color);
        }
      }
    }
  }

  // The ghost: an outline showing where the piece will land.
  private drawGhost(ghost: Piece): void {
    const size = this.cellSize;
    this.ctx.strokeStyle = ghost.color;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.45;

    for (let r = 0; r < ghost.matrix.length; r++) {
      for (let c = 0; c < ghost.matrix[r].length; c++) {
        if (ghost.matrix[r][c] === 1) {
          const x = (ghost.col + c) * size;
          const y = (ghost.row + r) * size;
          // strokeRect draws just the border of a rectangle.
          this.ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
        }
      }
    }
    this.ctx.globalAlpha = 1;
  }

  // Draw the next piece, centered in the small preview canvas.
  private drawNext(piece: Piece): void {
    const ctx = this.nextCtx;
    const size = this.previewCellSize;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    // Find the rows and columns that actually contain blocks, so we can
    // center the SHAPE (not its matrix, which may have empty edges).
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    piece.matrix.forEach((rowCells, r) => {
      rowCells.forEach((value, c) => {
        if (value === 1) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      });
    });

    const shapeWidth = (maxCol - minCol + 1) * size;
    const shapeHeight = (maxRow - minRow + 1) * size;
    const offsetX = (this.nextCanvas.width - shapeWidth) / 2;
    const offsetY = (this.nextCanvas.height - shapeHeight) / 2;

    piece.matrix.forEach((rowCells, r) => {
      rowCells.forEach((value, c) => {
        if (value === 1) {
          const x = offsetX + (c - minCol) * size;
          const y = offsetY + (r - minRow) * size;
          this.drawBlock(ctx, x, y, size, piece.color);
        }
      });
    });
  }

  // Draw one filled block with its top-left corner at pixel (x, y).
  // It takes the context to draw on, so it works for both canvases.
  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // A lighter strip on top gives the block a little depth.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x + 1, y + 1, size - 2, 4);
  }

  private drawGridLines(board: Board): void {
    const width = board.cols * this.cellSize;
    const height = board.rows * this.cellSize;
    this.ctx.strokeStyle = GRID_LINE_COLOR;
    this.ctx.lineWidth = 1;

    for (let col = 0; col <= board.cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.cellSize + 0.5, 0);
      this.ctx.lineTo(col * this.cellSize + 0.5, height);
      this.ctx.stroke();
    }

    for (let row = 0; row <= board.rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.cellSize + 0.5);
      this.ctx.lineTo(width, row * this.cellSize + 0.5);
      this.ctx.stroke();
    }
  }

  // The line-clear effect: a bright band on each cleared row that swells
  // outward and fades away.
  private drawFlash(board: Board, flash: LineFlash): void {
    // `progress` goes from 0 (just cleared) to 1 (flash is over).
    const progress = 1 - flash.timeLeft / FLASH_DURATION_MS;
    const width = board.cols * this.cellSize;
    // The band grows up to half a cell above and below the row...
    const grow = progress * this.cellSize * 0.5;
    // ...while getting more see-through. globalAlpha sets the opacity of
    // everything drawn until we change it back.
    this.ctx.globalAlpha = 1 - progress;

    for (const row of flash.rows) {
      const y = row * this.cellSize;
      // Soft outer glow in the game's accent color...
      this.ctx.fillStyle = '#ff8a5c';
      this.ctx.fillRect(0, y - grow, width, this.cellSize + grow * 2);
      // ...with a bright white core.
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, y + this.cellSize * 0.25, width, this.cellSize * 0.5);
    }

    this.ctx.globalAlpha = 1; // back to fully opaque for the next frame
  }
}
