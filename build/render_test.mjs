// Real-page render test: load a live URL with jsdom acting as a headless browser
// (fetches + executes the page's real scripts, including the deployed
// application.js bundle and backend AJAX), then report app-level JS errors and
// whether React rendered content.
//
//   node build/render_test.mjs http://127.0.0.1:6545/<path>

import { JSDOM, VirtualConsole } from 'jsdom';

const url = process.argv[2];
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + ((e.detail && e.detail.message) || e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));

let dom;
try {
  dom = await JSDOM.fromURL(url, {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // browser APIs jsdom lacks that page/vendor scripts poke at
      window.matchMedia = () => ({ matches: false, media: '', addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      window.scrollTo = () => {};
      // jsdom has no native fetch (the app now relies on the browser's; the old
      // bundle polyfilled it via isomorphic-fetch). Stub it so search pages render.
      window.fetch = window.fetch || (() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve('') }));
      // Web Workers aren't implemented by jsdom; the variant viewer only spins one
      // up on user interaction, but stub it so a stray load-time call won't crash.
      window.Worker = function () { this.postMessage = () => {}; this.addEventListener = () => {}; this.terminate = () => {}; };
      window.URL.createObjectURL = window.URL.createObjectURL || (() => 'blob:stub');
    },
  });
} catch (e) {
  console.log(JSON.stringify({ url, fatal: e.message }));
  process.exit(1);
}

const { window } = dom;
window.addEventListener('error', (e) => errors.push('window.onerror: ' + ((e.error && e.error.message) || e.message)));

await new Promise((r) => setTimeout(r, 6000));

const doc = window.document;
const reactNodes = doc.querySelectorAll('[data-reactroot], [data-reactid], #reactApp *, .reactApp *');
// ignore noise from third-party/analytics/asset 404s; keep app + framework errors
const ignore = /googletag|gtag|analytics|doubleclick|adsystem|favicon|recaptcha|Could not load|Failed to (load|parse)|net::|ERR_| resource| img\b|stylesheet|css/i;
const appErrors = errors.filter((e) => !ignore.test(e));

console.log(JSON.stringify({
  url,
  title: doc.title,
  bodyChars: doc.body ? doc.body.innerHTML.length : 0,
  reactNodeCount: reactNodes.length,
  appErrorCount: appErrors.length,
  appErrors: appErrors.slice(0, 15),
}, null, 2));

if (typeof window.close === 'function') window.close();
process.exit(0);
