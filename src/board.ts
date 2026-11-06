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
  // "Something" = a wall, the floor, or a block that has already landed.
  collides(piece: Piece): boolean {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        // Only the filled squares of the matrix matter, not the empty 0s.
        if (piece.matrix[r][c] !== 1) continue;

        const col = piece.col + c;
        const row = piece.row + r;
        // Outside the board → hit a wall or the floor.
        if (!this.isInside(col, row)) return true;
        // Inside the board but the cell is already filled → hit a landed block.
        if (this.grid[row][col] !== null) return true;
      }
    }
    return false;
  }

  // "Lock" a piece: copy its blocks into the grid, so they become part of
  // the board and stay there after the piece itself is gone.
  merge(piece: Piece): void {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] === 1) {
          this.setCell(piece.col + c, piece.row + r, piece.color);
        }
      }
    }
  }

  // Remove every full row and let the rows above fall down to fill the gap.
  // Returns the row numbers that were cleared (empty array if none), so the
  // game can count them for score and show an effect where they were.
  clearLines(): number[] {
    // A row is full when `every` cell in it is not null.
    const isFull = (row: Cell[]): boolean => row.every((cell) => cell !== null);
    // ^ An *arrow function* stored in a variable, with typed parameter and return.

    // Remember WHICH rows are full. `forEach` runs a function for each item;
    // the second argument is the item's index (here: the row number).
    const clearedRows: number[] = [];
    this.grid.forEach((row, index) => {
      if (isFull(row)) clearedRows.push(index);
    });

    // `filter` keeps only the items for which the function returns true,
    // so this keeps the rows that are NOT full.
    const remaining = this.grid.filter((row) => !isFull(row));

    // Add one new empty row at the TOP for each row we removed, so the board
    // is the right height again and everything above the gap has moved down.
    const newRows = Board.createEmptyGrid(this.cols, clearedRows.length);
    // `[...a, ...b]` joins two arrays into a new one (array spread).
    this.grid = [...newRows, ...remaining];

    return clearedRows;
  }

  // Fill a single cell with a color (or null to empty it).
  setCell(col: number, row: number, value: Cell): void {
    if (this.isInside(col, row)) {
      this.grid[row][col] = value;
    }
  }

  // Empty the whole board (used when restarting).
  reset(): void {
    this.grid = Board.createEmptyGrid(this.cols, this.rows);
  }
}
