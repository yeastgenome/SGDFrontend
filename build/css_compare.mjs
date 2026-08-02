// Verifies the dart-sass CSS is equivalent to the Ruby-Compass CSS modulo dropped
// legacy vendor prefixes. Tokenizes both compressed stylesheets into
// selector-block declaration sets, drops vendor-prefixed declarations (by property
// or by value), canonicalizes the rest, and reports any non-prefix differences.
//
//   node build/css_compare.mjs golden.css new.css

import fs from 'fs';

const isVendor = (decl) => {
  const [propRaw, ...rest] = decl.split(':');
  const prop = propRaw.trim().toLowerCase();
  const val = rest.join(':').toLowerCase();
  if (/^-(webkit|moz|ms|o)-/.test(prop)) return true;
  if (/-(webkit|moz|ms|o)-|data:image\/svg|progid:|color-stop|-webkit-gradient/.test(val)) return true;
  return false;
};

// canonicalize a declaration/selector so only *functional* differences remain.
// Normalizes the known cosmetic differences between Ruby Sass and dart-sass:
//   lowercase, strip whitespace/quotes, round decimals (5 vs 10 places),
//   .8 -> 0.8 (leading zero), transparent <-> rgba(0,0,0,0).
const canon = (d) =>
  d
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/["']/g, '')
    .replace(/transparent/g, 'rgba(0,0,0,0)')
    .replace(/\bwhite\b/g, '#fff')
    .replace(/\bblack\b/g, '#000')
    .replace(/(\d*\.\d+)/g, (m) => String(parseFloat(parseFloat(m).toFixed(4))));

// parse compressed CSS into a map: selector-block -> Set(canonical non-vendor decls)
function parse(css) {
  const blocks = [];
  // split into "selector{body}" chunks (flat; nesting already resolved by sass)
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = canon(m[1].trim());
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .filter((d) => !isVendor(d))
      .map(canon)
      .sort();
    blocks.push({ sel, body: decls.join(';') });
  }
  return blocks;
}

const [goldenPath, newPath] = process.argv.slice(2);
const g = parse(fs.readFileSync(goldenPath, 'utf8'));
const n = parse(fs.readFileSync(newPath, 'utf8'));

// Order-independent set comparison: Ruby Sass and dart-sass may emit generated
// rules in a different order; what must match is the set of selector -> body rules.
// Also normalize selector-list ORDER within a rule (comma-separated groups).
const sortSel = (sel) => sel.split(',').sort().join(',');
const toMap = (blocks) => {
  const m = new Map();
  for (const b of blocks) {
    const key = sortSel(b.sel);
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(b.body);
  }
  // sort bodies so duplicate-selector order doesn't matter
  for (const [k, v] of m) m.set(k, v.sort());
  return m;
};
const gm = toMap(g);
const nm = toMap(n);

console.log(`golden rules: ${g.length} (${gm.size} unique sel), new rules: ${n.length} (${nm.size} unique sel)`);

let diffs = 0;
const report = (msg) => { if (diffs < 30) console.log(msg); diffs++; };

for (const [sel, gbodies] of gm) {
  if (!nm.has(sel)) { report(`ONLY IN GOLDEN: ${sel.slice(0, 120)}`); continue; }
  const nbodies = nm.get(sel);
  if (JSON.stringify(gbodies) !== JSON.stringify(nbodies)) {
    report(`BODY DIFF [${sel.slice(0, 90)}]:\n  golden: ${gbodies.join(' || ').slice(0, 200)}\n  new:    ${nbodies.join(' || ').slice(0, 200)}`);
  }
}
for (const sel of nm.keys()) {
  if (!gm.has(sel)) report(`ONLY IN NEW: ${sel.slice(0, 120)}`);
}
console.log(diffs === 0 ? 'IDENTICAL (modulo vendor prefixes + cosmetics)' : `${diffs} functional difference(s)`);
