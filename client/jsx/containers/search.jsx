import React from 'react';
import Router from 'react-router';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';

const SearchResult = require('../components/search/search_result.jsx');
const Collapser = require('../components/widgets/collapser.jsx');
const DeferReadyState = require('../components/mixins/defer_ready_state.jsx');
const ErrorMessage = require('../components/widgets/error_message.jsx');
const Loader = require('../components/widgets/loader.jsx');
const Paginator = require('../components/widgets/paginator.jsx');
const Actions = require('../actions');

const SEARCH_URL = '/search';

const SearchView = React.createClass({
  mixins: [DeferReadyState],
  displayName: 'SearchView',
  propTypes: {
    activeAggregations: React.PropTypes.array,
    aggregations: React.PropTypes.array,
    currentPage: React.PropTypes.number,
    isPending: React.PropTypes.bool,
    query: React.PropTypes.string,
    results: React.PropTypes.array, // [{ name, url, category, description }]
    total: React.PropTypes.number,
    totalPages: React.PropTypes.number,
    apiError: React.PropTypes.bool
  },

  render() {
    if (this.props.apiError) {
      return <ErrorMessage />;
    }
    if (this.props.query === '') {
      return (
        <div className='row' style={[style.resultsWraper]}>
          <div className='column small-12 text-right'>
            <h2>Enter a query.</h2>
          </div>
        </div>
      );
    }
    return (
      <div className='row'>
        <div className='column medium-4 hide-for-small'>
          {this._renderCategories()}
        </div>
        <div className='column small-12 medium-8'>
          <div className='show-for-small-only'>
            <Collapser label='Categories'>
              {this._renderCategories(true)}
            </Collapser>
          </div>
          <div style={[style.resultsWraper]}>
            {this._renderResultsText()}
            <div>
              <span>View as:</span>
              <ul className='button-group' style={[style.viewAs]}>
                <li><a className='button tiny'><i className='fa fa-reorder'/></a></li>
                <li><a className='button secondary tiny'><i className='fa fa-th'/></a></li>
              </ul>
            </div>
            {this._renderSearchContent()}
          </div>
        </div>
      </div>
    );
  },

  onDeferReadyState() {
    // temp, just set ready to render
    setTimeout( () => {
      this.affirmReadyState();      
    }, 50)
  },

  // listen to URL changes and dispatch needed events
  componentWillMount() {
    this._unlisten = this.props.history.listen( listener => {
      console.log('url change')
      // this._fetchSearchResults();
    });
  },

  componentWillUnmount() {
    this._unlisten();
  },

  _renderSearchContent() {
    if (this.props.isPending) return <Loader />
    return (
      <div>
        {this._renderPaginator()}
        {this._renderResults()}
        {this._renderPaginator()}
      </div>
    );
  },

  _renderPaginator() {
    if (this.props.total === 0) return null;
    const _onPaginate = newPage => {
      let urlParams = this.props.location.query;
      urlParams.page = newPage;
      this.props.history.pushState(null, SEARCH_URL, urlParams);
      if (window) window.scrollTo(0, 0); // go to top
    };
    return <Paginator currentPage={this.props.currentPage} totalPages={this.props.totalPages} onPaginate={_onPaginate} />;
  },

  _renderResultsText() {
    if (this.props.isPending) return null;
    let total = this.props.total.toLocaleString();
    let query = this.props.query;
    var text;
    if (total === 0 && query !== '') {
      text = `No results for "${query}."  Please modify your search.`
    } else {
      text = `Showing ${total} results for "${query}."`;
    }
    return <h2>{text}</h2>;
  },

  _renderCategories(isMobile) {
    let keySuffix = '';
    if (isMobile) keySuffix = 's';
    if (this.props.aggregations.length === 0) return null
    let selectors = this.props.aggregations.map( d => {
      let _onClick = e => {
        e.preventDefault();
        return this._toggleAgg(d.key);
      }
      let isActive = (this.props.activeAggregations.indexOf(d.key) > -1);
      let _style = isActive ? [style.agg, style.activeAgg] : [style.agg, style.inactiveAgg];
      return (
        <div onClick={_onClick} style={_style} key={d.key + keySuffix}>
          <span>{d.name}</span>
          <span>{d.total.toLocaleString()}</span>
        </div>
      );
    });
    let klass = isMobile ? '' : 'panel';
    return (
      <div className={klass} style={[style.panel]}>
        {isMobile ? null : <h3>Categories</h3>}
        {selectors}
      </div>
    );
  },

  // changes active aggs in memory, writes to URL
  _toggleAgg(aggKey) {
    let activeAggs = this.props.activeAggregations;
    let isAlreadyInside = (activeAggs.indexOf(aggKey) > -1);
    let newAggKeys;
    if (isAlreadyInside) {
      newAggKeys = _.without(activeAggs, aggKey)
    } else {
      activeAggs.push(aggKey)
      newAggKeys = activeAggs;
    }
    let urlParams = this.props.location.query;
    urlParams.categories = newAggKeys.join();
    urlParams.page = 0;
    return this.props.history.pushState(null, SEARCH_URL, urlParams);
  },

  _renderResults() {
    let results = this.props.results;
    return results.map( (d, i) => {
      let id = d.id || i;
      return <SearchResult key={'searchResults' + id} {...d}/>;
    });
  },

  // dispatches redux update and maybe fetches new data
  _fetchSearchResults() {
    // define actions
    let startAction = Actions.startSearchFetch();
    let fetchAction = Actions.fetchSearchResults();
    // dispatch actions
    this.props.dispatch(startAction);
    // this.props.dispatch(fetchAction);
    return;
  }
});

const LINK_COLOR = '#11728b';
var style = {
  panel: {
    marginTop: '0.5rem'
  },
  agg: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    marginBottom: '0.25rem',
    borderRadius: '0.25rem',
    userSelect: 'none'
  },
  activeAgg: {
    background: LINK_COLOR,
    color: 'white',
    border: '1px solid #e6e6e6',
    ':hover': {
      background: LINK_COLOR
    }
  },
  inactiveAgg: {
    background: 'none',
    color: LINK_COLOR,
    border: '1px solid transparent',
    ':hover': {
      background: '#e6e6e6'
    }
  },
  viewAs: {
    display: 'inline-block',
    marginLeft: '1rem'
  },
  resultsWraper: {
    minHeight: 1000
  }
};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    results: state.results,
    total: state.total,
    query: state.query,
    aggregations: state.aggregations,
    activeAggregations: state.activeAggregations,
    isPending: state.isPending,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    apiError: state.apiError
  };
}

module.exports = connect(mapStateToProps)(Radium(SearchView));
