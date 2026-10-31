import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ExpressionHeatmap from './expression_heatmap.jsx';

const RESOLVE_URL = '/backend/gene_list/resolve';
const ENRICHMENT_URL = '/backend/gene_list/enrichment';
const ANNOTATIONS_URL = '/backend/gene_list/annotations';
// set by the "Analyze" gene list page before navigating here
const LOCAL_STORAGE_KEY = 'geneListAnalysis';

const CATEGORIES = [
  { key: 'regulator', label: 'Transcriptional regulators', checked: true },
  { key: 'phenotype', label: 'Phenotypes', checked: true },
  { key: 'complex', label: 'Complexes', checked: true },
  { key: 'pathway', label: 'Pathways', checked: true },
  { key: 'domain', label: 'Protein domains (InterPro)', checked: true },
  { key: 'disease', label: 'Human diseases', checked: true },
  { key: 'go_process', label: 'GO biological process', checked: false },
  { key: 'go_function', label: 'GO molecular function', checked: false },
  { key: 'go_component', label: 'GO cellular component', checked: false },
];

const FDR_OPTIONS = ['0.01', '0.05', '0.1', '0.25'];

const ANNOTATION_TYPES = [
  { key: 'gene_info', label: 'Gene information', help: 'names, feature type, coordinates, description' },
  { key: 'go', label: 'GO annotations', help: 'all GO annotations with evidence and references' },
  { key: 'phenotype', label: 'Phenotypes', help: 'same columns as phenotype_data.tab' },
  { key: 'interaction', label: 'Interactions', help: 'same columns as interaction_data.tab' },
  { key: 'regulation', label: 'Regulation', help: 'list genes as regulator or target' },
  { key: 'disease', label: 'Human disease', help: 'Disease Ontology annotations' },
  { key: 'ptm', label: 'Post-translational modifications', help: 'modification sites' },
  { key: 'protein_properties', label: 'Protein properties', help: 'MW, pI, CAI, GRAVY, composition…' },
  { key: 'protein_abundance', label: 'Protein abundance', help: 'molecules/cell by condition' },
  { key: 'complex', label: 'Complexes', help: 'Complex Portal membership' },
  { key: 'pathway', label: 'Pathways', help: 'YeastPathways' },
  { key: 'homolog', label: 'Homologs', help: 'human, model organisms and fungi' },
  { key: 'literature', label: 'Literature', help: 'Literature Guide papers by topic' },
];

const ALLIANCE_SPECIES = [
  'Homo sapiens',
  'Mus musculus',
  'Rattus norvegicus',
  'Danio rerio',
  'Drosophila melanogaster',
  'Caenorhabditis elegans',
  'Xenopus tropicalis',
];

const HOMOLOG_FILTERS = {
  all: { label: 'All species', species: null },
  human: { label: 'Human only', species: ['Homo sapiens'] },
  alliance: { label: 'Human and model organisms (Alliance)', species: ALLIANCE_SPECIES },
};

const EXAMPLE_LIST =
  'GAL1 GAL7 GAL10 GAL2 GAL3 GAL80 MEL1 PGM2\n' +
  'MET3 MET14 MET16 MET10 MET5 MET17 SAM1 SAM2 MUP1 SUL1 SUL2\n' +
  'PRE1 PRE2 PRE3 PRE4 PUP1 PUP2 PUP3 SCL1 PRE5 PRE6 PRE7 PRE8 PRE9 PRE10';

const STATUS_LABEL = {
  matched: 'success',
  ambiguous: 'warning',
  retired: 'alert',
  not_found: 'alert',
};

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }
    return response.json();
  });
}

