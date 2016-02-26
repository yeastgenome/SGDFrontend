import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getHrefWithoutAgg } from '../lib/search_helpers';

const SEARCH_URL = '/search';

const SearchBreadcrumb = React.createClass({
  render() {
    // TEMP
    return null;
    let catCrumbNode = this._renderCategoryCrumb();
    let secondaryAggCrumbsNode = this._renderSecondaryAggCrumbs();
    return <h2>{this.props.total.toLocaleString()} results for "{this.props.query}"{catCrumbNode}{secondaryAggCrumbsNode}</h2>;
  },

  _renderCategoryCrumb () {
    if (!this.props.activeCategory) return null;
    let href = this.props.history.createPath({ pathname: SEARCH_URL, query: { q: this.props.query } });
    return <span> in {this._renderCrumb(this.props.activeCategory, href)}</span>;
  },

  _renderSecondaryAggCrumbs () {
    let nodes = [];
    this.props.activeSecondaryAggs.map( d => {
      if (d.key === 'page') return null;
      d.values.map( _d => {
        let newHref = getHrefWithoutAgg(this.props.history, this.props.queryParams, d.key, _d, d.values);
        let node = <span key={`bcAgg${d.key}.${_d}`}> {this._renderCrumb(_d, newHref)}</span>;
        nodes.push(node);
      });
    });
    return <span>{nodes}</span>;
  },

  _renderCrumb (label, href) {
    return  <Link to={href} className='button small' style={style.bcButton}><i className='fa fa-times'/><span style={style.bcLabel}>{label}</span></Link>;
  }
});

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    total: state.total,
    query: state.query,
    activeCategory: state.activeCategory,
    activeSecondaryAggs: state.activeSecondaryAggs,
    queryParams: _state.routing.location.query
  };
};

const style = {
  bcButton: {
    padding: '0.5rem 0.75rem'
  },
  bcLabel: {
    marginLeft: '0.5rem'
  }
};

module.exports = connect(mapStateToProps)(Radium(SearchBreadcrumb));
