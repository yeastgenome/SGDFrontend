import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

const SEARCH_URL = '/search';


const SearchBreadcrumb = React.createClass({
  render() {
    let catCrumbNode = this._renderCategoryCrumb();
    let secondaryAggCrumbNode
    return (
      <h2>{this.props.total.toLocaleString()} results for "{this.props.query}"{catCrumbNode}</h2>
    );
  },

  _renderCategoryCrumb () {
    if (!this.props.activeCategory) return null;
    let href = this.props.history.createPath({ pathname: SEARCH_URL, query: { q: this.props.query } });
    return <span> in {this._renderCrumb(this.props.activeCategory, href)}</span>;
  },

  _renderCrumb (label, href) {
    return  <Link to={href} className='button small' style={style.bcButton}><span style={style.bcLabel}>{label}</span><i className='fa fa-times'/></Link>;
  }
});

function mapStateToProps(_state) {
  let state = _state.searchResults;

  return {
    results: state.results,
    total: state.total,
    query: state.query,
    activeCategory: state.activeCategory,
    activeSecondaryAggs: state.activeSecondaryAggs
  };
};

const style = {
  bcButton: {
    padding: '0.5rem 0.75rem'
  },
  bcLabel: {
    marginRight: '1rem'
  }
};

module.exports = connect(mapStateToProps)(Radium(SearchBreadcrumb));
