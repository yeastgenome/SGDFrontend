import React from 'react';
import { Link } from 'react-router';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';

import SearchResult from '../components/search/search_result.jsx';
import SearchDownloadAnalyze from '../components/search/search_download_analyze.jsx';
import SearchBreadcrumb from './search_breadcrumb.jsx';
import FacetSelector from './facet_selector.jsx';
import Collapser from '../components/widgets/collapser.jsx';
import ErrorMessage from '../components/widgets/error_message.jsx';
import Loader from '../components/widgets/loader.jsx';
import Paginator from '../components/widgets/paginator.jsx';
import { startSearchFetch, fetchSearchResults, toggleGeneWrap } from '../actions/search_actions';
import { createPath } from '../lib/search_helpers';

const SEARCH_URL = '/search';

const Search = React.createClass({
  displayName: 'Search',
  propTypes: {
    activeCategory: React.PropTypes.string,
    categoryAggs: React.PropTypes.array,
    secondaryAggs: React.PropTypes.array,
    wrapGeneResults: React.PropTypes.bool,
    currentPage: React.PropTypes.number,
    isPending: React.PropTypes.bool,
    query: React.PropTypes.string,
    results: React.PropTypes.array, // [{ name, url, category, description }]
    total: React.PropTypes.number,
    totalPages: React.PropTypes.number,
    apiError: React.PropTypes.bool
  },

  render () {
    if (this.props.apiError) {
      return <ErrorMessage />;
    }
    return (
      <div className='row'>
        <div className='column medium-4 hide-for-small'>
          <FacetSelector isMobile={false} />
        </div>
        <div className='column small-12 medium-8'>
          <div className='show-for-small-only'>
            <Collapser label='Categories'>
              <FacetSelector isMobile={true} />
            </Collapser>
          </div>
          <div style={[style.resultsWraper]}>
            <SearchBreadcrumb />
            <div className='row'>
              <div className='columns small-3'>
                {this._renderPaginator()}
              </div>
              <div className='columns small-3'>
                {this._renderPageSizeSelector()}
              </div>
              <div className='columns small-6 text-right'>
                {this._renderViewAs()}
              </div>
            </div>
            {this._renderSearchContent()}
          </div>
        </div>
      </div>
    );
  },

  // listen for history changes and fetch results when they change, also update google analytics
  componentWillMount () {
    this._unlisten = this.props.history.listen( () => {
      this._updateGoogleAnalytics();
      this._fetchSearchResults();
    });
  },

  componentWillUnmount () {
    this._unlisten();
  },

  _renderViewAs () {
    if (this.props.activeCategory !== 'locus') return null;
    const qp = _.clone(this.props.queryParams);
    const isWrapped = this._isWrappedResults();
    const wrapPath = createPath({ pathname: SEARCH_URL, query: _.extend(qp, { page: 0, wrapResults: true }) });
    const listPath = createPath({ pathname: SEARCH_URL, query: _.extend(qp, { page: 0, wrapResults: false }) });
    return (
      <ul className='button-group' style={[style.viewAs]}>
        <Link to={listPath} className={`button tiny${isWrapped ? ' secondary':''}`}><i className='fa fa-reorder'/> <span className='hide-for-small'>List</span></Link>
        <Link to={wrapPath} className={`button tiny${!isWrapped ? ' secondary':''}`}><i className='fa fa-th'/> <span className='hide-for-small'>Wrapped</span></Link>
      </ul>
    );
  },

  _renderSearchContent () {
    if (this.props.isPending) return <Loader />
    let downloadAnalyzeNode = (this.props.wrapResults) ? <SearchDownloadAnalyze results={this.props.results}/> : null;
    // only render second paginator if num results is >= amount per page
    let secondPaginateNode = (this.props.results.length >= this.props.resultsPerPage) ? this._renderPaginator() : null;
    return (
      <div>
        {this._renderResults()}
        {downloadAnalyzeNode}
        {secondPaginateNode}
      </div>
    );
  },

  _renderPaginator () {
    if (this.props.total === 0) return null;
    const _onPaginate = newPage => {
      let urlParams = this.props.location.query;
      urlParams.page = newPage;
      this.props.history.pushState(null, SEARCH_URL, urlParams);
      if (window) window.scrollTo(0, 0); // go to top
    };
    return <Paginator currentPage={this.props.currentPage} totalPages={this.props.totalPages} onPaginate={_onPaginate} />;
  },

  _renderPageSizeSelector () {
    // don't render if in wrapped mode
    if (this.props.wrapResults) return null;
    const options = [10, 25, 50, 100];
    let optionsNodes = options.map( d => {
      return <option key={`psOp${d}`} value={d}>{d}</option>;
    });
    const _onChange = e => {
      let newValue = e.currentTarget.value;
      let urlParams = this.props.location.query;
      urlParams.page_size = newValue;
      urlParams.page = 0; // go back to first page when changing page size
      this.props.history.pushState(null, SEARCH_URL, urlParams);
    };
    return (
      <div>
        <p style={[style.labelText]}>Results per Page</p>
        <select onChange={_onChange} value={this.props.resultsPerPage} style={[style.selector]}>
          {optionsNodes}
        </select>
      </div>
    );
  },

  _renderResults () {
    if (this.props.total === 0) return <p>No results.  Please broaden your search or try a different query.</p>;
    if (this._isWrappedResults()) return this._renderWrappedResults();
    let results = this.props.results;
    return results.map( (d, i) => {
      let id = d.id || i;
      return <SearchResult key={'searchResults' + id} {...d} />;
    });
  },

  _renderWrappedResults () {
    const nodes = this.props.results.map( (d, i) => {
      // only show display name if there is a '/' in name
      const displayName = d.name.split(' / ')[0];
      return <a href={d.href} style={[style.wrappedResult]} key={'serchWR' + i}>{displayName}</a>
    });
    return (
      <div>
        {nodes}
      </div>
    );
  },

  // dispatches redux update and maybe fetches new data
  _fetchSearchResults () {
    // dispatch actions
    this.props.dispatch(startSearchFetch());
    this.props.dispatch(fetchSearchResults());
    return;
  },

  _isWrappedResults () {
    return (this.props.activeCategory === 'locus' && this.props.wrapResults);
  },

  // updates google analytics, depends on global 'ga' object. Does nothing if not present
  _updateGoogleAnalytics () {
    if (!ga) return;
    let fullUrl = `${this.props.location.pathname}${this.props.location.search}`;
    ga('set', 'page', fullUrl);
    ga('send', 'pageview');
  }
});

const style = {
  labelText: {
    marginBottom: '0.5rem'
  },
  selector: {
    height: 'auto',
    padding: '0.5rem'
  },
  viewAs: {
    display: 'inline-block',
    marginTop: '2rem'
  },
  resultsWraper: {
    minHeight: 1000,
  },
  wrappedResult: {
    display: 'inline-block',
    padding: '0.25rem',
    width: '7rem'
  }
};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    results: state.results,
    activeCategory: state.activeCategory,
    isPending: state.isPending,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    resultsPerPage: state.resultsPerPage,
    apiError: state.apiError,
    queryParams: _state.routing.location.query,
    wrapResults: (_state.routing.location.query.wrapResults === 'true' || _state.routing.location.query.wrapResult === true)
  };
};

module.exports = connect(mapStateToProps)(Radium(Search));
