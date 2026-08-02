// dart-sass compiler for the SGDFrontend stylesheets. Replaces the Ruby Compass
// build (grunt-contrib-compass), removing the Ruby toolchain + Compass gem.
//
//   node build/sass.mjs            # compressed (deploy/default)
//   node build/sass.mjs expanded   # readable (debugging)
//
// Compiles the non-partial entries in client/scss (style.scss, normalize.scss)
// to src/sgd/frontend/yeastgenome/static/css/*.css, matching the old compass task
// (outputStyle: compressed, load paths for the app scss + bower foundation).

import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCSS_DIR = path.join(ROOT, 'client/scss');
const OUT_DIR =
  process.env.SASS_OUT ||
  path.join(ROOT, 'src/sgd/frontend/yeastgenome/static/css');

const style = process.argv[2] === 'expanded' ? 'expanded' : 'compressed';

// Old compass config: sassDir=client/scss, importPath=[bower foundation scss].
const loadPaths = [
  SCSS_DIR,
  path.join(ROOT, 'bower_components/foundation/scss'),
];

// Compass compiled every non-partial (no leading underscore) .scss in sassDir.
const entries = fs
  .readdirSync(SCSS_DIR)
  .filter((f) => f.endsWith('.scss') && !f.startsWith('_'));

let failed = false;
for (const entry of entries) {
  const outName = entry.replace(/\.scss$/, '.css');
  try {
    const result = sass.compile(path.join(SCSS_DIR, entry), {
      style,
      loadPaths,
      silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'slash-div', 'mixed-decls'],
      quietDeps: true,
      // emit @charset "UTF-8" so the raw non-ASCII content chars (e.g. ·, ▸) that
      // dart-sass writes unescaped are decoded correctly regardless of how the
      // stylesheet is served (Compass used a BOM + \00b7 escapes instead).
      charset: true,
    });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, outName), result.css);
    console.log(`sass: ${entry} -> css/${outName} (${result.css.length} bytes, ${style})`);
  } catch (e) {
    failed = true;
    console.error(`sass: FAILED on ${entry}\n${e.message}`);
  }
}

process.exit(failed ? 1 : 0);
