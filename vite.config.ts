// Vite configuration file. Vite reads this automatically when you run
// `npm run dev`, `npm run build` or `npm run preview`.
import { defineConfig } from "vite";

// `defineConfig` is just a helper that gives TypeScript autocomplete and
// type checking for the options object below.
export default defineConfig({
  // GitHub Pages serves this project from https://<user>.github.io/cursed-blocks/
  // (a sub-folder, not the site root), so every built file path must start
  // with /cursed-blocks/ instead of /.
  base: "/cursed-blocks/",
});
