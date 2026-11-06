# Cursed Blocks

A falling-block puzzle game with a twist: **none of the pieces are the ones you're used to.**

Instead of the usual four-cube shapes, Cursed Blocks throws awkward pieces of 2 to 6 cubes at you:
plus signs, bridges, staircases, forks and crowns. The longer you survive, the more cursed it gets.
Each level from 2 to 6 unlocks a nastier piece, while the pieces fall faster and faster.

Built from scratch in **TypeScript** on an HTML `<canvas>`, with no game engine, no UI framework and
no runtime dependencies.

<!-- Add a screenshot: save one as docs/screenshot.png, then uncomment the line below. -->
<!-- ![Cursed Blocks gameplay](docs/screenshot.png) -->

## Features

- **12 original pieces** made of 2 to 6 cubes, each with its own color
- **Pieces unlock as you level up**, with a banner announcing each new curse
- **Fair piece order.** Pieces come from a shuffled "bag", so you never wait forever for the one you need
- **Ghost piece** that shows where the current piece will land
- **Next piece** preview
- **Wall nudges.** A rotation that doesn't fit slides the piece over a column or two instead of failing
- **Line-clear flash** effect
- **Score, levels and lines.** The game speeds up every 10 lines
- **High score** saved in your browser
- **Pause** with `P`. The game also pauses automatically when you switch tabs
- **Game over** screen with instant restart

## How to play

Pieces fall from the top of a 10 × 20 board. Move and rotate them so they fill complete
horizontal rows. A full row disappears and everything above it drops down. The game ends when a
new piece has no room to appear.

### Controls

| Key   | Action                             |
| ----- | ---------------------------------- |
| ← / → | Move left / right                  |
| ↑     | Rotate clockwise                   |
| ↓     | Soft drop (one row)                |
| Space | Hard drop (straight to the bottom) |
| P     | Pause / resume                     |
| Enter | Restart (on the game-over screen)  |

### Scoring

Points depend on how many lines you clear with a single piece, multiplied by the current level:

| Lines cleared | Points      |
| ------------- | ----------- |
| 1             | 100 × level |
| 2             | 300 × level |
| 3             | 500 × level |
| 4             | 800 × level |

You go up one level every 10 lines, and each level the pieces fall a little faster.

### Tips

- **Save the small pieces.** Duo, Line and Corner are the best at plugging narrow gaps, so don't
  waste them on flat ground.
- **Keep the stack flat.** Bridge, Plus and Crown leave holes on uneven ground.
- **Watch the Next box** and plan where the coming piece will go before you drop the current one.
- **The Long L, Zag and Fork are 4 cubes tall.** Stand one upright in a deep well to clear up to
  4 lines at once for the biggest score.

## The pieces

You start with seven pieces, including two small helpers (Duo and Line) for plugging holes:

```
Duo    Line    Corner   Long L   Step    Tee-long   Chunk
##     ###     #.       #.       #..     ###        ##
               ##       #.       ##.     .#.        ##
                        #.       .##     .#.        #.
                        ##
```

Then the curses arrive, one per level:

```
Level 2   Level 3   Level 4   Level 5   Level 6
Bridge    Plus      Zag       Fork      Crown
#.#       .#.       .#        .#        #.#
###       ###       .#        ##        ###
          .#.       ##        .#        .#.
                    #.        .#
```

| Piece                                          | Cubes | Unlocks at |
| ---------------------------------------------- | ----- | ---------- |
| Duo                                            | 2     | Level 1    |
| Line, Corner                                   | 3     | Level 1    |
| Long L, Step, Tee-long, Chunk                  | 5     | Level 1    |
| Bridge                                         | 5     | Level 2    |
| Plus                                           | 5     | Level 3    |
| Zag                                            | 5     | Level 4    |
| Fork                                           | 5     | Level 5    |
| Crown                                          | 6     | Level 6    |

### How pieces are picked

Instead of choosing each piece completely at random, the game uses a **bag**. It puts one of every
unlocked piece into a bag, shuffles it, and deals them out one by one. When the bag is empty, it
refills and reshuffles. You see every unlocked piece once per bag, so no piece can go missing for
long. A newly unlocked piece joins the bag at the next refill.

## Getting started

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

### Scripts

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the dev server with instant reload                  |
| `npm run typecheck` | Check the TypeScript types without building               |
| `npm run build`     | Type-check, then build a production version into `dist/`  |
| `npm run preview`   | Serve the built `dist/` folder locally                    |

## How it's built

The code keeps **game logic**, **drawing** and **input** in separate files:

```
src/
  types.ts     Shared types: Cell, Grid, Matrix, Piece, PieceType, GameState, LineFlash
  pieces.ts    The piece table (shape, color, unlock level), rotation, the shuffled bag
  board.ts     Board class: the grid, collision checks, locking pieces, clearing lines
  game.ts      Game class: falling, moving, rotating, scoring, levels, unlocks, pause, game over
  renderer.ts  Renderer class: draws the board, ghost, pieces, flash and Next preview
  input.ts     Turns key presses into game actions
  main.ts      Wires it all together, updates the side panel, saves the high score,
               and runs the requestAnimationFrame loop
  style.css    Page layout and theme
index.html     The canvas, side panel, banner and overlays
```

A few ideas worth knowing if you read the code:

- **Pieces are small grids of 0s and 1s.** A `1` is a cube. Rotating a piece rotates its grid.
- **Moves are tested on a copy first.** The game builds the moved or rotated piece, asks the
  board whether it collides, and only keeps it if it fits.
- **Time-based falling.** Each frame measures the milliseconds since the last frame, so the game
  runs at the same speed on any screen refresh rate.
- **Logic never draws, and drawing never changes the game.** `Game` and `Board` hold the rules.
  `Renderer` only reads them to paint the canvas.

### Adding your own piece

1. Add a name to `PieceType` in `src/types.ts`.
2. Add one entry to the `PIECES` table in `src/pieces.ts` with its display `name`, `color`,
   `unlockLevel` and `matrix`. Keep the shape grid square (2×2, 3×3 or 4×4) so rotation and the
   Next preview work nicely.

TypeScript will point out anything you forgot.

### Tuning the difficulty

All the numbers that shape the game are named constants:

| What                              | Where                                     |
| --------------------------------- | ----------------------------------------- |
| When each piece unlocks           | `unlockLevel` in `PIECES`, `src/pieces.ts` |
| Starting fall speed               | `START_DROP_INTERVAL_MS` in `src/game.ts` |
| Speed-up per level / fastest speed | `SPEEDUP_PER_LEVEL_MS`, `MIN_DROP_INTERVAL_MS` in `src/game.ts` |
| Lines needed per level            | `LINES_PER_LEVEL` in `src/game.ts`        |
| Points per line clear             | `LINE_POINTS` in `src/game.ts`            |
| Board size                        | `COLS`, `ROWS` in `src/main.ts`           |

## Tech

- [TypeScript](https://www.typescriptlang.org/) in strict mode
- [Vite](https://vitejs.dev/) for the dev server and build
- HTML Canvas 2D for rendering
