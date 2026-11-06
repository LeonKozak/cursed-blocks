# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Cursed Blocks" — a falling-block puzzle game in TypeScript, rendered on an HTML `<canvas>`, bundled with Vite. No UI framework. Original name and visual style (do not use the Tetris name/branding or copy its look). Cursed Blocks uses its **own 12-piece set** of 2- to 6-cube shapes, not the classic 4-cube shapes. Level 1: Duo, Line (helpers), Corner, LongL, Step, TeeLong, Chunk; then one unlocks per level: Bridge (2), Plus (3), Zag (4), Fork (5), Crown (6). Keep piece matrices square and at most 4×4 so rotation and the 4-cell Next preview keep working.

## Commands

- `npm run dev` — Vite dev server with hot reload (http://localhost:5173)
- `npm run typecheck` — `tsc --noEmit` type check only
- `npm run build` — type check, then production build to `dist/`
- `npm run preview` — serve the built `dist/`

There is no test runner or linter configured. Verify changes with `npm run typecheck` / `npm run build`, then in the browser.

## How we work

The user is learning and building this **step by step** from the plan in `C:\Users\leron\.claude\plans\i-want-to-create-polymorphic-star.md`. Implement one step at a time, keep code simple and readable (no extra libraries or abstractions), add short comments explaining new TypeScript concepts, and explain what changed after each step. Don't jump ahead to later steps.

Plan steps: 1 setup/grid (done) → 2 types + `Board` class (done) → 3 pieces (done) → 4 game loop/gravity (done) → 5 controls (done) → 6 collision/locking (done) → 7 line clearing (done) → 8 score/levels (done) → 9 game over/restart + line-clear flash (done) → 10 polish (done): next preview, ghost piece, pause (P + auto-pause on tab switch), high score in `localStorage`. All plan steps complete.

## Architecture

Entry point: `index.html` loads `src/main.ts` as an ES module; `main.ts` imports `src/style.css` (made possible by `src/vite-env.d.ts`). Currently: `types.ts` (Cell, Grid, Matrix, PieceType, Piece, GameState, LineFlash), `board.ts` (Board grid storage, `collides()` vs walls/floor/landed blocks, `merge()`, `clearLines()` returns cleared row indices), `pieces.ts` (`PIECES` table: name/color/unlockLevel/matrix per type; `unlockedTypes`, `typesUnlockingAt`, `createPiece`, `rotateClockwise`, `PieceBag` shuffled-bag picker), `game.ts` (Game: current piece, gravity in `update(dt)`, move/softDrop/hardDrop/rotate with wall nudges; `lockPiece()` merges, clears lines, adds score (100/300/500/800 × level), level = lines/10 + 1 speeds up gravity; pieces from `PieceBag`, `unlockNotice` banner on level-up unlocks, `nextPiece`, `ghostPiece()`, `togglePause()`; `state` playing/paused/gameover, gameover set when a new piece spawns overlapping, `restart()`, `flash` fades over `FLASH_DURATION_MS`; actions ignored when not playing), `input.ts` (`setupInput`: keyboard → game actions, P pauses, Enter restarts on game over), `renderer.ts` (`draw(game)`: board, ghost outline, current piece, line-clear flash, and the Next preview on a second canvas `#next`), `main.ts` (constants `COLS=10`, `ROWS=20`, `CELL_SIZE=30`, `requestAnimationFrame` loop, `updatePanel()` copies score/level/lines into the side panel and toggles the `#unlock` banner and `#paused`/`#game-over` overlays + Restart button in `index.html`; high score saved in `localStorage` key `cursed-blocks-high-score`). `README.md` is the GitHub readme — keep it in sync with features and controls..

Target module layout as steps progress (all in `src/`):
- `types.ts` — shared types (Cell, Matrix, Piece, GameState)
- `pieces.ts` — the piece table, unlock levels, rotation, shuffled bag
- `board.ts` — `Board` class: grid storage, `collides()`, `merge()`, `clearLines()`
- `game.ts` — `Game` class: state, `update(dt)`, scoring/levels, game over
- `renderer.ts` — `Renderer` class: all canvas drawing (no game logic)
- `input.ts` — keyboard → game actions
- `main.ts` — wires canvas, input, and the `requestAnimationFrame` loop

Keep logic (board/game) separate from drawing (renderer) and input.

`tsconfig.json` is `strict` with `noUnusedLocals`/`noUnusedParameters`, so unused variables fail the type check.
