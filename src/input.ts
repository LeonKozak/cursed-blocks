import type { Game } from './game';

// Connect the keyboard to the game. Input only CALLS game actions;
// the rules of what a move does live in Game.
export function setupInput(game: Game): void {
  // `keydown` fires when a key is pressed, and again repeatedly while it is
  // held down. TypeScript knows `event` is a KeyboardEvent for 'keydown'.
  document.addEventListener('keydown', (event) => {
    // `event.code` names the physical key, e.g. 'ArrowLeft' or 'Space'.
    switch (event.code) {
      case 'ArrowLeft':
        game.moveLeft();
        break;
      case 'ArrowRight':
        game.moveRight();
        break;
      case 'ArrowDown':
        game.softDrop();
        break;
      case 'ArrowUp':
        // `event.repeat` is true for the automatic repeats of a held key.
        // Ignore those so holding ↑ doesn't spin the piece wildly.
        if (!event.repeat) game.rotate();
        break;
      case 'Space':
        if (!event.repeat) game.hardDrop();
        break;
      case 'KeyP':
        if (!event.repeat) game.togglePause();
        break;
      case 'Enter':
        // Enter starts a new game, but only from the game-over screen.
        if (game.state === 'gameover') game.restart();
        break;
      default:
        return; // Some other key: let the browser handle it normally.
    }
    // Stop the arrow keys and Space from scrolling the page (and stop the
    // browser doing anything else with keys the game uses).
    event.preventDefault();
  });
}
