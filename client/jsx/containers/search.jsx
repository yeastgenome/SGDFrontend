import React from 'react';
import Router from 'react-router';
import Radium from 'radium';
import { connect } from 'react-redux';

const SearchResult = require('../components/search/search_result.jsx');
const Paginator = require('../components/widgets/paginator.jsx');
const Loader = require('../components/widgets/loader.jsx');
const Actions = require('../actions');

const SearchView = React.createClass({
  displayName: 'SearchView',
  propTypes: {
    results: React.PropTypes.array, // [{ name, url, category, description }]
    aggregations: React.PropTypes.array,
    query: React.PropTypes.string,
    total: React.PropTypes.number,
    totalPages: React.PropTypes.number,
    isPending: React.PropTypes.bool,
    currentPage: React.PropTypes.number,
    resultsPerPage: React.PropTypes.number
  },

  getDefaultProps() {
    return {
      query: '',
      results: [],
      total: 0,
      currentPage: 0,
      totalPages: 1
    };
  },

  render() {
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
        <div className='column small-4'>
          {this._renderCategories()}
        </div>
        <div className='column small-8'>
          <div style={[style.resultsWraper]}>
            {this._renderResultsText()}
            {this._renderSearchContent()}
          </div>
        </div>
      </div>
    );
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
      let paginateAction = Actions.paginate(newPage);
      let maybeFetchAction = Actions.maybeFetchExtraResponses();
      this.props.dispatch(paginateAction);
      this.props.dispatch(maybeFetchAction);
      if (window) window.scrollTo(0, 0); // go to top
    };
    let _totalPages = Math.floor(this.props.total / this.props.resultsPerPage) + 1;
    return <Paginator currentPage={this.props.currentPage} totalPages={_totalPages} onPaginate={_onPaginate} />;
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

  _renderCategories() {
    if (this.props.aggregations.length === 0) return null
    let selectors = this.props.aggregations.map( d => {
      let _onClick = e => {
        e.preventDefault();
        let toggleAction = Actions.toggleAgg(d.key);
        let fetchAction = Actions.fetchSearchResults();
        this.props.dispatch(toggleAction);
        this.props.dispatch(fetchAction);
      }
      let _style = d.isActive ? [style.agg, style.activeAgg] : [style.agg, style.inactiveAgg];
      return (
        <div onClick={_onClick} style={_style} key={d.key}>
          <span>{d.name}</span>
          <span>{d.total.toLocaleString()}</span>
        </div>
        );
    });
    return (
      <div className="panel" style={[style.panel]}>
        <h3>Categories</h3>
        {selectors}
      </div>
    );
  },

  _renderResults() {
    let results = this.props.results;
    return results.map( (d, i) => {
      let id = d.id || i;
      return <SearchResult key={'searchResults' + id} {...d}/>;
    });
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
  resultsWraper: {
    minHeight: 600
  }
};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  // get the current page data
  let start = state.currentPage * state.resultsPerPage;
  let _results = state.results.slice(start, start + state.resultsPerPage);
  return {
    results: _results,
    total: state.total,
    query: state.query,
    aggregations: state.aggregations,
    isPending: state.isPending,
    currentPage: state.currentPage,
    resultsPerPage: state.resultsPerPage
  };
}

module.exports = connect(mapStateToProps)(Radium(SearchView));
