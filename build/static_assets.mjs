// Prepares vendor static assets from bower_components. Replaces the grunt
// `static` task (grunt-text-replace + grunt-contrib-concat + grunt-bowercopy).
// These outputs change only when the bower vendor deps change (rare); they are
// committed to the repo, so this normally runs only in a full/Docker build.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => path.join(ROOT, ...a);
const STATIC = 'src/sgd/frontend/yeastgenome/static';

// 1) text-replace: rewrite image paths in the datatables foundation CSS in place.
const dtCss = p('bower_components/datatables-plugins/integration/foundation/dataTables.foundation.css');
if (fs.existsSync(dtCss)) {
  const before = fs.readFileSync(dtCss, 'utf8');
  const after = before.split('images/').join('../img/');
  if (after !== before) fs.writeFileSync(dtCss, after);
  console.log('static: rewrote image paths in dataTables.foundation.css');
}

// 2) concat: build foundation.js from its component parts (separator '').
const foundationParts = [
  'bower_components/foundation/js/foundation/foundation.js',
  'bower_components/foundation/js/foundation/foundation.abide.js',
  'bower_components/foundation/js/foundation/foundation.accordion.js',
  'bower_components/foundation/js/foundation/foundation.alert.js',
  'bower_components/foundation/js/foundation/foundation.clearing.js',
  'bower_components/foundation/js/foundation/foundation.dropdown.js',
  'bower_components/foundation/js/foundation/foundation.equalizer.js',
  'bower_components/foundation/js/foundation/foundation.interchange.js',
  'bower_components/foundation/js/foundation/foundation.joyride.js',
  `${STATIC}/js/vendor/foundation/foundation.magellan.js`,
  'bower_components/foundation/js/foundation/foundation.offcanvas.js',
  'bower_components/foundation/js/foundation/foundation.orbit.js',
  'bower_components/foundation/js/foundation/foundation.reveal.js',
  'bower_components/foundation/js/foundation/foundation.slider.js',
  'bower_components/foundation/js/foundation/foundation.tab.js',
  'bower_components/foundation/js/foundation/foundation.tooltip.js',
  'bower_components/foundation/js/foundation/foundation.topbar.js',
];
const concatenated = foundationParts.map((f) => fs.readFileSync(p(f), 'utf8')).join('');
fs.writeFileSync(p('bower_components/foundation/js/foundation.js'), concatenated);
console.log(`static: concatenated ${foundationParts.length} files -> foundation.js`);

// 3) bowercopy:build: copy vendor font/image dirs into static/.
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
const copies = [
  ['bower_components/font-awesome/fonts', `${STATIC}/fonts`],
  ['bower_components/datatables-plugins/integration/foundation/images', `${STATIC}/img`],
];
for (const [src, dest] of copies) {
  copyDir(p(src), p(dest));
  console.log(`static: copied ${src} -> ${dest}`);
}
