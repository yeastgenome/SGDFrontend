import 'isomorphic-fetch';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import AppSearchBar from '../../containers/app_search_bar.jsx';

const SEARCH_URL = '/search';
const RECENT_UPDATES_URL = '/redirect_backend?param=recent_updates';

// Categories surfaced as large "Browse by Category" cards. Keys match the
// ElasticSearch category keys returned in the search aggregations. Example
// chips are real, navigable search terms shown as suggested entry points.
const PRIMARY_CATEGORIES = [
  {
    key: 'locus',
    name: 'Genes',
    blurb: 'Protein-coding genes and ncRNAs',
    examples: ['HOG1', 'CDC28'],
  },
  {
    key: 'reference',
    name: 'References',
    blurb: 'Literature and curation sources',
    examples: ['autophagy', 'nuclear pore'],
  },
  {
    key: 'allele',
    name: 'Alleles',
    blurb: 'Mutants and variants',
    examples: ['hog1', 'cdc28-1'],
  },
  {
    key: 'biological_process',
    name: 'Biological Processes',
    blurb: 'GO terms and pathway activities',
    examples: ['autophagy', 'osmotic stress'],
  },
  {
    key: 'chemical',
    name: 'Chemicals',
    blurb: 'Compounds and metabolites',
    examples: ['sorbitol', 'glucose'],
  },
  {
    key: 'phenotype',
    name: 'Phenotypes',
    blurb: 'Observable traits and screens',
    examples: ['heat sensitivity'],
  },
];

// Everything else, revealed under "Other categories". Order is by expected size.
const SECONDARY_CATEGORIES = [
  'biological_process',
  'molecular_function',
  'cellular_component',
  'disease',
  'complex',
  'pathway',
  'strain',
  'dataset',
  'observable',
  'reserved_name',
  'colleague',
  'resource',
  'contig',
  'download',
];

const POPULAR_SEARCHES = ['HOG1', 'CDC28', 'autophagy', 'nuclear pore', 'histone'];

const COMMON_TASKS = [
  {
    icon: 'fa-eye',
    label: 'Find genes by phenotype',
    detail: 'e.g. heat sensitivity, osmotic stress resistance',
    href: `${SEARCH_URL}?q=&category=phenotype`,
    external: false,
  },
  {
    icon: 'fa-download',
    label: 'Download sequences',
    detail: 'FASTA, GFF, and annotation files',
    href: 'http://sgd-archive.yeastgenome.org/',
    external: true,
  },
  {
    icon: 'fa-list',
    label: 'Analyze a gene list',
    detail: 'GO enrichment and queries in YeastMine',
    href: 'https://yeastmine.yeastgenome.org/',
    external: true,
  },
  {
    icon: 'fa-sitemap',
    label: 'Explore pathways',
    detail: 'Biochemical pathways and metabolism',
    href: `${SEARCH_URL}?q=&category=pathway`,
    external: false,
  },
];

