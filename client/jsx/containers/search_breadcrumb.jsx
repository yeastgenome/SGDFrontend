import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getHrefWithoutAgg } from '../lib/search_helpers';

const SEARCH_URL = '/search';
const SKIPPED_PARAMS = ['page', 'q'];

const SearchBreadcrumb = React.createClass({
  render() {
    return <h2>{this.props.total.toLocaleString()} results for "{this.props.queryParams.q}" {this._renderCrumbs()}</h2>;
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
        nodes.push(this._renderCrumb(qp['category'], newHref));
      // if single value, append the link
      } else if (typeof qp[key] === 'string') {
        let thisValue = qp[key];
        let currentValues = [thisValue];
        let newHref = getHrefWithoutAgg(this.props.history, qp, key, thisValue, currentValues);
        nodes.push(this._renderCrumb(qp[key], newHref));
      // if multiple, map them
      } else {
        let currentValues = qp[key];
        currentValues.forEach( thisValue => {
          let newHref = getHrefWithoutAgg(this.props.history, qp, key, thisValue, currentValues);
          nodes.push(this._renderCrumb(thisValue, newHref));
        });
      }
    });
    return nodes;
  },

  _renderCrumb (label, href) {
    return  <span key={`bcBtn${label}`}><Link to={href} className='button small' style={style.bcButton}><i className='fa fa-times'/><span style={style.bcLabel}>{label}</span></Link> </span>;
  }
});

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    total: state.total,
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

export default connect(mapStateToProps)(Radium(SearchBreadcrumb));
