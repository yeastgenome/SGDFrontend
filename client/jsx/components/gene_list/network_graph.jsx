import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const NETWORK_URL = '/backend/gene_list/network';
// Cytoscape.js 3.x (static/js/build/cytoscape3.min.js), loaded the first
// time a network is shown; other pages use the old 2.x build
const CYTOSCAPE_URL = '/static/js/build/cytoscape3.min.js';

const EDGE_TYPES = [
  {
    key: 'physical',
    label: 'Physical interactions',
    short: 'physical interactions',
    color: '#1f77b4',
    style: 'solid',
    checked: true,
  },
  {
    key: 'regulation',
    label: 'Regulation (regulator → target)',
    short: 'regulation',
    color: '#e6550d',
    style: 'solid',
    checked: true,
  },
  {
    key: 'genetic',
    label: 'Genetic interactions',
    short: 'genetic interactions',
    color: '#2ca02c',
    style: 'dashed',
    checked: false,
  },
  {
    key: 'coexpression',
    label: 'Co-expression',
    short: 'co-expression',
    color: '#9467bd',
    style: 'dotted',
    checked: false,
  },
  {
    key: 'shared_go',
    label: 'Shared GO annotations',
    short: 'shared GO annotations',
    color: '#8c6d31',
    style: 'solid',
    checked: false,
  },
];
const EDGE_TYPE = {};
EDGE_TYPES.forEach((t) => {
  EDGE_TYPE[t.key] = t;
});
const EVIDENCE_OPTIONS = ['1', '2', '3', '5', '10'];
const NEIGHBOR_OPTIONS = ['0', '10', '25', '50'];
const LAYOUTS = [
  { key: 'cose', label: 'Force-directed' },
  { key: 'concentric', label: 'By number of connections' },
  { key: 'circle', label: 'Circle' },
];
const LIST_COLOR = '#6787ab';
const NEIGHBOR_COLOR = '#c7c7c7';
const HIGHLIGHT_COLOR = '#f2b705';
// largest zoom when fitting a network into the frame
const MAX_FIT_ZOOM = 1.5;

let cytoscapeLoading = null;

function loadCytoscape() {
  if (!cytoscapeLoading) {
    cytoscapeLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CYTOSCAPE_URL;
      script.onload = () => resolve(window.cytoscape);
      script.onerror = () => {
        cytoscapeLoading = null;
        reject(new Error('Could not load the network viewer'));
      };
      document.head.appendChild(script);
    });
  }
  return cytoscapeLoading;
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

function edgeSummary(edge) {
  if (edge.type === 'coexpression') {
    return 'co-expression score ' + edge.score + ' (rank ' + edge.rank + ' among top co-expressed genes)';
  }
  if (edge.type === 'shared_go') {
    return edge.shared_terms + ' shared specific GO terms: ' + edge.detail.join(', ');
  }
  let text =
    edge.evidence +
    ' record' +
    (edge.evidence === 1 ? '' : 's') +
    ', ' +
    edge.references +
    ' reference' +
    (edge.references === 1 ? '' : 's');
  if (edge.detail && edge.detail.length) text += ' · ' + edge.detail.join(', ');
  if (edge.direction) text += ' · ' + edge.direction;
  if (edge.high_throughput_only) text += ' · high-throughput only';
  return text;
}