const SearchLanding = createReactClass({
  displayName: 'SearchLanding',

  propTypes: {
    aggregations: PropTypes.array,
    total: PropTypes.number,
  },

  getInitialState() {
    return {
      recentData: null,
      recentError: false,
      showSecondary: true,
    };
  },

  componentDidMount() {
    this._isMounted = true;
    this._fetchRecentUpdates();
  },

  componentWillUnmount() {
    this._isMounted = false;
  },

  render() {
    return (
      <div className="search-landing">
        {this._renderHero()}
        {this._renderStatsBar()}
        <div className="row search-landing-body">
          <div className="columns medium-8 small-12">
            {this._renderBrowseByCategory()}
          </div>
          <div className="columns medium-4 small-12">
            {this._renderWhatsNew()}
            {/* Common Tasks hidden for now; the space is given to What's New.
                Re-enable by restoring {this._renderCommonTasks()} below. */}
            {/* {this._renderCommonTasks()} */}
          </div>
        </div>
      </div>
    );
  },

  _renderHero() {
    const countMap = this._getCountMap();
    const geneCount = countMap['locus'];
    const refCount = countMap['reference'];
    return (
      <div className="search-landing-hero">
        <h1 className="search-landing-title">
          Search <span className="highlight">Saccharomyces</span> Genome
          Database
        </h1>
        <p className="search-landing-subtitle">
          {geneCount && refCount ? (
            <span>
              Explore <strong>{geneCount.toLocaleString()}</strong> genes,{' '}
              <strong>{refCount.toLocaleString()}</strong> references, and more
            </span>
          ) : (
            <span>Explore genes, references, phenotypes, and more</span>
          )}
        </p>
        <div className="search-landing-hero-search">
          <AppSearchBar />
        </div>
      </div>
    );
  },

  _renderStatsBar() {
    const total = this.props.total ? this.props.total.toLocaleString() : null;
    const numCats = this._getNumCategories();
    if (!total) return null;
    return (
      <div className="search-landing-statsbar">
        <span className="search-landing-live">
          <span className="search-landing-dot" /> Live index
        </span>
        <span>
          <strong>{total}</strong> total entries across{' '}
          <strong>{numCats}</strong> categories — start typing to search or
          browse below
        </span>
      </div>
    );
  },

  _renderBrowseByCategory() {
    const countMap = this._getCountMap();
    return (
      <div className="search-landing-browse">
        <h2 className="search-landing-section-title">Browse by Category</h2>
        <div className="search-landing-cards">
          {PRIMARY_CATEGORIES.map((cat) => this._renderCard(cat, countMap))}
        </div>
        {this._renderSecondary(countMap)}
      </div>
    );
  },

  _renderCard(cat, countMap) {
    const count = countMap[cat.key];
    return (
      <div className="search-landing-card" key={`card${cat.key}`}>
        <Link
          to={this._getCategoryHref(cat.key)}
          className="search-landing-card-head"
        >
          <span className="search-landing-card-name">
            <span className={`search-cat ${cat.key}`} />
            {cat.name}
          </span>
          {typeof count === 'number' && (
            <span className="search-landing-card-count">
              {count.toLocaleString()}
            </span>
          )}
        </Link>
        <p className="search-landing-card-blurb">{cat.blurb}</p>
        {cat.examples && cat.examples.length > 0 && (
          <div className="search-landing-card-examples">
            {cat.examples.map((ex, i) => (
              <Link
                className="search-landing-chip small"
                key={`ex${cat.key}${i}`}
                to={this._getExampleHref(cat.key, ex)}
              >
                {ex}
              </Link>
            ))}
          </div>
        )}
        <Link
          to={this._getCategoryHref(cat.key)}
          className="search-landing-card-browse"
        >
          Browse all <i className="fa fa-arrow-right" />
        </Link>
      </div>
    );
  },

  _renderSecondary(countMap) {
    const primaryKeys = PRIMARY_CATEGORIES.map((c) => c.key);
    const items = SECONDARY_CATEGORIES.filter(
      (key) => primaryKeys.indexOf(key) < 0 && typeof countMap[key] === 'number'
    );
    if (items.length === 0) return null;
    const _toggle = (e) => {
      e.preventDefault();
      this.setState({ showSecondary: !this.state.showSecondary });
    };
    return (
      <div className="search-landing-secondary">
        <a className="search-landing-secondary-toggle" onClick={_toggle}>
          <i
            className={`fa fa-angle-${
              this.state.showSecondary ? 'down' : 'right'
            }`}
          />{' '}
          Other categories
          <span className="search-landing-secondary-note">
            {items.length} more data types
          </span>
        </a>
        {this.state.showSecondary && (
          <div className="search-landing-secondary-list">
            {items.map((key) => (
              <Link
                to={this._getCategoryHref(key)}
                className="search-landing-secondary-item"
                key={`sec${key}`}
              >
                <span>
                  <span className={`search-cat ${key}`} />
                  {this._getCategoryName(key)}
                </span>
                <span>{countMap[key].toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  },

  _renderWhatsNew() {
    const data = this.state.recentData;
    return (
      <div className="search-landing-panel search-landing-whatsnew">
        <h3 className="search-landing-panel-title">
          <i className="fa fa-star" /> What&apos;s New in SGD
        </h3>
        {this.state.recentError && (
          <p className="search-landing-panel-empty">
            Recent updates are unavailable right now.
          </p>
        )}
        {!this.state.recentError && !data && (
          <p className="search-landing-panel-empty">Loading recent updates…</p>
        )}
        {data && this._renderRecentCounts(data)}
        {data && this._renderRecentReferences(data)}
      </div>
    );
  },

  _renderRecentCounts(data) {
    const counts = (data.counts || []).filter((c) => c.count > 0);
    if (counts.length === 0) {
      return (
        <p className="search-landing-panel-empty">
          No new entries in the last {data.since_days} days.
        </p>
      );
    }
    return (
      <div className="search-landing-whatsnew-summary">
        <p className="search-landing-whatsnew-window">
          Last {data.since_days} days:
        </p>
        <ul className="search-landing-whatsnew-counts">
          {counts.map((c, i) => (
            <li key={`rc${i}`}>
              <a href={c.href}>
                <strong>{c.count.toLocaleString()}</strong> {c.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  },

  _renderRecentReferences(data) {
    const refs = data.references || [];
    if (refs.length === 0) return null;
    return (
      <div className="search-landing-whatsnew-refs">
        <p className="search-landing-whatsnew-window">Recently added references</p>
        <ol className="reference-list">
          {refs.map((ref, i) => {
            const remainder = ref.citation
              ? ref.citation.replace(ref.display_name, '')
              : '';
            return (
              <li className="reference-list-item" key={`rr${i}`}>
                <a href={ref.link}>{ref.display_name}</a>
                {remainder}
                {ref.pubmed_id ? <small> PMID: {ref.pubmed_id}</small> : null}
                <ul className="ref-links">
                  <li>
                    <a href={ref.link}>SGD Paper</a>
                  </li>
                  {(ref.urls || []).map((url, j) => (
                    <li key={`rru${i}_${j}`}>
                      <a href={url.link} target="_infowin">
                        {url.display_name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
        <p className="search-landing-whatsnew-more">
          <a href="/reference/recent">View all recently added references →</a>
        </p>
      </div>
    );
  },

  _renderCommonTasks() {
    return (
      <div className="search-landing-panel search-landing-tasks">
        <h3 className="search-landing-panel-title">Common Tasks</h3>
        <p className="search-landing-panel-sub">
          Quick entry points for frequent workflows
        </p>
        <ul>
          {COMMON_TASKS.map((task, i) => {
            const inner = (
              <span className="search-landing-task-inner">
                <span className="search-landing-task-icon">
                  <i className={`fa ${task.icon}`} />
                </span>
                <span className="search-landing-task-text">
                  <span className="search-landing-task-label">
                    {task.label}
                  </span>
                  <span className="search-landing-task-detail">
                    {task.detail}
                  </span>
                </span>
                <i className="fa fa-angle-right search-landing-task-chevron" />
              </span>
            );
            if (task.external) {
              return (
                <li key={`task${i}`}>
                  <a href={task.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                </li>
              );
            }
            return (
              <li key={`task${i}`}>
                <Link to={task.href}>{inner}</Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },

  _fetchRecentUpdates() {
    fetch(RECENT_UPDATES_URL)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error('API error.');
        }
        return response.json();
      })
      .then((data) => {
        if (this._isMounted) this.setState({ recentData: data });
      })
      .catch(() => {
        if (this._isMounted) this.setState({ recentError: true });
      });
  },

  // Build a { categoryKey: total } map from the search aggregations already in
  // the store, so category counts require no extra request.
  _getCountMap() {
    const aggs = this.props.aggregations;
    if (!aggs || aggs.length === 0 || !aggs[0].values) return {};
    const map = {};
    aggs[0].values.forEach((v) => {
      map[v.key] = v.total;
    });
    return map;
  },

  _getNumCategories() {
    const aggs = this.props.aggregations;
    if (!aggs || aggs.length === 0 || !aggs[0].values) return 0;
    return aggs[0].values.length;
  },

  _getCategoryName(key) {
    const found = PRIMARY_CATEGORIES.find((c) => c.key === key);
    if (found) return found.name;
    const labels = {
      locus: 'Genes',
      molecular_function: 'Molecular Functions',
      cellular_component: 'Cellular Components',
      biological_process: 'Biological Processes',
      disease: 'Diseases',
      complex: 'Complexes',
      pathway: 'Biochemical Pathways',
      strain: 'Strains',
      dataset: 'Datasets',
      observable: 'Observables',
      reserved_name: 'Reserved Gene Names',
      colleague: 'Colleagues',
      resource: 'Resources',
      contig: 'Contigs',
      download: 'Downloads',
      reference: 'References',
      phenotype: 'Phenotypes',
      chemical: 'Chemicals',
      allele: 'Alleles',
    };
    return labels[key] || key.replace(/_/g, ' ');
  },

  _getCategoryHref(key) {
    if (key === 'download') {
      return `${SEARCH_URL}?q=&category=download&status=Active`;
    }
    return `${SEARCH_URL}?q=&category=${key}`;
  },

  // Each example chip runs that specific term within the category
  // (e.g. /search?q=CDC28&category=locus).
  _getExampleHref(key, term) {
    return `${SEARCH_URL}?q=${encodeURIComponent(term)}&category=${key}`;
  },

  _getQueryHref(term) {
    return `${SEARCH_URL}?q=${encodeURIComponent(term)}&is_quick=false`;
  },
});

function mapStateToProps(_state) {
  const state = _state.searchResults;
  return {
    aggregations: state.aggregations,
    total: state.total,
  };
}

export default connect(mapStateToProps)(SearchLanding);
