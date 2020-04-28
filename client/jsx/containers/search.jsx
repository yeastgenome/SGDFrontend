import React from 'react';
import { Link } from 'react-router-dom';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';
import S from 'string';
const queryString = require('query-string');

import SearchResult from '../components/search/search_result.jsx';
import SearchDownloadAnalyze from '../components/search/search_download_analyze.jsx';
import SearchBreadcrumb from './search_breadcrumb.jsx';
import FacetSelector from './facet_selector.jsx';
import Collapser from '../components/widgets/collapser.jsx';
import ErrorMessage from '../components/widgets/error_message.jsx';
import Loader from '../components/widgets/loader.jsx';
import Paginator from '../components/widgets/paginator.jsx';
import { startSearchFetchMaybeAsycFetch } from '../actions/search_actions';
import { createPath } from '../lib/search_helpers';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const SEARCH_URL = '/search';
const CATS_SORTED_BY_ANNOTATION = [
  'phenotype',
  'biological_process',
  'cellular_component',
  'molecular_function',
];

const Search = createReactClass({
  displayName: 'Search',

  render() {
    if (this.props.apiError) {
      return <ErrorMessage />;
    }
    return (
      <div className="row">
        <div className="column medium-4 hide-for-small">
          <FacetSelector
            isMobile={false}
            downloadStatus={this._getdownloadStatus}
            downloadStatusStr={this.props.downloadStatusStr}
          />
        </div>
        <div className="column small-12 medium-8">
          <div className="show-for-small-only">
            <Collapser label="Categories">
              <FacetSelector
                isMobile={true}
                downloadStatus={this._getdownloadStatus}
                downloadStatusStr={this.props.downloadStatusStr}
              />
            </Collapser>
          </div>
          <div style={[style.resultsWraper]}>
            <SearchBreadcrumb />
            {this._renderControls()}
            {this._renderSearchContent()}
          </div>
        </div>
      </div>
    );
  },

  // listen for history changes and fetch results when they change, also update google analytics
  componentDidMount() {
    this._updateGoogleAnalytics();
    this._fetchSearchResults();
    this._unlisten = this.props.history.listen(() => {
      this._updateGoogleAnalytics();
      this._fetchSearchResults();
    });
  },

  componentWillUnmount() {
    this._unlisten();
  },

  _renderViewAs() {
    if (this.props.activeCategory !== 'locus') return null;
    const qp = _.clone(this.props.queryParams);
    const isList = this.props.geneMode === 'list';
    const isWrap = this.props.geneMode === 'wrap';
    const listPath = createPath({
      pathname: SEARCH_URL,
      search: _.extend(qp, { page: 0, geneMode: 'list' }),
    });
    const wrapPath = createPath({
      pathname: SEARCH_URL,
      search: _.extend(qp, { page: 0, geneMode: 'wrap' }),
    });

    return (
      <ul className="button-group" style={[style.viewAs]}>
        <Link
          to={listPath}
          className={`button tiny${!isList ? ' secondary' : ''}`}
        >
          <i className="fa fa-reorder" /> <span>List</span>
        </Link>
        <Link
          to={wrapPath}
          className={`button tiny${!isWrap ? ' secondary' : ''}`}
        >
          <i className="fa fa-th" /> <span>Wrapped</span>
        </Link>
      </ul>
    );
  },

  _renderSearchContent() {
    if (this.props.isPending) return <Loader />;
    // only render second paginator if num results is >= amount per page
    let isSecondPaginator =
      this.props.results.length >= this.props.resultsPerPage &&
      !this._isWrappedResults();
    let secondPaginateNode = isSecondPaginator ? this._renderControls() : null;
    return (
      <div>
        {this._renderResults()}
        {secondPaginateNode}
      </div>
    );
  },

  _renderControls() {
    if (this._isWrappedResults()) return this._renderWrappedControls();
    if (this.props.total === 0) return null;
    const _onPaginate = (newPage) => {
      let urlParams = queryString.parse(this.props.location.search);
      urlParams.page = newPage;
      this.props.location.search = queryString.stringify(urlParams);
      this.props.history.push(this.props.location);
      if (window) window.scrollTo(0, 0); // go to top
    };
    return (
      <div className="row">
        <div className="columns large-3 medium-4 small-6">
          <Paginator
            currentPage={this.props.currentPage}
            totalPages={this.props.totalPages}
            onPaginate={_onPaginate}
          />
        </div>
        <div className="columns large-2 medium-4 hide-for-small">
          {this._renderPageSizeSelector()}
        </div>
        <div className="columns large-2 medium-4 small-6">
          {this._renderSortBySelector()}
        </div>
        <div className="columns large-5 small-12 text-right">
          {this._renderViewAs()}
        </div>
      </div>
    );
  },

  _renderWrappedControls() {
    // show progress bar if still downloading results, otherise download / analyze buttons
    let actionProgressNode = this.props.isAsyncPending ? (
      this._renderProgressNode()
    ) : (
      <SearchDownloadAnalyze
        results={this.props.asyncResults}
        query={this.props.query}
        url={this.props.url}
      />
    );
    return (
      <div>
        <div className="row">
          <div className="columns small-6">{actionProgressNode}</div>
          <div className="columns small-6 text-right">
            {this._renderViewAs()}
          </div>
        </div>
        <p>
          Genetic loci that are not mapped to the genome sequence will be
          excluded from the analysis list.
        </p>
      </div>
    );
  },

  _renderProgressNode() {
    let strWidth = `${Math.round(this.props.asyncProgress * 100)}%`;
    return (
      <div style={[style.progressBar]}>
        <label>Downloading ...</label>
        <div className="progress">
          <span className="meter" style={{ width: strWidth }} />
        </div>
      </div>
    );
  },

  _renderPageSizeSelector() {
    const options = [10, 25, 50, 100];
    let optionsNodes = options.map((d) => {
      return (
        <option key={`psOp${d}`} value={d}>
          {d}
        </option>
      );
    });
    const _onChange = (e) => {
      let newValue = e.currentTarget.value;
      let urlParams = queryString.parse(this.props.location.search);
      urlParams.page_size = newValue;
      urlParams.page = 0; // go back to first page when changing page size
      this.props.location.search = queryString.stringify(urlParams);
      this.props.history.push(this.props.location);
    };
    return (
      <div>
        <p style={[style.labelText]}>Results</p>
        <select
          onChange={_onChange}
          value={this.props.resultsPerPage}
          style={[style.selector]}
        >
          {optionsNodes}
        </select>
      </div>
    );
  },

  _renderSortBySelector() {
    let options = [
      { value: 'relevance', name: 'Relevance' },
      { value: 'alphabetical', name: 'Alphabetical' },
    ];
    // only allow some categories to search by annotation
    if (this.props.canSortByAnnotation)
      options.push({ value: 'annotation', name: 'Annotation Count' });
    let optionsNodes = options.map((d) => {
      return (
        <option key={`psOp${d.value}`} value={d.value}>
          {d.name}
        </option>
      );
    });
    const _onChange = (e) => {
      let newValue = e.currentTarget.value;
      let urlParams = queryString.parse(this.props.location.search);
      urlParams.sort_by = newValue;
      urlParams.page = 0; // go back to first page when changing sorting
      this.props.location.search = queryString.stringify(urlParams);
      this.props.history.push(this.props.location);
    };
    return (
      <div>
        <p style={[style.labelText]}>Sort By</p>
        <select
          onChange={_onChange}
          value={this.props.sortBy}
          style={[style.selector]}
        >
          {optionsNodes}
        </select>
      </div>
    );
  },

  _renderResults() {
    // empty message
    if (this.props.total === 0)
      return (
        <p>No results. Please broaden your search or try a different query.</p>
      );
    // maybe render special result types
    if (this.props.geneMode === 'wrap') {
      return this._renderWrappedResults();
    }
    // if not wrapped or analyzed, just render regular results
    let results = this.props.results;
    if (this.props.url.match(/^\/+search+\?+q\=\&category\=download/g)) {
      let temp = results.map((d, i) => {
        let id = d.id || i;

        if (d.status === 'Active') {
          return <SearchResult key={'searchResults' + id} {...d} />;
        }
      });

      return temp;
    } else {
      return results.map((d, i) => {
        let id = d.id || i;
        return <SearchResult key={'searchResults' + id} {...d} />;
      });
    }
  },

  _renderWrappedResults() {
    const nodes = this.props.asyncResults.map((d, i) => {
      // only show display name if there is a '/' in name
      const displayName = d.name.split(' / ')[0];
      return (
        <a href={d.href} style={[style.wrappedResult]} key={'serchWR' + i}>
          {displayName}
        </a>
      );
    });
    return <div>{nodes}</div>;
  },

  // dispatches redux update and maybe fetches new data
  _fetchSearchResults() {
    // dispatch actions
    this.props.dispatch(startSearchFetchMaybeAsycFetch());
  },

  _getdownloadStatus(str) {
    this.setState({ selectedRadioBtn: str });
    let tempQParams = this.props.queryParams;
    if (Object.prototype.hasOwnProperty.call(tempQParams, 'status')) {
      tempQParams['status'] = S(str).capitalize().s;
    }
    this.props.location.search = queryString.stringify(tempQParams);
    this.props.history.push(this.props.location);
  },

  _isWrappedResults() {
    return (
      this.props.activeCategory === 'locus' && this.props.geneMode !== 'list'
    );
  },

  // updates google analytics, depends on global 'ga' object. Does nothing if not present
  _updateGoogleAnalytics() {
    if (!ga) return;
    let fullUrl = `${this.props.location.pathname}${this.props.location.search}`;
    ga('set', 'page', fullUrl);
    ga('send', 'pageview');
  },
  propTypes: {
    activeCategory: PropTypes.string,
    currentPage: PropTypes.number,
    isPending: PropTypes.bool,
    query: PropTypes.string,
    results: PropTypes.array, // [{ name, url, category, description }]
    total: PropTypes.number,
    totalPages: PropTypes.number,
    apiError: PropTypes.bool,
    downloadStatusStr: PropTypes.any,
    history: PropTypes.any,
    queryParams: PropTypes.any,
    geneMode: PropTypes.any,
    resultsPerPage: PropTypes.any,
    location: PropTypes.any,
    isAsyncPending: PropTypes.any,
    asyncResults: PropTypes.any,
    url: PropTypes.any,
    asyncProgress: PropTypes.any,
    sortBy: PropTypes.any,
    dispatch: PropTypes.any,
    canSortByAnnotation: PropTypes.any,
  },
});