const NetworkGraph = createReactClass({
  displayName: 'NetworkGraph',

  propTypes: {
    geneIds: PropTypes.array.isRequired,
    // {label, ids} of an enrichment term to highlight, or null
    highlight: PropTypes.object,
    onClearHighlight: PropTypes.func,
    onAnalyzeGenes: PropTypes.func,
  },

  getInitialState() {
    let edgeTypes = {};
    EDGE_TYPES.forEach((t) => {
      edgeTypes[t.key] = t.checked;
    });
    return {
      edgeTypes: edgeTypes,
      minEvidence: '', // '' = the backend default (1 for lists under 100 genes, else 2)
      neighbors: '0',
      layout: 'cose',
      hideUnconnected: true,
      data: null,
      pending: false,
      error: null,
      info: null,
    };
  },

  componentDidMount() {
    this.load();
  },

  componentDidUpdate(prevProps) {
    if (prevProps.geneIds !== this.props.geneIds) {
      // a new list gets the default evidence threshold for its size
      this.setState({ minEvidence: '' }, () => this.load());
    } else if (prevProps.highlight !== this.props.highlight) {
      this.applyHighlight();
    }
  },

  componentWillUnmount() {
    if (this.cy) this.cy.destroy();
  },

  load() {
    const edgeTypes = EDGE_TYPES.filter((t) => this.state.edgeTypes[t.key]).map((t) => t.key);
    if (!edgeTypes.length) {
      this.setState({ error: 'Choose at least one kind of connection.' });
      return;
    }
    let body = { bioent_ids: this.props.geneIds, edge_types: edgeTypes, neighbors: parseInt(this.state.neighbors) };
    if (this.state.minEvidence) body.min_evidence = parseInt(this.state.minEvidence);
    this.setState({ pending: true, error: null, info: null });
    Promise.all([postJson(NETWORK_URL, body), loadCytoscape()])
      .then(([data, cytoscape]) => {
        if (data.error) throw new Error(data.error);
        this.cytoscape = cytoscape;
        this.setState({ data: data, pending: false, minEvidence: String(data.min_evidence) }, () => this.draw());
      })
      .catch((err) => this.setState({ pending: false, error: err.message }));
  },

  setOption(change, reload) {
    this.setState(change, () => (reload ? this.load() : this.draw()));
  },

  toggleEdgeType(key) {
    let edgeTypes = Object.assign({}, this.state.edgeTypes);
    edgeTypes[key] = !edgeTypes[key];
    this.setOption({ edgeTypes: edgeTypes }, true);
  },

  visibleNodes() {
    const data = this.state.data;
    if (!data) return [];
    return this.state.hideUnconnected ? data.nodes.filter((n) => n.degree > 0) : data.nodes;
  },

  draw() {
    const data = this.state.data;
    if (!data || !this.container || !this.cytoscape) return;
    if (this.cy) this.cy.destroy();
    const nodes = this.visibleNodes();
    const maxDegree = Math.max(1, ...nodes.map((n) => n.degree));
    // line width by strength within each kind of edge
    let maxWeight = {};
    data.edges.forEach((e) => {
      maxWeight[e.type] = Math.max(maxWeight[e.type] || 0, e.weight);
    });
    const elements = nodes
      .map((n) => ({
        group: 'nodes',
        data: { id: 'n' + n.id, gene: n, label: n.name, size: 16 + (24 * n.degree) / maxDegree },
        classes: n.in_list ? 'list' : 'neighbor',
      }))
      .concat(
        data.edges.map((e, i) => ({
          group: 'edges',
          data: {
            id: 'e' + i,
            source: 'n' + e.source,
            target: 'n' + e.target,
            edge: e,
            width: 1 + (4 * e.weight) / (maxWeight[e.type] || 1),
          },
          classes: e.type,
        }))
      );
    let style = [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          width: 'data(size)',
          height: 'data(size)',
          'font-size': 10,
          'text-valign': 'bottom',
          'text-margin-y': 2,
          'background-color': LIST_COLOR,
          'border-width': 1,
          'border-color': '#fff',
        },
      },
      { selector: 'node.neighbor', style: { 'background-color': NEIGHBOR_COLOR, 'border-color': '#888' } },
      { selector: 'node.highlight', style: { 'border-width': 4, 'border-color': HIGHLIGHT_COLOR } },
      { selector: 'node.selected', style: { 'border-width': 4, 'border-color': '#333' } },
      { selector: '.faded', style: { opacity: 0.15 } },
      { selector: 'edge', style: { width: 'data(width)', 'curve-style': 'bezier', opacity: 0.7 } },
    ];
    EDGE_TYPES.forEach((t) => {
      style.push({ selector: 'edge.' + t.key, style: { 'line-color': t.color, 'line-style': t.style } });
    });
    style.push({
      selector: 'edge.regulation',
      style: { 'target-arrow-shape': 'triangle', 'target-arrow-color': EDGE_TYPE.regulation.color },
    });
    let layout = { name: this.state.layout, animate: false, fit: true, padding: 20 };
    if (this.state.layout === 'concentric') {
      layout.concentric = (node) => node.data('gene').degree;
      layout.levelWidth = () => Math.max(1, maxDegree / 6);
    }
    if (this.state.layout === 'cose') {
      layout.nodeRepulsion = () => 8000;
      layout.numIter = nodes.length > 500 ? 300 : 1000;
    }
    this.cy = this.cytoscape({
      container: this.container,
      elements: elements,
      style: style,
      minZoom: 0.02,
      maxZoom: 4,
      wheelSensitivity: 0.3,
    });
    // the layout's own fit leaves out the labels under the nodes, so fit
    // again afterwards with labels, and don't blow small networks up
    const cy = this.cy;
    const run = cy.layout(layout);
    run.one('layoutstop', () => {
      cy.fit(cy.elements(), 30);
      if (cy.zoom() > MAX_FIT_ZOOM) {
        cy.zoom(MAX_FIT_ZOOM);
        cy.center();
      }
    });
    run.run();
    this.cy.on('mouseover', 'node', (e) => this.showNode(e.target));
    this.cy.on('mouseover', 'edge', (e) => this.showEdge(e.target));
    this.cy.on('tap', 'node', (e) => this.selectNode(e.target));
    this.cy.on('tap', (e) => {
      if (e.target === this.cy) this.selectNode(null);
    });
    this.applyHighlight();
  },

  showNode(node) {
    const gene = node.data('gene');
    this.setState({ info: { gene: gene } });
  },

  showEdge(edge) {
    const e = edge.data('edge');
    this.setState({
      info: {
        edge: e,
        source: edge.source().data('gene'),
        target: edge.target().data('gene'),
      },
    });
  },

  selectNode(node) {
    if (!this.cy) return;
    this.cy.elements().removeClass('faded selected');
    if (!node) return;
    const neighborhood = node.closedNeighborhood();
    this.cy.elements().not(neighborhood).addClass('faded');
    node.addClass('selected');
    this.showNode(node);
  },

  applyHighlight() {
    if (!this.cy) return;
    this.cy.nodes().removeClass('highlight');
    const highlight = this.props.highlight;
    if (!highlight) return;
    let ids = {};
    highlight.ids.forEach((id) => {
      ids['n' + id] = true;
    });
    this.cy.nodes().forEach((n) => {
      if (ids[n.id()]) n.addClass('highlight');
    });
  },

  downloadPng() {
    if (!this.cy) return;
    const link = document.createElement('a');
    link.href = this.cy.png({ full: true, scale: 2, bg: '#ffffff' });
    link.download = 'sgd_gene_list_network.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadEdges() {
    const data = this.state.data;
    if (!data) return;
    let genes = {};
    data.nodes.forEach((n) => {
      genes[n.id] = n;
    });
    const clean = (v) => String(v === null || v === undefined ? '' : v).replace(/[\t\n\r]+/g, ' ');
    let lines = [
      ['source', 'source_systematic_name', 'target', 'target_systematic_name', 'type', 'weight', 'details'].join('\t'),
    ];
    data.edges.forEach((e) => {
      const a = genes[e.source];
      const b = genes[e.target];
      lines.push(
        [a.name, a.systematic_name, b.name, b.systematic_name, e.type, e.weight, edgeSummary(e)].map(clean).join('\t')
      );
    });
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/tab-separated-values' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sgd_gene_list_network_edges.tsv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  analyzeNetworkGenes() {
    const nodes = this.visibleNodes();
    if (!nodes.length || !this.props.onAnalyzeGenes) return;
    this.props.onAnalyzeGenes(
      nodes.map((n) => n.systematic_name),
      'network of the previous list' + (this.state.data.neighbors_added ? ' (including neighbors)' : '')
    );
  },

  renderControls() {
    const data = this.state.data;
    return (
      <div>
        <div style={{ marginBottom: '0.5rem' }}>
          {EDGE_TYPES.map((t) => (
            <span key={t.key} style={{ marginRight: '1.25rem', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                id={'gla_net_' + t.key}
                checked={this.state.edgeTypes[t.key]}
                disabled={this.state.pending}
                onChange={() => this.toggleEdgeType(t.key)}
              />
              <label htmlFor={'gla_net_' + t.key}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 24,
                    verticalAlign: 'middle',
                    marginRight: 4,
                    borderTop: '3px ' + t.style + ' ' + t.color,
                  }}
                />
                {t.label}
              </label>
            </span>
          ))}
        </div>
        <div className="row">
          <div className="large-3 medium-6 columns">
            <label>
              Minimum evidence <small>(interactions and regulation)</small>
              <select
                value={this.state.minEvidence}
                disabled={this.state.pending}
                onChange={(e) => this.setOption({ minEvidence: e.target.value }, true)}
              >
                {EVIDENCE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v === '1' ? '1 record' : v + ' records'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="large-3 medium-6 columns">
            <label>
              Add connecting genes <small>(not in the list)</small>
              <select
                value={this.state.neighbors}
                disabled={this.state.pending}
                onChange={(e) => this.setOption({ neighbors: e.target.value }, true)}
              >
                {NEIGHBOR_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v === '0' ? 'None' : 'Top ' + v + ' linking 2+ list genes'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="large-3 medium-6 columns">
            <label>
              Layout
              <select value={this.state.layout} onChange={(e) => this.setOption({ layout: e.target.value })}>
                {LAYOUTS.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="large-3 medium-6 columns" style={{ paddingTop: '1.5rem' }}>
            <input
              type="checkbox"
              id="gla_net_hide"
              checked={this.state.hideUnconnected}
              onChange={() => this.setOption({ hideUnconnected: !this.state.hideUnconnected })}
            />
            <label htmlFor="gla_net_hide">Hide unconnected list genes</label>
          </div>
        </div>
        {data ? this.renderSummary() : null}
      </div>
    );
  },

  renderSummary() {
    const data = this.state.data;
    const shown = this.visibleNodes().length;
    const unconnected = data.nodes.filter((n) => n.in_list && n.degree === 0).length;
    return (
      <p style={{ marginBottom: '0.5rem' }}>
        {shown.toLocaleString()} genes ({data.list_size.toLocaleString()} in the list
        {data.neighbors_added ? ', ' + data.neighbors_added + ' connecting genes added' : ''}
        {this.state.hideUnconnected && unconnected ? ', ' + unconnected.toLocaleString() + ' unconnected hidden' : ''}
        ), {data.shown_edges.toLocaleString()} connections
        {data.shown_edges < data.total_edges ? ' of ' + data.total_edges.toLocaleString() : ''}
        {Object.keys(data.edge_counts).length
          ? ' (' +
            EDGE_TYPES.filter((t) => data.edge_counts[t.key])
              .map((t) => data.edge_counts[t.key].toLocaleString() + ' ' + t.short)
              .join(', ') +
            ')'
          : ''}
        . {data.notes.length ? <b>Note: {data.notes.join('; ')}.</b> : null}
      </p>
    );
  },

  renderInfo() {
    const info = this.state.info;
    let text = 'Point at a gene or connection for details; click a gene to show only its connections.';
    if (info && info.gene) {
      const g = info.gene;
      text = (
        <span>
          <a href={g.link}>{g.name}</a> {g.name !== g.systematic_name ? '(' + g.systematic_name + ')' : ''} ·{' '}
          {g.in_list ? 'in the list' : 'connecting gene'} · {g.degree} connection{g.degree === 1 ? '' : 's'}
          {g.description ? ' · ' + g.description : ''}
        </span>
      );
    } else if (info && info.edge) {
      const t = EDGE_TYPE[info.edge.type];
      text = (
        <span>
          <b style={{ color: t.color }}>{t.label.split(' (')[0]}</b>: {info.source.name}{' '}
          {info.edge.type === 'regulation' ? '→' : '–'} {info.target.name} · {edgeSummary(info.edge)}
        </span>
      );
    }
    // fixed single-line height so the graph doesn't move under the pointer
    return (
      <div
        style={{
          background: '#f4f4f4',
          padding: '0 0.6rem',
          height: '2rem',
          lineHeight: '2rem',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {text}
      </div>
    );
  },

  render() {
    const data = this.state.data;
    const highlight = this.props.highlight;
    return (
      <div className="panel">
        <h3>Network</h3>
        <p>
          How the genes in the list are connected: physical and genetic interactions (BioGRID), transcriptional
          regulation, co-expression across SGD expression datasets, and shared specific GO annotations (GO terms with at
          most 100 genes). Line width shows the amount of evidence; larger circles have more connections.
        </p>
        {this.renderControls()}
        {this.state.error ? <div className="alert-box alert">{this.state.error}</div> : null}
        {highlight ? (
          <p>
            <span style={{ borderBottom: '3px solid ' + HIGHLIGHT_COLOR }}>
              Highlighted: genes of {highlight.label}
            </span>{' '}
            <a onClick={this.props.onClearHighlight}>clear</a>
          </p>
        ) : null}
        {this.renderInfo()}
        <div style={{ position: 'relative' }}>
          <div
            ref={(el) => (this.container = el)}
            style={{
              height: '600px',
              border: '1px solid #ddd',
              background: '#fff',
              opacity: this.state.pending ? 0.4 : 1,
            }}
          />
          {this.state.pending ? (
            <div style={{ position: 'absolute', top: '45%', width: '100%', textAlign: 'center' }}>Loading network…</div>
          ) : null}
        </div>
        {data ? (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              className="button tiny radius"
              style={{ marginBottom: 0, marginRight: '0.5rem' }}
              onClick={this.downloadPng}
            >
              Download image (PNG)
            </button>
            <button
              className="button tiny radius"
              style={{ marginBottom: 0, marginRight: '0.5rem' }}
              onClick={this.downloadEdges}
            >
              Download connections (TSV)
            </button>
            {this.props.onAnalyzeGenes ? (
              <button
                className="button tiny radius secondary"
                style={{ marginBottom: 0, border: '1px solid #bbb' }}
                title="Replace the gene list with the genes shown in the network and analyze them"
                onClick={this.analyzeNetworkGenes}
              >
                Analyze the {this.visibleNodes().length.toLocaleString()} genes in this network
              </button>
            ) : null}
            <p style={{ marginTop: '0.5rem' }}>
              <small>
                The connections file opens in Cytoscape desktop (File → Import → Network from File). Co-expression is
                computed for lists of up to 500 genes; large networks are cut to the strongest 2,000 connections.
              </small>
            </p>
          </div>
        ) : null}
      </div>
    );
  },
});

export default NetworkGraph;
