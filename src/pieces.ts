import type { Matrix, Piece, PieceType } from './types';

// Everything we need to know about one kind of piece.
interface PieceInfo {
  name: string;        // shown to the player, e.g. in the unlock banner
  matrix: Matrix;      // the shape: 1 = cube, 0 = empty
  color: string;
  unlockLevel: number; // the piece starts appearing from this level on
}

// The full piece table: one entry per piece, all in one place.
// `Record<K, V>` is an object type whose keys are K and values are V.
// Because K is PieceType, TypeScript checks that EVERY piece type has an
// entry here — forgetting one (or a typo like 'Plsu') is an error.
// Every matrix is square (2x2, 3x3 or 4x4), which keeps rotation simple.
const PIECES: Record<PieceType, PieceInfo> = {
  // ----- Level 1: helpers and the starting set -----
  Duo: {
    name: 'Duo',
    color: '#e8e6f5',
    unlockLevel: 1,
    matrix: [
      [1, 1],
      [0, 0],
    ],
  },
  Line: {
    name: 'Line',
    color: '#a3e635',
    unlockLevel: 1,
    matrix: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  Corner: {
    name: 'Corner',
    color: '#ffd93d',
    unlockLevel: 1,
    matrix: [
      [1, 0],
      [1, 1],
    ],
  },
  LongL: {
    name: 'Long L',
    color: '#ff9f45',
    unlockLevel: 1,
    matrix: [
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 0, 0],
    ],
  },
  Step: {
    name: 'Step',
    color: '#6bcb77',
    unlockLevel: 1,
    matrix: [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  TeeLong: {
    name: 'Tee-long',
    color: '#ff6b6b',
    unlockLevel: 1,
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  Chunk: {
    name: 'Chunk',
    color: '#4dd4c6',
    unlockLevel: 1,
    matrix: [
      [1, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },

  // ----- Unlocked later: the curses get nastier -----
  Bridge: {
    name: 'Bridge',
    color: '#4d96ff',
    unlockLevel: 2,
    matrix: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  Plus: {
    name: 'Plus',
    color: '#c77dff',
    unlockLevel: 3,
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  Zag: {
    name: 'Zag',
    color: '#ff5fa2',
    unlockLevel: 4,
    matrix: [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
    ],
  },
  Fork: {
    name: 'Fork',
    color: '#8b8bff',
    unlockLevel: 5,
    matrix: [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  },
  Crown: {
    name: 'Crown',
    color: '#b91c1c',
    unlockLevel: 6,
    matrix: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
};

// All piece types, taken from the table above.
// `Object.keys` gives an object's keys, but TypeScript types them as plain
// `string[]` (it can't be sure the object has no extra keys). We KNOW the
// keys are exactly the PieceTypes, so `as PieceType[]` tells TypeScript that.
export const PIECE_TYPES = Object.keys(PIECES) as PieceType[];

// The piece types that may appear at this level.
export function unlockedTypes(level: number): PieceType[] {
  return PIECE_TYPES.filter((type) => PIECES[type].unlockLevel <= level);
}

// The piece types that unlock at EXACTLY this level (for the unlock banner).
export function typesUnlockingAt(level: number): PieceType[] {
  return PIECE_TYPES.filter((type) => PIECES[type].unlockLevel === level);
}

// The display name of a piece type, e.g. 'LongL' → 'Long L'.
export function pieceName(type: PieceType): string {
  return PIECES[type].name;
}

// Make a new piece of the given type, centered at the top of the board.
export function createPiece(type: PieceType, boardCols: number): Piece {
  // Copy every row so changing this piece later (e.g. rotating it)
  // never changes the shared template in PIECES.
  // `[...row]` is *spread syntax*: it makes a new array with the same items.
  const matrix = PIECES[type].matrix.map((row) => [...row]);
  const width = matrix[0].length;

  return {
    type,                 // shorthand for `type: type`
    matrix,
    color: PIECES[type].color,
    col: Math.floor((boardCols - width) / 2),
    row: 0,
  };
}

// Return a NEW matrix turned 90° clockwise (the original is not changed).
// Row r of the result is column r of the original, read from bottom to top.
// `_row` starts with an underscore to say "I don't use this parameter";
// that keeps the `noUnusedParameters` check happy.
export function rotateClockwise(matrix: Matrix): Matrix {
  return matrix.map((_row, r) => matrix.map((row) => row[r]).reverse());
}

// A "bag" of pieces: put one of every unlocked piece in, shuffle, and hand
// them out one at a time. When the bag is empty, refill and shuffle again.
// This is fairer than picking completely at random: you never wait very
// long for the piece you need, because every piece comes once per bag.
export class PieceBag {
  private bag: PieceType[] = [];

  // Take the next piece. `level` decides which pieces go in at the next refill,
  // so a newly unlocked piece joins from the next bag on.
  next(level: number, boardCols: number): Piece {
    if (this.bag.length === 0) {
      this.bag = PieceBag.shuffle(unlockedTypes(level));
    }
    // `pop()` removes and returns the last item. The bag is never empty here,
    // but TypeScript can't know that, so pop() is typed `PieceType | undefined`;
    // `!` says "trust me, there is one".
    const type = this.bag.pop()!;
    return createPiece(type, boardCols);
  }

  // Fisher–Yates shuffle: walk from the end of the array to the start, and
  // swap each item with a random item at or before it. Every order is
  // equally likely. Returns a new shuffled array (the input is not changed).
  private static shuffle<T>(items: T[]): T[] {
    // `<T>` makes this a *generic* function: it works for an array of any
    // type T, and returns an array of that same type.
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Swap two items using *array destructuring*.
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
