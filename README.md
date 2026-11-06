# Cursed Blocks

A falling-block puzzle game where none of the pieces are the ones you're used to. Instead of the
classic four-cube shapes, you get awkward pieces of 2 to 6 cubes, and a nastier one unlocks every
level as the game speeds up.

**Play it here:** https://leonkozak.github.io/cursed-blocks/

![Cursed Blocks gameplay](docs/screenshot.png)

## Features

- 12 original pieces, with a new "curse" unlocking at levels 2 to 6
- Ghost piece, next piece preview and pause
- Score, levels and a high score saved in your browser

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/LeonKozak/cursed-blocks.git
cd cursed-blocks
npm install
npm run dev
```

Then open http://localhost:5173.

## How it's built

TypeScript and an HTML canvas, bundled with Vite. No game engine or UI framework. Game logic,
drawing and input are kept in separate files in `src/`.

I built it with [Claude Code](https://www.anthropic.com/claude-code), one step at a time, using
the rules in [CLAUDE.md](CLAUDE.md).