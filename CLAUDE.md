# Cursed Blocks

A falling-block puzzle game I'm building in TypeScript, drawn on an HTML canvas and bundled
with Vite. No game engine or UI framework.

The twist: it doesn't use the classic four-cube pieces. It has its own set of 12 pieces made of
2 to 6 cubes, and a new "curse" piece unlocks at each level from 2 to 6. The name and look are
my own, so don't use the Tetris name or copy its style.

## Rules
- Work only on the step I ask for. Don't build ahead.
- Keep the code simple and readable, with no extra libraries. I'm learning TypeScript, so add a
  short comment when you use something new, and I must be able to explain every line.
- After each step, briefly explain what you changed and why, then stop.
- Don't commit. I'll commit myself.
- Keep README.md up to date when features or controls change.

## The pieces
- Level 1: Duo, Line, Corner, LongL, Step, TeeLong and Chunk.
- Then one curse per level: Bridge (2), Plus (3), Zag (4), Fork (5) and Crown (6).
- Every piece matrix must be square and at most 4×4, so rotation and the Next preview keep
  working.

## Files (all in `src/`)
- `types.ts`: shared types (cells, the grid, pieces, game state).
- `pieces.ts`: the piece table with colours and unlock levels, rotation, and the shuffled bag
  that picks the next piece.
- `board.ts`: the grid: collisions, placing pieces and clearing lines.
- `game.ts`: the rules: gravity, moves, scoring (100/300/500/800 × level), levels (every 10
  lines), pause, game over and restart.
- `renderer.ts`: all the drawing: board, ghost piece, current piece, line-clear flash and the
  Next preview. No game logic here.
- `input.ts`: keyboard controls, which only call game actions.
- `main.ts`: connects everything, runs the game loop and updates the side panel. The high score
  is saved in localStorage.

Keep the game logic separate from the drawing and the input.

## Checking changes
There are no tests yet. TypeScript runs in strict mode, so unused variables and type mistakes
fail the build. After each change, run `npm run typecheck`, then play it in the browser.

## Commands
- `npm run dev`: run it locally at http://localhost:5173/cursed-blocks/
- `npm run typecheck`: check the TypeScript without building
- `npm run build`: type check, then build into `dist/`
- `npm run preview`: serve the built version


