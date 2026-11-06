// Shared types used across the game.
// `export` makes a type available to other files via `import`.

// A `type` alias gives a name to a type.
// `string | null` is a *union type*: a Cell is EITHER a color string
// (the cell is filled with a block of that color) OR null (the cell is empty).
export type Cell = string | null;

// A 2D grid of cells: an array of rows, where each row is an array of Cells.
// grid[row][col] — row 0 is the top of the board.
export type Grid = Cell[][];

// The shape of a piece: 1 = a block, 0 = empty space.
// matrix[row][col], just like the board grid.
export type Matrix = number[][];

// A *string literal union*: PieceType can ONLY be one of these exact strings.
// Writing any other string where a PieceType is expected is a type error.
// These are Cursed Blocks' own shapes (2 to 6 cubes), not the classic set.
// The `|` can start the first line too, which keeps long unions tidy.
export type PieceType =
  | 'Duo'
  | 'Line'
  | 'Corner'
  | 'LongL'
  | 'Step'
  | 'TeeLong'
  | 'Chunk'
  | 'Bridge'
  | 'Plus'
  | 'Zag'
  | 'Fork'
  | 'Crown';

// Whether the game is running, paused, or has ended.
export type GameState = 'playing' | 'paused' | 'gameover';

// A short flash where lines were just cleared.
export interface LineFlash {
  rows: number[];    // which board rows to flash
  timeLeft: number;  // milliseconds until the flash is gone
}

// An `interface` describes the shape of an object: which properties it has
// and their types. (A `type` alias could do this too; interfaces are the
// common choice for object shapes.)
export interface Piece {
  type: PieceType;
  matrix: Matrix;
  color: string;
  // Board position of the matrix's top-left corner.
  col: number;
  row: number;
}