function downloadTsv(filename, header, rows) {
  const clean = (v) => (v === null || v === undefined ? '' : String(v).replace(/[\t\n]/g, ' '));
  const text = [header].concat(rows).map((r) => r.map(clean).join('\t')).join('\n') + '\n';
  const blob = new Blob([text], { type: 'text/tab-separated-values' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatP(value) {
  if (value === null || value === undefined) return '';
  return value < 0.001 ? value.toExponential(2) : value.toFixed(4);
}

function locusName(locus) {
  return locus.gene_name ? locus.gene_name + ' (' + locus.systematic_name + ')' : locus.systematic_name;
}

const GeneListAnalysis = createReactClass({
  displayName: 'GeneListAnalysis',

  propTypes: {
    history: PropTypes.any,
  },

  getInitialState() {
    let categories = {};
    CATEGORIES.forEach((c) => {
      categories[c.key] = c.checked;
    });
    return {
      genes: '',
      background: '',
      showBackground: false,
      categories: categories,
      fdr: '0.05',
      isPending: false,
      error: null,
      resolution: null,
      ambiguousChoices: {},
      showAllResolution: false,
      enrichment: null,
      expanded: {},
      annotationTypes: { gene_info: true, go: true, phenotype: true },
      interactionScope: 'any',
      homologFilter: 'all',
      annotations: {},
      previewType: null,
      showExpression: false,
    };
  },

  componentDidMount() {
    let stored = null;
    try {
      stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      stored = null;
    }
    if (stored) {
      this.setState({ genes: stored.trim().split(/\s+/).join('\n') });
    }
  },

  selectedCategories() {
    return CATEGORIES.filter((c) => this.state.categories[c.key]).map((c) => c.key);
  },

  resolvedIds() {
    let ids = this.state.resolution ? this.state.resolution.resolved_ids.slice() : [];
    Object.keys(this.state.ambiguousChoices).forEach((input) => {
      const id = parseInt(this.state.ambiguousChoices[input]);
      if (id && ids.indexOf(id) < 0) ids.push(id);
    });
    return ids;
  },

  handleSubmit(e) {
    e.preventDefault();
    if (!this.state.genes.trim()) {
      this.setState({ error: 'Please enter at least one gene.' });
      return;
    }
    this.setState({
      isPending: true,
      error: null,
      resolution: null,
      enrichment: null,
      ambiguousChoices: {},
      expanded: {},
      annotations: {},
      previewType: null,
      showExpression: false,
    });
    postJson(RESOLVE_URL, { identifiers: this.state.genes })
      .then((resolution) => {
        if (resolution.error) throw new Error(resolution.error);
        this.setState({ resolution: resolution }, () => this.runEnrichment());
      })
      .catch((err) => this.setState({ isPending: false, error: err.message }));
  },

  runEnrichment() {
    const ids = this.resolvedIds();
    if (!ids.length) {
      this.setState({ isPending: false, error: 'None of the genes could be matched to an SGD locus.' });
      return;
    }
    if (!this.selectedCategories().length) {
      // ID mapping / annotation download only
      this.setState({ isPending: false, enrichment: null });
      return;
    }
    let body = {
      bioent_ids: ids,
      categories: this.selectedCategories(),
      fdr_cutoff: parseFloat(this.state.fdr),
    };
    if (this.state.showBackground && this.state.background.trim()) {
      body.background_genes = this.state.background;
    }
    this.setState({ isPending: true, error: null });
    postJson(ENRICHMENT_URL, body)
      .then((enrichment) => {
        if (enrichment.error) throw new Error(enrichment.error);
        this.setState({ isPending: false, enrichment: enrichment });
      })
      .catch((err) => this.setState({ isPending: false, error: err.message }));
  },

  handleReset(e) {
    e.preventDefault();
    this.setState(this.getInitialState());
  },

  toggleCategory(key) {
    let categories = Object.assign({}, this.state.categories);
    categories[key] = !categories[key];
    this.setState({ categories: categories });
  },

  chooseAmbiguous(input, value) {
    let choices = Object.assign({}, this.state.ambiguousChoices);
    if (value) {
      choices[input] = value;
    } else {
      delete choices[input];
    }
    this.setState({ ambiguousChoices: choices });
  },

  toggleExpanded(key) {
    let expanded = Object.assign({}, this.state.expanded);
    expanded[key] = !expanded[key];
    this.setState({ expanded: expanded });
  },

  downloadResolution() {
    const rows = [];
    this.state.resolution.results.forEach((r) => {
      const loci = r.loci.length ? r.loci : [null];
      loci.forEach((l) => {
        rows.push([
          r.input,
          r.status,
          r.match_type,
          l ? l.systematic_name : '',
          l ? l.gene_name : '',
          l ? l.sgdid : '',
          l ? l.qualifier : '',
          r.also_alias_of.map((a) => a.display_name).join(','),
        ]);
      });
    });
    downloadTsv(
      'sgd_gene_list_resolution.tsv',
      ['input', 'status', 'match_type', 'systematic_name', 'gene_name', 'sgdid', 'qualifier', 'also_alias_of'],
      rows
    );
  },

  downloadCategory(category) {
    downloadTsv(
      'sgd_enrichment_' + category.category + '.tsv',
      ['term_id', 'term', 'genes_in_list', 'list_total', 'genes_in_background', 'background_total',
        'fold_enrichment', 'pvalue', 'fdr', 'genes'],
      category.results.map((r) => [
        r.term.id,
        r.term.display_name,
        r.list_count,
        r.list_total,
        r.background_count,
        r.background_total,
        r.fold_enrichment,
        r.pvalue,
        r.fdr,
        r.genes.map((g) => g.display_name).join(','),
      ])
    );
  },

  applyAmbiguousChoices() {
    this.runEnrichment();
    // refresh annotation tables that were built from the previous gene set
    if (Object.keys(this.state.annotations).length) this.fetchAnnotations();
  },

  toggleAnnotationType(key) {
    let types = Object.assign({}, this.state.annotationTypes);
    types[key] = !types[key];
    this.setState({ annotationTypes: types });
  },

  setAnnotation(key, value) {
    this.setState((state) => {
      let annotations = Object.assign({}, state.annotations);
      annotations[key] = value;
      return { annotations: annotations };
    });
  },

  fetchAnnotations() {
    const ids = this.resolvedIds();
    const types = ANNOTATION_TYPES.filter((t) => this.state.annotationTypes[t.key]).map((t) => t.key);
    if (!ids.length || !types.length) return;
    this.setState({ annotations: {}, previewType: null });
    // one request per data type, so each result appears as soon as it is ready
    types.forEach((key) => {
      this.setAnnotation(key, { pending: true });
      let body = { bioent_ids: ids, data_type: key };
      if (key === 'interaction') body.interaction_scope = this.state.interactionScope;
      if (key === 'homolog' && HOMOLOG_FILTERS[this.state.homologFilter].species) {
        body.homolog_species = HOMOLOG_FILTERS[this.state.homologFilter].species;
      }
      postJson(ANNOTATIONS_URL, body)
        .then((result) => {
          if (result.error) throw new Error(result.error);
          this.setAnnotation(key, result);
        })
        .catch((err) => this.setAnnotation(key, { error: err.message }));
    });
  },

  downloadAnnotation(result) {
    downloadTsv('sgd_gene_list_' + result.data_type + '.tsv', result.columns, result.rows);
  },

  downloadAllAnnotations() {
    const ready = ANNOTATION_TYPES.map((t) => this.state.annotations[t.key]).filter((r) => r && r.rows && r.rows.length);
    // stagger the downloads; browsers may ask once to allow multiple files
    ready.forEach((result, i) => setTimeout(() => this.downloadAnnotation(result), i * 400));
  },

  renderAnnotationPanel() {
    if (!this.state.resolution || !this.resolvedIds().length) return null;
    const annotations = this.state.annotations;
    const requested = ANNOTATION_TYPES.filter((t) => annotations[t.key]);
    const anyPending = requested.some((t) => annotations[t.key].pending);
    const anyReady = requested.some((t) => annotations[t.key].rows && annotations[t.key].rows.length);
    return (
      <div className="panel">
        <h3>Download annotations</h3>
        <p>
          Download SGD data for the {this.resolvedIds().length} matched genes. Columns follow the corresponding SGD
          download files where one exists.
        </p>
        <div className="row">
          {ANNOTATION_TYPES.map((t) => (
            <div key={t.key} className="large-4 medium-6 columns end">
              <input
                type="checkbox"
                id={'gla_ann_' + t.key}
                checked={!!this.state.annotationTypes[t.key]}
                onChange={() => this.toggleAnnotationType(t.key)}
              />
              <label htmlFor={'gla_ann_' + t.key}>
                {t.label} <small style={{ textTransform: 'none' }}>({t.help})</small>
              </label>
            </div>
          ))}
        </div>
        <div className="row">
          <div className="large-6 columns">
            <label>
              <b>Interactions</b>
              <select
                value={this.state.interactionScope}
                onChange={(e) => this.setState({ interactionScope: e.target.value })}
              >
                <option value="any">All interactions of the list genes</option>
                <option value="within">Only interactions between list genes</option>
              </select>
            </label>
          </div>
          <div className="large-6 columns">
            <label>
              <b>Homologs</b>
              <select
                value={this.state.homologFilter}
                onChange={(e) => this.setState({ homologFilter: e.target.value })}
              >
                {Object.keys(HOMOLOG_FILTERS).map((k) => (
                  <option key={k} value={k}>
                    {HOMOLOG_FILTERS[k].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <button className="button small" onClick={this.fetchAnnotations} disabled={anyPending}>
          {anyPending ? 'Retrieving…' : 'Get annotations'}
        </button>{' '}
        {anyReady ? (
          <button className="button small secondary" onClick={this.downloadAllAnnotations}>
            Download all (TSV)
          </button>
        ) : null}
        {requested.length ? (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Rows</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requested.map((t) => this.renderAnnotationRow(t, annotations[t.key]))}
            </tbody>
          </table>
        ) : null}
        {this.renderAnnotationPreview()}
      </div>
    );
  },

  renderAnnotationRow(type, result) {
    let rows = null;
    let actions = null;
    if (result.pending) {
      rows = 'retrieving…';
    } else if (result.error) {
      rows = <span className="label alert">{result.error}</span>;
    } else {
      rows = result.row_count.toLocaleString() + (result.truncated ? ' (truncated)' : '');
      if (result.row_count) {
        actions = (
          <span>
            <a onClick={() => this.downloadAnnotation(result)}>Download TSV</a>
            {' | '}
            <a onClick={() => this.setState({ previewType: this.state.previewType === type.key ? null : type.key })}>
              {this.state.previewType === type.key ? 'Hide preview' : 'Preview'}
            </a>
          </span>
        );
      }
    }
    return (
      <tr key={type.key}>
        <td>
          {type.label}
          {result.source_file ? <small> · {result.source_file} format</small> : null}
        </td>
        <td>{rows}</td>
        <td>{actions}</td>
      </tr>
    );
  },

  renderAnnotationPreview() {
    const result = this.state.previewType && this.state.annotations[this.state.previewType];
    if (!result || !result.rows) return null;
    const rows = result.rows.slice(0, 20);
    return (
      <div style={{ overflowX: 'auto' }}>
        <h4>
          {result.label} <small>first {rows.length} of {result.row_count.toLocaleString()} rows</small>
        </h4>
        <table className="table">
          <thead>
            <tr>
              {result.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j}>{String(v).length > 80 ? String(v).slice(0, 80) + '…' : v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },

  renderExpressionPanel() {
    const ids = this.resolvedIds();
    if (!this.state.resolution || !ids.length) return null;
    if (!this.state.showExpression) {
      return (
        <div className="panel">
          <h3>Expression</h3>
          <p>
            Heatmap of log2 expression ratios for the list across the SGD expression datasets (the data behind SPELL),
            clustered, with the datasets where these genes respond most shown first.
          </p>
          <button className="button small" onClick={() => this.setState({ showExpression: true })}>
            Show expression heatmap
          </button>
        </div>
      );
    }
    return <ExpressionHeatmap geneIds={ids} />;
  },

  renderForm() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="row">
          <div className="large-6 columns">
            <label>
              <b>Gene list</b> (one per line, or separated by spaces/commas). Accepts gene and systematic names,
              aliases, SGDIDs, UniProtKB, NCBI Gene and RefSeq IDs.
              <textarea
                rows="12"
                value={this.state.genes}
                onChange={(e) => this.setState({ genes: e.target.value })}
                placeholder="e.g. ACT1, YFL039C, S000001855, P60010"
              />
            </label>
            <a onClick={() => this.setState({ genes: EXAMPLE_LIST })}>Use example list</a>
            {' | '}
            <a onClick={() => this.setState({ showBackground: !this.state.showBackground })}>
              {this.state.showBackground ? 'Use default background' : 'Use a custom background list'}
            </a>
            {this.state.showBackground ? (
              <label style={{ marginTop: '1rem' }}>
                <b>Background list</b> (e.g. all genes detected in your screen). By default each category uses all
                genes with at least one annotation in that category.
                <textarea
                  rows="6"
                  value={this.state.background}
                  onChange={(e) => this.setState({ background: e.target.value })}
                />
              </label>
            ) : null}
          </div>
          <div className="large-6 columns">
            <b>Enrichment categories</b> <small>(uncheck all to only map IDs and download annotations)</small>
            {CATEGORIES.map((c) => (
              <div key={c.key}>
                <input
                  type="checkbox"
                  id={'gla_' + c.key}
                  checked={this.state.categories[c.key]}
                  onChange={() => this.toggleCategory(c.key)}
                />
                <label htmlFor={'gla_' + c.key}>{c.label}</label>
              </div>
            ))}
            <label style={{ marginTop: '1rem' }}>
              <b>FDR cutoff</b> (Benjamini-Hochberg)
              <select value={this.state.fdr} onChange={(e) => this.setState({ fdr: e.target.value })}>
                {FDR_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <p>
              <small>
                GO categories use GO Term Finder with the default genome background and take longer to compute.
              </small>
            </p>
          </div>
        </div>
        <div className="row">
          <div className="large-12 columns">
            <button type="submit" className="button small" disabled={this.state.isPending}>
              {this.state.isPending ? 'Running…' : 'Analyze'}
            </button>{' '}
            <button type="button" className="button small secondary" onClick={this.handleReset}>
              Reset
            </button>
          </div>
        </div>
      </form>
    );
  },

  renderResolution() {
    const resolution = this.state.resolution;
    if (!resolution) return null;
    const s = resolution.summary;
    const rows = resolution.results.filter(
      (r) =>
        this.state.showAllResolution ||
        r.status !== 'matched' ||
        r.also_alias_of.length ||
        ['gene name', 'systematic name', 'SGDID'].indexOf(r.match_type) < 0
    );
    return (
      <div className="panel">
        <h3>Gene identifiers</h3>
        <p>
          {s.total} entered: <span className="label success">{s.matched} matched</span>{' '}
          <span className="label warning">{s.ambiguous} ambiguous</span>{' '}
          <span className="label alert">{s.retired} retired</span>{' '}
          <span className="label alert">{s.not_found} not found</span> → {s.unique_loci} unique genes used.{' '}
          <a onClick={this.downloadResolution}>Download mapping (TSV)</a>
        </p>
        {rows.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Input</th>
                <th>Status</th>
                <th>Matched as</th>
                <th>SGD gene</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.input}>
                  <td>{r.input}</td>
                  <td>
                    <span className={'label ' + STATUS_LABEL[r.status]}>{r.status.replace('_', ' ')}</span>
                  </td>
                  <td>{r.match_type}</td>
                  <td>{this.renderMatchedLoci(r)}</td>
                  <td>{this.renderResolutionNote(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>All identifiers matched a current gene name, systematic name or SGDID.</p>
        )}
        <a onClick={() => this.setState({ showAllResolution: !this.state.showAllResolution })}>
          {this.state.showAllResolution ? 'Show only identifiers needing attention' : 'Show all identifiers'}
        </a>
        {resolution.summary.ambiguous ? (
          <p style={{ marginTop: '1rem' }}>
            <button className="button tiny" onClick={this.applyAmbiguousChoices} disabled={this.state.isPending}>
              Apply selected ambiguous genes
            </button>
          </p>
        ) : null}
      </div>
    );
  },

  renderMatchedLoci(r) {
    if (r.status === 'ambiguous') {
      return (
        <select
          value={this.state.ambiguousChoices[r.input] || ''}
          onChange={(e) => this.chooseAmbiguous(r.input, e.target.value)}
        >
          <option value="">-- exclude --</option>
          {r.loci.map((l) => (
            <option key={l.id} value={l.id}>
              {locusName(l)}
            </option>
          ))}
        </select>
      );
    }
    return r.loci.map((l) => (
      <a key={l.id} href={l.link}>
        {locusName(l)}
      </a>
    ));
  },

  renderResolutionNote(r) {
    if (r.status === 'retired') {
      return r.retired.systematic_name + ' (' + r.retired.sgdid + ') is ' + r.retired.status + ' in SGD';
    }
    if (r.status === 'not_found') return 'No SGD gene with this name or ID';
    if (r.status === 'ambiguous') return 'Shared by ' + r.loci.length + ' genes; choose one or leave excluded';
    if (r.also_alias_of.length) {
      return 'Also an alias of ' + r.also_alias_of.map((a) => locusName(a)).join(', ');
    }
    return null;
  },

  renderEnrichment() {
    const enrichment = this.state.enrichment;
    if (!enrichment) return null;
    return (
      <div>
        <h3>Enrichment</h3>
        <p>
          {enrichment.gene_count} genes; FDR ≤ {enrichment.fdr_cutoff}; at least {enrichment.min_overlap} genes per
          term; background: {enrichment.background}.
        </p>
        {enrichment.categories.map((c) => this.renderCategory(c))}
      </div>
    );
  },

  renderCategory(category) {
    const expanded = this.state.expanded[category.category];
    const results = expanded ? category.results : category.results.slice(0, 10);
    const isGo = category.category.indexOf('go_') === 0;
    return (
      <div key={category.category} className="panel">
        <h4>
          {category.label}{' '}
          <small>
            {category.results.length} significant term{category.results.length === 1 ? '' : 's'}
            {isGo
              ? ''
              : ' · ' +
                category.list_annotated +
                ' of your genes annotated · ' +
                category.terms_tested +
                ' terms tested'}
          </small>
        </h4>
        {category.note ? (
          <p>
            <small>{category.note}</small>
          </p>
        ) : null}
        {results.length ? (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Term</th>
                <th>Genes in list</th>
                {isGo ? null : <th>Genes in background</th>}
                {isGo ? null : <th>Fold</th>}
                <th>P-value</th>
                {isGo ? null : <th>FDR</th>}
                {isGo ? null : <th>Genes</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.term.id}>
                  <td>{r.term.link ? <a href={r.term.link}>{r.term.display_name}</a> : r.term.display_name}</td>
                  <td>{isGo ? r.list_count : r.list_count + ' / ' + r.list_total}</td>
                  {isGo ? null : <td>{r.background_count + ' / ' + r.background_total}</td>}
                  {isGo ? null : <td>{r.fold_enrichment}</td>}
                  <td>{formatP(r.pvalue)}</td>
                  {isGo ? null : <td>{formatP(r.fdr)}</td>}
                  {isGo ? null : (
                    <td>
                      {r.genes.map((g, i) => (
                        <span key={g.id}>
                          {i ? ', ' : ''}
                          <a href={g.link}>{g.display_name}</a>
                        </span>
                      ))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No significantly enriched terms.</p>
        )}
        {category.results.length > 10 ? (
          <a onClick={() => this.toggleExpanded(category.category)}>
            {expanded ? 'Show top 10' : 'Show all ' + category.results.length}
          </a>
        ) : null}
        {category.results.length ? (
          <span>
            {category.results.length > 10 ? ' | ' : ''}
            <a onClick={() => this.downloadCategory(category)}>Download (TSV)</a>
          </span>
        ) : null}
        {category.truncated ? (
          <p>
            <small>Only the top {category.results.length} terms are shown.</small>
          </p>
        ) : null}
      </div>
    );
  },

  render() {
    return (
      <div>
        <h1>Gene List Analysis</h1>
        <hr />
        <p>
          Map a list of yeast gene identifiers to current SGD genes, find transcriptional regulators, phenotypes,
          complexes, pathways, protein domains and diseases that are over-represented in the list, view the genes'
          expression across SGD expression datasets, and download SGD annotations for the genes.
        </p>
        {this.renderForm()}
        {this.state.error ? <div className="alert-box alert">{this.state.error}</div> : null}
        {this.state.isPending ? <div className="sgd-loader" /> : null}
        {this.renderResolution()}
        {this.renderAnnotationPanel()}
        {this.renderExpressionPanel()}
        {this.renderEnrichment()}
      </div>
    );
  },
});

export default GeneListAnalysis;