const style = {
  labelText: {
    marginBottom: '0.5rem',
  },
  selector: {
    height: 'auto',
    padding: '0.5rem',
  },
  viewAs: {
    display: 'inline-block',
    marginTop: '2rem',
    marginBottom: '1rem',
  },
  resultsWraper: {
    minHeight: 1000,
  },
  progressBar: {
    marginTop: '1.25rem',
  },
  wrappedResult: {
    display: 'inline-block',
    padding: '0.25rem',
    width: '7rem',
  },
};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    results: state.results,
    asyncResults: state.asyncResults,
    activeCategory: state.activeCategory,
    canSortByAnnotation:
      CATS_SORTED_BY_ANNOTATION.indexOf(state.activeCategory) > -1,
    isPending: state.isPending,
    isAsyncPending: state.isAsyncPending,
    asyncProgress: state.asyncProgress,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    resultsPerPage: state.resultsPerPage,
    sortBy: state.sortBy,
    apiError: state.apiError,
    query: state.query,
    url: `${_state.router.location.pathname}${_state.router.location.search}`,
    queryParams: queryString.parse(_state.router.location.search),
    geneMode: state.geneMode,
    downloadStatusStr: state.downloadStatusStr,
    downloadStatus: state.downloadStatus,
  };
}

module.exports = connect(mapStateToProps)(Radium(Search));
