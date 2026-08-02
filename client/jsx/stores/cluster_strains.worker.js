// Web Worker entry for strain clustering. cluster_strains.jsx exports a function
// that wires up self.onmessage; here we invoke it with the worker global `self`.
// Bundled as a standalone IIFE and inlined as a Blob at the call site (see the
// worker-inline plugin in build/esbuild.mjs), replacing the old `webworkify` usage.
import setupWorker from './cluster_strains.jsx';

setupWorker(self);
