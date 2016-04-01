import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getHrefWithoutAgg, getCategoryDisplayName } from '../lib/search_helpers';

const SEARCH_URL = '/search';
const SKIPPED_PARAMS = ['page', 'q', 'wrapResults', 'is_quick'];

const SearchBreadcrumb = React.createClass({
  render() {
    return <h2>{this._getText()} {this._renderCrumbs()}</h2>;
  },

  // From query params, render links to undo filter selections.  Each one is a link to the href of the unselected filter.
  _renderCrumbs () {
    const qp = this.props.queryParams;
    // console.log(Object.keys(this.props.queryParams))
    const nodes = [];
    Object.keys(qp).forEach( key => {
      // don't render for page or q param
      if (SKIPPED_PARAMS.indexOf(key) >= 0) return;
      // if category, give a really simple URL that returns to the initial results page (no filters)
      if (key === 'category') {
        let newHref = `${SEARCH_URL}?q=${this.props.queryParams.q}`;
        let name = getCategoryDisplayName(qp.category);
        nodes.push(this._renderCrumb(name, newHref));
      // if single value, append the link
      } else if (typeof qp[key] === 'string') {
        let thisValue = qp[key];
        let currentValues = [thisValue];
        let newHref = getHrefWithoutAgg(qp, key, thisValue, currentValues);
        nodes.push(this._renderCrumb(qp[key], newHref));
      // if multiple, map them
      } else {
        let currentValues = qp[key];
        currentValues.forEach( thisValue => {
          let newHref = getHrefWithoutAgg(qp, key, thisValue, currentValues);
          nodes.push(this._renderCrumb(thisValue, newHref));
        });
      }
    });
    return nodes;
  },

  _renderCrumb (label, href) {
    return  <span key={`bcBtn${label}`}><Link to={href} className='button small' style={style.bcButton}><i className='fa fa-times'/><span style={style.bcLabel}>{label}</span></Link> </span>;
  },

  _getText () {
    const query = this.props.query;
    const totalString = this.props.total.toLocaleString();
    // blank query
    if (query === '') {
      return `${totalString} results`;
    // if pending results, not just pagination
    } else if (this.props.isPending && !this.props.isPaginatePending) {
      return `... results for "${query}"`;
    // everything done
    } else {
      return `${totalString} results for "${query}"`
    }
  }
});

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    total: state.total,
    query: state.query,
    queryParams: _state.routing.location.query,
    isPending: state.isPending,
    isPaginatePending: state.isPaginatePending,
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

export default connect(mapStateToProps)(Radium(SearchBreadcrumb));
