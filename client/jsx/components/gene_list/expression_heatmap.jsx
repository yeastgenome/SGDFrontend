import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const EXPRESSION_URL = '/backend/gene_list/expression';

const MIN_CELL_WIDTH = 10;
const MAX_CELL_WIDTH = 28;
const CELL_HEIGHT = 16;
const MIN_GENE_COLUMN_WIDTH = 50;
const LABEL_HEIGHT = 185;
const LABEL_LENGTH = 34;
const DATASET_HEADER_HEIGHT = 22;
const CATEGORY_HEIGHT = 14;
const CLAMP = 2; // log2 ratio at which colors saturate (4-fold)

const UP = [215, 48, 39];
const DOWN = [69, 117, 180];
const NEUTRAL = [247, 247, 247];
const NO_DATA = '#d9d9d9';
const SEPARATOR = '2px solid #333';

const CATEGORY_COLORS = {
  'Stress response': '#e6550d',
  'Nutrients & metabolism': '#31a354',
  'Cell cycle & development': '#756bb1',
  'Gene regulation & chromatin': '#3182bd',
  Other: '#969696',
};

function cellColor(value) {
  if (value === null || value === undefined) return NO_DATA;
  const t = Math.min(Math.abs(value), CLAMP) / CLAMP;
  const target = value >= 0 ? UP : DOWN;
  const rgb = NEUTRAL.map((c, i) => Math.round(c + (target[i] - c) * t));
  return 'rgb(' + rgb.join(',') + ')';
}

function truncate(text, n) {
  if (n < 2) return '';
  return text.length > n ? text.slice(0, n - 1) + '…' : text;
}

function describeValue(value) {
  if (value === null || value === undefined) return 'no data';
  const fold = Math.pow(2, value);
  const foldText = fold >= 1 ? fold.toFixed(2) + '× up' : (1 / fold).toFixed(2) + '× down';
  return 'log2 ratio ' + value.toFixed(2) + ' (' + foldText + ')';
}

// Sample names within a dataset often share a long prefix ("Saccharomyces
// cerevisiae strain ... "); drop the shared words so the labels differ.
function shortLabels(labels) {
  if (labels.length < 2) return labels;
  const words = labels.map((l) => l.split(/(\s+)/));
  let common = 0;
  while (words.every((w) => common < w.length - 1 && w[common] === words[0][common])) common++;
  if (common < 2) return labels; // nothing worth stripping (a single word)
  return words.map((w) => w.slice(common).join('').trim() || w.join(''));
}

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => {
    if (!response.ok) throw new Error('Server returned ' + response.status);
    return response.json();
  });
}

