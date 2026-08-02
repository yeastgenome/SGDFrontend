// esbuild bundler for the SGDFrontend JSX application bundle.
//
// Replaces the legacy grunt + browserify + babelify(babel 6) + uglifyify + envify
// pipeline that produced src/sgd/frontend/yeastgenome/static/js/application.js.
//
// Usage:
//   node build/esbuild.mjs production   # minified, no sourcemap (deploy)
//   node build/esbuild.mjs development  # readable, inline sourcemap
//   node build/esbuild.mjs watch        # development + rebuild on change
//
// jquery / foundation / datatables / foundationDatatables are loaded as <script>
// tags in global_layout.jinja2 BEFORE application.js (see browserify-shim + the
// "browser" field in package.json). The old build shimmed require('jquery') to the
// global $. We reproduce that here by resolving those specifiers to the globals
// instead of bundling them.

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTFILE =
  process.env.ESBUILD_OUT ||
  path.join(ROOT, 'src/sgd/frontend/yeastgenome/static/js/application.js');

const mode = process.argv[2] || 'production';
const isProd = mode === 'production';
const isWatch = mode === 'watch';

// jQuery is loaded via a <script> tag before application.js; require('jquery')
// resolves to the global (matches the old browserify-shim "global:$").
//
// foundation / datatables / foundationDatatables are jQuery plugins that register
// onto jQuery as a side effect. The old build BUNDLED them from bower (see the
// "browser" field that used to be in package.json) so they always registered onto
// the same jQuery the bundle uses. We replicate that here -- externalizing them
// instead would rely on script-tag load order and break $(...).foundation().
const bowerBundled = {
  foundation: 'bower_components/foundation/js/foundation.min.js',
  datatables: 'bower_components/datatables/media/js/jquery.dataTables.js',
  foundationDatatables:
    'bower_components/datatables-plugins/integration/foundation/dataTables.foundation.js',
};

const runtimeGlobalsPlugin = {
  name: 'runtime-globals',
  setup(build) {
    build.onResolve({ filter: /^jquery$/ }, () => ({
      path: 'jquery',
      namespace: 'runtime-global',
    }));
    build.onLoad({ filter: /.*/, namespace: 'runtime-global' }, () => ({
      contents: 'module.exports = window.jQuery;',
      loader: 'js',
    }));
    build.onResolve(
      { filter: /^(foundation|datatables|foundationDatatables)$/ },
      (args) => ({ path: path.join(ROOT, bowerBundled[args.path]) })
    );
  },
};

// browserify auto-injected shims for process / global that many old CommonJS
// deps assume exist. esbuild does not, so provide minimal ones at the top of the
// bundle. Worker-safe: uses globalThis/self, not window (workers have no window).
const banner = {
  js:
    "var _g=typeof globalThis!=='undefined'?globalThis:(typeof self!=='undefined'?self:this);" +
    '_g.global=_g.global||_g;' +
    '_g.process=_g.process||{env:{}};' +
    "_g.process.env.NODE_ENV=_g.process.env.NODE_ENV||'" +
    (isProd ? 'production' : 'development') +
    "';",
};

const commonBuildOptions = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2015'],
  minify: isProd,
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
  },
  banner,
  legalComments: 'none',
  logOverride: { 'direct-eval': 'silent' },
};

// The variant viewer runs its strain-clustering in a Web Worker. The old code used
// `webworkify`, which built a same-origin Blob worker by reading browserify's
// internal module registry (via `arguments[3..5]`) -- impossible under esbuild.
// This plugin bundles the worker entry as its own self-contained IIFE and inlines
// it as a string, so the call site can build the same same-origin Blob worker
// (important because prod serves JS cross-origin from CloudFront, where a plain
// `new Worker(url)` would violate same-origin).
const workerInlinePlugin = {
  name: 'worker-inline',
  setup(build) {
    build.onResolve({ filter: /^worker:/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.slice('worker:'.length)),
      namespace: 'worker-inline',
    }));
    build.onLoad({ filter: /.*/, namespace: 'worker-inline' }, async (args) => {
      const result = await esbuild.build({
        ...commonBuildOptions,
        entryPoints: [args.path],
        write: false,
        logLevel: 'silent',
        plugins: [runtimeGlobalsPlugin],
      });
      const workerSource = result.outputFiles[0].text;
      return {
        contents: 'module.exports = ' + JSON.stringify(workerSource) + ';',
        loader: 'js',
      };
    });
  },
};

const options = {
  ...commonBuildOptions,
  entryPoints: [path.join(ROOT, 'client/jsx/application.jsx')],
  outfile: OUTFILE,
  sourcemap: isProd ? false : 'inline',
  plugins: [runtimeGlobalsPlugin, workerInlinePlugin],
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('esbuild: watching client/jsx for changes...');
} else {
  await esbuild.build(options);
  console.log(`esbuild: wrote ${OUTFILE} (${mode})`);
}
