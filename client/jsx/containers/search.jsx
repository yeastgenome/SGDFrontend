import React from 'react';
import Router from 'react-router';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';

import SearchResult from '../components/search/search_result.jsx';
import FacetSelector from './facet_selector.jsx';
import Collapser from '../components/widgets/collapser.jsx';
import DeferReadyState from '../components/mixins/defer_ready_state.jsx';
import ErrorMessage from '../components/widgets/error_message.jsx';
import Loader from '../components/widgets/loader.jsx';
import Paginator from '../components/widgets/paginator.jsx';
import { startSearchFetch, fetchSearchResults } from '../actions';

const SEARCH_URL = '/search';

const SearchView = React.createClass({
  mixins: [DeferReadyState],
  displayName: 'SearchView',
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

  render() {
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

  componentWillMount() {
    this._unlisten = this.props.history.listen( () => {
      this._fetchSearchResults()
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

  _renderResults() {
    let results = this.props.results;
    return results.map( (d, i) => {
      let id = d.id || i;
      return <SearchResult key={'searchResults' + id} {...d}/>;
    });
  },

  // dispatches redux update and maybe fetches new data
  _fetchSearchResults() {
    // dispatch actions
    this.props.dispatch(startSearchFetch());
    this.props.dispatch(fetchSearchResults());
    return;
  }
});

var style = {
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
    activeCategory: null,
    categoryAggs: [],
    secondaryAggs: [],
    wrapGeneResults: false,
    isPending: state.isPending,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    apiError: state.apiError
  };
};

module.exports = connect(mapStateToProps)(Radium(SearchView));
