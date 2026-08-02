// Validates the standalone-bundled cluster_strains web worker: feeds it the same
// {lociData, strainData} message shape variant_viewer_store posts, and asserts it
// posts back a hierarchical cluster whose leaves carry the strain ids.
import fs from 'fs';
import vm from 'vm';

const workerSource = fs.readFileSync(process.argv[2], 'utf8');

let posted = null;
const listeners = {};
const self = {
  addEventListener: (type, fn) => { listeners[type] = fn; },
  postMessage: (data) => { posted = data; },
};
const context = vm.createContext({ self, globalThis: {}, console });
context.globalThis = context;
vm.runInContext(workerSource, context);

// two genes, three strains; strain 3 differs most
const msg = {
  lociData: [
    { snp_seqs: [{ snp_sequence: 'AAAA' }, { snp_sequence: 'AAAA' }, { snp_sequence: 'TTTT' }] },
    { snp_seqs: [{ snp_sequence: 'GGGG' }, { snp_sequence: 'GGGA' }, { snp_sequence: 'CCCC' }] },
  ],
  strainData: [{ name: 'S1', id: 1 }, { name: 'S2', id: 2 }, { name: 'S3', id: 3 }],
};

listeners.message({ data: JSON.stringify(msg) });

const tree = JSON.parse(posted);
const leafIds = [];
(function walk(n) {
  if (!n.children) { leafIds.push(n.value && n.value.id); return; }
  n.children.forEach(walk);
})(tree);
leafIds.sort();

const ok = leafIds.length === 3 && leafIds.join(',') === '1,2,3';
console.log(JSON.stringify({ posted: !!posted, leafIds, ok }));
process.exit(ok ? 0 : 1);
