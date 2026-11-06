  import type { Cell, Grid, Piece } from './types';
// `import type` imports only types. They vanish when TypeScript compiles to
// JavaScript, so this adds nothing to the final bundle.

// A class bundles data (properties) and behavior (methods) together.
export class Board {
  // `readonly` means these can be set in the constructor but never changed later.
  readonly cols: number;
  readonly rows: number;
  // The cells of the board. Other code can read it; Board methods change it.
  grid: Grid;

  // The constructor runs once when you write `new Board(10, 20)`.
  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Board.createEmptyGrid(cols, rows);
  }

  // `static` methods belong to the class itself, not to one board object,
  // so they are called as `Board.createEmptyGrid(...)`.
  // `private` means only code inside this class may call it.
  private static createEmptyGrid(cols: number, rows: number): Grid {
    // Array.from({ length: n }, fn) builds an array of n items by calling fn.
    // Each row is a NEW array, so changing one row never affects another.
    return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));
  }

  // Is (col, row) inside the board?
  isInside(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;  
  }

  // Would this piece hit something at its current position?
  // For now "something" means the walls and the floor. In step 6 we'll also
  // check for blocks that have already landed.
  collides(piece: Piece): boolean {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        // Only the filled squares of the matrix matter, not the empty 0s.
        if (piece.matrix[r][c] === 1 && !this.isInside(piece.col + c, piece.row + r)) {
          return true;
        }
      }
    }
    return false;
  }

  // Fill a single cell with a color (or null to empty it).
  setCell(col: number, row: number, value: Cell): void {
    if (this.isInside(col, row)) {
      this.grid[row][col] = value;
    }
  }

  // Empty the whole board (useful later for restarting).
  reset(): void {
    this.grid = Board.createEmptyGrid(this.cols, this.rows);
  }
}
