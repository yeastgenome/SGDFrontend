// Dev watcher: rebuilds the JS bundle (esbuild watch) and recompiles SCSS on
// change. Replaces `grunt dev` / grunt-contrib-watch + grunt-concurrent.
// (Livereload from the old grunt watch is dropped; hard-refresh the browser.)

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (args) => spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });

// JS: esbuild's own watch mode (build/esbuild.mjs watch).
run([path.join(ROOT, 'build/esbuild.mjs'), 'watch']);

// CSS: recompile on any .scss change (debounced).
const SCSS_DIR = path.join(ROOT, 'client/scss');
let timer = null;
const rebuildCss = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('sass: change detected, recompiling...');
    run([path.join(ROOT, 'build/sass.mjs')]);
  }, 100);
};
rebuildCss();
fs.watch(SCSS_DIR, { recursive: true }, (_evt, file) => {
  if (file && file.endsWith('.scss')) rebuildCss();
});
console.log('watch: esbuild (JS) + sass (CSS) watching client/ for changes...');
