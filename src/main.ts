import './style.css';
import { Board } from './board';
import { Game } from './game';
import { Renderer } from './renderer';
import { setupInput } from './input';

// Board size, measured in cells.
const COLS = 10;
const ROWS = 20;
// Size of one cell on screen, in pixels.
const CELL_SIZE = 30;
// The name the high score is saved under in the browser's localStorage.
const HIGH_SCORE_KEY = 'cursed-blocks-high-score';

// `as HTMLCanvasElement` tells TypeScript what kind of element this is,
// so it knows the canvas has methods like getContext().
const canvas = document.getElementById('board') as HTMLCanvasElement;
const nextCanvas = document.getElementById('next') as HTMLCanvasElement;

const board = new Board(COLS, ROWS);
const game = new Game(board);
const renderer = new Renderer(canvas, nextCanvas, board, CELL_SIZE);
setupInput(game);

// The side panel's number elements. getElementById returns
// `HTMLElement | null` (null if no element has that id), so we use `!`
// (the *non-null assertion*) to tell TypeScript "trust me, it exists".
// We know it does because the ids are in index.html.
const scoreEl = document.getElementById('score')!;
const bestEl = document.getElementById('best')!;
const levelEl = document.getElementById('level')!;
const linesEl = document.getElementById('lines')!;

// The overlays, the final score, and the Restart button.
const pausedEl = document.getElementById('paused')!;
const gameOverEl = document.getElementById('game-over')!;
const finalScoreEl = document.getElementById('final-score')!;
const newBestEl = document.getElementById('new-best')!;
const restartButton = document.getElementById('restart')!;
const unlockEl = document.getElementById('unlock')!;
const unlockNameEl = document.getElementById('unlock-name')!;

// ----- High score -----
// localStorage keeps small pieces of text in the browser, even after the
// page is closed. It can fail (e.g. in some private windows), so every use
// is wrapped in try/catch: if it fails, the game still works, it just
// won't remember the best score.

function loadHighScore(): number {
  try {
    // getItem returns `string | null`; Number(null) would be 0, which is fine.
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY));
    // If the saved text wasn't a number, Number() gives NaN. Treat that as 0.
    return Number.isFinite(saved) ? saved : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // Saving isn't possible here; ignore it.
  }
}

let highScore = loadHighScore();
// The best score from BEFORE this game, to tell if this game beat it.
let bestAtStart = highScore;

restartButton.addEventListener('click', () => {
  game.restart();
  // Take keyboard focus off the button. Otherwise pressing Space (hard drop)
  // would also "press" the focused button and restart the game again.
  restartButton.blur();
});

// Copy the game's numbers into the side panel and show/hide the overlays.
// `String(n)` turns a number into text, since textContent is a string.
function updatePanel(): void {
  // A new game has started (score is back to 0): remember the best so far.
  if (game.score === 0) {
    bestAtStart = highScore;
  }
  // Beat the high score? Update it and save it.
  if (game.score > highScore) {
    highScore = game.score;
    saveHighScore(highScore);
  }

  scoreEl.textContent = String(game.score);
  bestEl.textContent = String(highScore);
  levelEl.textContent = String(game.level);
  linesEl.textContent = String(game.lines);

  pausedEl.hidden = game.state !== 'paused';
  gameOverEl.hidden = game.state !== 'gameover';
  finalScoreEl.textContent = String(game.score);
  newBestEl.hidden = !(game.score > bestAtStart);

  // The unlock banner: shown while the game has a notice, but not on
  // top of the pause or game-over screens.
  const notice = game.unlockNotice;
  unlockEl.hidden = notice === null || game.state !== 'playing';
  if (notice) {
    // `join(' & ')` turns ['Zag'] into 'Zag' and ['A', 'B'] into 'A & B'.
    unlockNameEl.textContent = notice.names.join(' & ');
  }
}

// The time of the previous frame, so we can work out how much time passed.
let lastTime = performance.now();

// The game loop. requestAnimationFrame calls `loop` right before the browser
// paints the next frame (usually 60 times a second) and passes it the
// current time in milliseconds.
function loop(time: number): void {
  const dt = time - lastTime;
  lastTime = time;

  game.update(dt);                      // 1. change the game state
  renderer.draw(game);                  // 2. draw the new state
  updatePanel();                        //    and the side panel + overlays

  requestAnimationFrame(loop);          // 3. ask for the next frame
}

// If you switch to another tab mid-game, pause automatically so you don't
// come back to a lost game.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') {
    game.togglePause();
  }
});

requestAnimationFrame(loop);
