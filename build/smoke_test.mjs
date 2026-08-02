// Smoke test: execute a built application.js bundle in a jsdom sandbox that
// mimics the production script-tag environment (jQuery + foundation/datatables
// globals already present), and report whether it runs cleanly and exposes the
// expected window.views surface. Run against golden + esbuild bundles to diff.
//
//   node build/smoke_test.mjs /path/to/application.js

import { JSDOM } from 'jsdom';
import fs from 'fs';

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('usage: node build/smoke_test.mjs <bundle.js>');
  process.exit(2);
}

const dom = new JSDOM(
  '<!DOCTYPE html><html><body><div id="root"></div><div id="reactApp"></div></body></html>',
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://www.yeastgenome.org/' }
);
const { window } = dom;

// jQuery + plugins are provided by <script> tags before application.js in prod.
// Load the real vendor scripts in the same order as global_layout.jinja2 so the
// sandbox matches production (foundation/datatables register onto jQuery).
const B = 'src/sgd/frontend/yeastgenome/static/js/build';
const vendorScripts = [
  'bower_components/jquery/dist/jquery.min.js',
  `${B}/datatables/datatables.min.js`,
  `${B}/datatables/datatables.foundation.min.js`,
  `${B}/foundation.min.js`,
];
for (const s of vendorScripts) {
  try {
    window.eval(fs.readFileSync(s, 'utf8'));
  } catch (e) {
    console.error(`vendor load failed (${s}): ${e.message}`);
  }
}
const $ = window.$;

// jsdom lacks a couple of browser APIs old deps poke at.
window.matchMedia = window.matchMedia || function () {
  return { matches: false, media: '', addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
};
window.scrollTo = window.scrollTo || function () {};

const errors = [];
window.addEventListener('error', (e) => errors.push('window.onerror: ' + (e.message || e)));
process.on('unhandledRejection', () => {}); // async AJAX from setup() will reject offline; ignore

let syncError = null;
try {
  window.eval(fs.readFileSync(bundlePath, 'utf8'));
} catch (e) {
  syncError = e && (e.stack || e.message || String(e));
}

const views = window.views || {};
const viewKeys = Object.keys(views).sort();
const types = {};
viewKeys.forEach((k) => (types[k] = typeof views[k]));

console.log(JSON.stringify({
  bundle: bundlePath,
  bytes: fs.statSync(bundlePath).size,
  syncError,
  windowErrors: errors,
  reactVersion: (window.React && window.React.version) || null,
  viewCount: viewKeys.length,
  viewKeys,
  nonFunctionViews: viewKeys.filter((k) => types[k] !== 'function' && types[k] !== 'object'),
}, null, 2));