const ExpressionHeatmap = createReactClass({
  displayName: 'ExpressionHeatmap',

  propTypes: {
    geneIds: PropTypes.array.isRequired,
  },

  getInitialState() {
    return { data: null, pending: false, error: null, datasetId: '', sort: 'clustered', hover: null, width: 0 };
  },

  componentDidMount() {
    this.load('');
    this.onResize = () => this.measure();
    window.addEventListener('resize', this.onResize);
    this.measure();
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  },

  componentDidUpdate(prevProps) {
    if (prevProps.geneIds.join(',') !== this.props.geneIds.join(',')) {
      this.load('');
    }
    this.measure();
  },

  measure() {
    if (this.panel && this.panel.clientWidth !== this.state.width) {
      this.setState({ width: this.panel.clientWidth });
    }
  },

  load(datasetId) {
    let body = { bioent_ids: this.props.geneIds };
    if (datasetId) body.dataset_id = parseInt(datasetId);
    this.setState({ pending: true, error: null, datasetId: datasetId, hover: null });
    postJson(EXPRESSION_URL, body)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        this.setState({ data: this.prepare(data), pending: false });
      })
      .catch((err) => this.setState({ pending: false, error: err.message }));
  },

  // Adds dataset numbers and per-dataset shortened sample labels.
  prepare(data) {
    let number = {};
    data.shown_datasets.forEach((d, k) => {
      number[d.id] = k + 1;
    });
    data.columns.forEach((c) => {
      c.number = number[c.dataset_id];
    });
    data.shown_datasets.forEach((d) => {
      const cols = data.columns.filter((c) => c.dataset_id === d.id);
      shortLabels(cols.map((c) => c.label)).forEach((short, k) => {
        cols[k].short_label = short;
      });
    });
    return data;
  },

  geneOrder() {
    const data = this.state.data;
    if (this.state.sort === 'clustered') return data.gene_order;
    const shown = {};
    data.gene_order.forEach((i) => {
      shown[i] = true;
    });
    return data.genes.map((g, i) => i).filter((i) => shown[i]);
  },

  columnOrder() {
    const data = this.state.data;
    return this.state.sort === 'clustered' ? data.column_order : data.columns.map((c, i) => i);
  },

  datasetsById() {
    let byId = {};
    this.state.data.shown_datasets.forEach((d) => {
      byId[d.id] = d;
    });
    return byId;
  },

  layout() {
    const data = this.state.data;
    const longest = Math.max.apply(null, data.gene_order.map((i) => data.genes[i].display_name.length).concat([3]));
    const geneColumn = Math.max(MIN_GENE_COLUMN_WIDTH, longest * 7.5 + 12);
    const available = (this.state.width || 900) - geneColumn - 4;
    const cell = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, Math.floor(available / Math.max(1, data.columns.length))));
    return { geneColumn: geneColumn, cell: cell };
  },

  download() {
    const data = this.state.data;
    const datasets = this.datasetsById();
    const columns = this.columnOrder();
    let lines = [
      '# SGD expression matrix: log2 expression ratios (SPELL datasets)',
      '# Genes: ' + data.gene_order.length + '; conditions: ' + data.columns.length,
      '# Datasets: ' + data.shown_datasets.map((d, k) => k + 1 + '. ' + d.accession + ' ' + d.name).join(' | '),
      '# Generated: ' + new Date().toISOString().slice(0, 10),
      ['Gene', 'Systematic Name', 'Description']
        .concat(columns.map((j) => datasets[data.columns[j].dataset_id].accession + '|' + data.columns[j].label))
        .join('\t'),
    ];
    this.geneOrder().forEach((i) => {
      const g = data.genes[i];
      const values = columns.map((j) => (data.values[i][j] === null ? '' : data.values[i][j]));
      lines.push([g.display_name, g.systematic_name, g.description.replace(/\s+/g, ' ')].concat(values).join('\t'));
    });
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/tab-separated-values' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sgd_expression_matrix_' + data.gene_order.length + 'genes.tsv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  renderControls() {
    const data = this.state.data;
    const topLabel = 'Most responsive datasets for this list (' + (this.state.datasetId ? '' : data.columns.length + ' conditions, ') +
      'top ' + data.shown_datasets.length + ')';
    return (
      <div className="row">
        <div className="large-8 columns">
          <label>
            <b>Study</b>
            <select value={this.state.datasetId} onChange={(e) => this.load(e.target.value)} disabled={this.state.pending}>
              <option value="">{this.state.datasetId ? 'Most responsive datasets for this list' : topLabel}</option>
              {data.ranked_datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {(d.flattened ? '⚠ ' : '') + truncate(d.name, 80) + ' (' + d.sample_count + ' samples' +
                    (d.flattened ? ', values mostly 0 — unreliable)' : ', +' + d.score.toFixed(2) + ')')}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="large-2 columns">
          <label>
            <b>Order</b>
            <select value={this.state.sort} onChange={(e) => this.setState({ sort: e.target.value })}>
              <option value="clustered">Clustered</option>
              <option value="original">Input / sample order</option>
            </select>
          </label>
        </div>
        <div className="large-2 columns">
          <button className="button small secondary" style={{ marginTop: '1.4rem' }} onClick={this.download}>
            Download matrix (TSV)
          </button>
        </div>
      </div>
    );
  },

  renderLegend() {
    const gradient =
      'linear-gradient(to right, ' + cellColor(-CLAMP) + ', ' + cellColor(0) + ', ' + cellColor(CLAMP) + ')';
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem', margin: '0.5rem 0' }}>
        <span>
          <b>log2 ratio:</b> ≤ −{CLAMP} (¼×){' '}
          <span style={{ display: 'inline-block', width: 120, height: 12, background: gradient, verticalAlign: 'middle' }} />{' '}
          ≥ +{CLAMP} (4×)
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: NO_DATA, verticalAlign: 'middle' }} /> No data
        </span>
        <span>
          <b>Category:</b>{' '}
          {this.state.data.categories.map((c) => (
            <span key={c} style={{ marginRight: '0.6rem', whiteSpace: 'nowrap' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: CATEGORY_COLORS[c], verticalAlign: 'middle' }} />{' '}
              {c}
            </span>
          ))}
        </span>
      </div>
    );
  },

  renderInfoBar() {
    const hover = this.state.hover;
    const data = this.state.data;
    let text = <i>Hover over a cell, gene, condition or dataset number to see details</i>;
    if (hover) {
      const parts = [];
      if (hover.gene !== undefined) {
        const g = data.genes[hover.gene];
        parts.push(<b key="g">{g.display_name}</b>, ' ' + g.systematic_name);
        if (hover.column === undefined) parts.push(' — ' + g.description);
      }
      if (hover.column !== undefined) {
        const c = data.columns[hover.column];
        const d = this.datasetsById()[c.dataset_id];
        if (hover.gene !== undefined) parts.push(' | ' + describeValue(data.values[hover.gene][hover.column]));
        parts.push((hover.gene !== undefined ? ' | ' : '') + c.label + ' | ', <b key="d">{c.number + '. '}</b>,
          d.name + ' (' + d.accession + ') | ' + d.category);
      }
      if (hover.dataset !== undefined) {
        const d = this.datasetsById()[hover.dataset];
        parts.push(<b key="d">{hover.number + '. ' + d.name}</b>, ' (' + d.accession + ', ' + d.sample_count + ' samples) | ' + d.category);
      }
      text = parts;
    }
    // fixed single-line height: a wrapping bar would shift the heatmap under the pointer
    return (
      <div
        style={{ background: '#f4f4f4', padding: '0 0.6rem', height: '2rem', lineHeight: '2rem', fontSize: '0.85rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {text}
      </div>
    );
  },

  renderHeatmap() {
    const data = this.state.data;
    const datasets = this.datasetsById();
    const genes = this.geneOrder();
    const columns = this.columnOrder();
    const size = this.layout();
    const startsBlock = (k) => k > 0 && data.columns[columns[k]].dataset_id !== data.columns[columns[k - 1]].dataset_id;
    const cellStyle = (k) => ({
      width: size.cell,
      height: CELL_HEIGHT,
      flex: '0 0 ' + size.cell + 'px',
      borderLeft: startsBlock(k) ? SEPARATOR : 'none',
      boxSizing: 'border-box',
    });
    const stickyName = {
      position: 'sticky',
      left: 0,
      background: '#fff',
      zIndex: 1,
      width: size.geneColumn,
      flex: '0 0 ' + size.geneColumn + 'px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      fontSize: '0.85rem',
      lineHeight: CELL_HEIGHT + 'px',
      paddingRight: 4,
      boxSizing: 'border-box',
    };
    // contiguous dataset blocks in display order
    let blocks = [];
    columns.forEach((j, k) => {
      if (k === 0 || startsBlock(k)) blocks.push({ dataset: data.columns[j].dataset_id, number: data.columns[j].number, count: 0 });
      blocks[blocks.length - 1].count += 1;
    });
    return (
      <div style={{ overflow: 'auto', maxHeight: '75vh', border: '1px solid #ddd' }} onMouseLeave={() => this.setState({ hover: null })}>
        <div style={{ display: 'inline-block' }}>
          <div style={{ display: 'flex', height: DATASET_HEADER_HEIGHT }}>
            <div style={Object.assign({}, stickyName, { height: DATASET_HEADER_HEIGHT, fontSize: '0.8rem', color: '#666', textAlign: 'right' })}>
              Dataset
            </div>
            {blocks.map((b, k) => {
              const width = b.count * size.cell;
              const name = datasets[b.dataset].name;
              return (
                <div key={k}
                  onMouseEnter={() => this.setState({ hover: { dataset: b.dataset, number: b.number } })}
                  style={{ width: width, flex: '0 0 ' + width + 'px', height: DATASET_HEADER_HEIGHT, boxSizing: 'border-box',
                    borderLeft: k ? SEPARATOR : 'none', background: '#eef2f7', fontSize: '0.8rem', lineHeight: DATASET_HEADER_HEIGHT + 'px',
                    padding: '0 2px', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                  {b.number}
                  <span style={{ fontWeight: 'normal' }}>{' ' + truncate(name, Math.floor((width - 18) / 6.5))}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', height: LABEL_HEIGHT }}>
            <div style={Object.assign({}, stickyName, { height: LABEL_HEIGHT })} />
            {columns.map((j, k) => (
              <div key={j} style={Object.assign(cellStyle(k), { height: LABEL_HEIGHT, position: 'relative' })}
                onMouseEnter={() => this.setState({ hover: { column: j } })}>
                {/* rotated labels lean over neighbouring columns, so they ignore the pointer: hovering the
                    header always reports the column underneath (full label in the info bar) */}
                <span
                  style={{ position: 'absolute', left: Math.max(0, size.cell / 2 - 5), bottom: 2, transform: 'rotate(-60deg)',
                    transformOrigin: 'left bottom', whiteSpace: 'nowrap', fontSize: '0.75rem', pointerEvents: 'none' }}>
                  {truncate(data.columns[j].short_label, LABEL_LENGTH)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <div style={Object.assign({}, stickyName, { fontSize: '0.75rem', color: '#666', textAlign: 'right',
              height: CATEGORY_HEIGHT, lineHeight: CATEGORY_HEIGHT + 'px' })}>
              Category
            </div>
            {columns.map((j, k) => (
              <div key={j} style={Object.assign(cellStyle(k), { height: CATEGORY_HEIGHT, background: CATEGORY_COLORS[datasets[data.columns[j].dataset_id].category] })}
                onMouseEnter={() => this.setState({ hover: { column: j } })} />
            ))}
          </div>
          {genes.map((i) => (
            <div key={i} style={{ display: 'flex' }}>
              <div style={stickyName} onMouseEnter={() => this.setState({ hover: { gene: i } })}>
                <a href={data.genes[i].link}>{data.genes[i].display_name}</a>
              </div>
              {columns.map((j, k) => (
                <div key={j} style={Object.assign(cellStyle(k), { background: cellColor(data.values[i][j]) })}
                  onMouseEnter={() => this.setState({ hover: { gene: i, column: j } })} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  },

  renderDataWarnings() {
    const data = this.state.data;
    if (data.shown_datasets.some((d) => d.flattened)) {
      return (
        <div className="alert-box warning">
          Most stored log2 ratios in this dataset are exactly 0 (for example, single-channel data that was already on a
          log scale and was flattened when SGD converted it to ratios), so the patterns shown here are not reliable.
        </div>
      );
    }
    return null;
  },

  renderExcludedNote() {
    const excluded = this.state.data.ranked_datasets.filter((d) => d.flattened).length;
    if (!excluded || this.state.datasetId) return null;
    return (
      <b>
        {excluded} dataset{excluded === 1 ? ' is' : 's are'} excluded from this view because most of their stored log2
        ratios are exactly 0, which makes their patterns unreliable; they are listed last under Study, marked ⚠.
      </b>
    );
  },

  renderGenesWithoutData() {
    const data = this.state.data;
    if (!data.genes_without_data.length) return null;
    const byReason = {};
    data.genes_without_data.forEach((x) => {
      (byReason[x.reason] = byReason[x.reason] || []).push(data.genes[x.index]);
    });
    return (
      <p>
        <small>
          {Object.keys(byReason).map((reason, k) => (
            <span key={reason}>
              {k ? '; ' : ''}
              {byReason[reason].length} gene{byReason[reason].length === 1 ? '' : 's'} not shown ({reason}):{' '}
              {byReason[reason].map((g, i) => (
                <span key={g.id}>
                  {i ? ', ' : ''}
                  <a href={g.link}>{g.display_name}</a>
                </span>
              ))}
            </span>
          ))}
        </small>
      </p>
    );
  },

  render() {
    const data = this.state.data;
    return (
      <div className="panel" ref={(el) => (this.panel = el)}>
        <h3>Expression</h3>
        {this.state.error ? <div className="alert-box alert">{this.state.error}</div> : null}
        {!data ? (
          <p>{this.state.pending ? 'Loading expression data…' : null}</p>
        ) : (
          <div>
            <p>
              log2 expression ratios for {data.gene_order.length} genes
              {data.genes_truncated ? ' (from the first ' + data.max_genes + ' of the list)' : ''} across{' '}
              {data.columns.length} conditions from {data.shown_datasets.length} dataset
              {data.shown_datasets.length === 1 ? '' : 's'}
              {data.columns_truncated ? ' (first ' + data.max_columns + ' samples shown)' : ''}. By default the
              datasets where these genes vary most beyond the typical gene are shown (score = excess standard
              deviation, log2); pick any of the {data.ranked_datasets.length} ranked datasets under Study. Samples are
              clustered within each dataset.{' '}
              {this.renderExcludedNote()}
              {this.state.pending ? ' Loading…' : ''}
            </p>
            {this.renderControls()}
            {this.renderLegend()}
            {this.renderDataWarnings()}
            {this.renderGenesWithoutData()}
            {this.renderInfoBar()}
            {this.renderHeatmap()}
            <p>
              <small>
                Datasets shown:{' '}
                {data.shown_datasets.map((d, i) => (
                  <span key={d.id}>
                    {i ? '; ' : ''}
                    <b>{i + 1}.</b> <a href={d.link}>{d.name}</a>
                  </span>
                ))}
              </small>
            </p>
          </div>
        )}
      </div>
    );
  },
});

export default ExpressionHeatmap;
