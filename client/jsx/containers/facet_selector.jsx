import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Radium from 'radium';
import _ from 'underscore';

const SEARCH_URL = '/search';

const FacetSelector = React.createClass({
  render() {
    let klass = this.props.isMobile ? '' : 'panel';
    return (
      <div className={klass} style={[style.panel]}>
        {this.props.activeCategory ? this._renderCatAggs() : this._renderCatSelector()}
      </div>
    );
  },

  _renderCatSelector () {
    let keySuffix = this.props.isMobile ? 'm': '';
    let aggNodes = this.props.categoryAggs.map( (d, i) => {
      let key = `aggNode${d.key}${keySuffix}`;
      let href = `${this._getRawUrl()}&category=${d.key}`;
      return this._renderAgg(d.name, d.total, d.key, href);
    });
    return (
      <div>
        <p>Categories</p>
        {aggNodes}
      </div>
    );
  },

  _renderCatAggs () {
    return (
      <div>
        <p><Link to={this._getRawUrl()}><i className='fa fa-chevron-left'/> Show all categories</Link></p>
        <h2>{this.props.activeCategoryName}</h2>
        {this._renderGeneAggs()}
      </div>
    );
  },

  _renderGeneAggs () {
    let qp = this.props.queryParams;
    let baseHref = `${this._getRawUrl()}&category=locus`;
    let catNodes = this.props.secondaryAggs.map( (d, i) => {
      // get current actives from URL
      let currentActiveVals;
      switch (typeof qp[d.key]) {
        case 'string':
          currentActiveVals = [qp[d.key]];
          break;
        case 'object': // array
          currentActiveVals = qp[d.key];
          break;
        default:
          currentActiveVals = [];
      }
      let valueNodes = d.values.map( (_d, i) => {
        // create the href that would be true if you toggled the current value
        let newActiveVals = currentActiveVals.slice(0);
        let isActive = (currentActiveVals.indexOf(_d.key) > -1);
        if (isActive) {
          newActiveVals = _.without(currentActiveVals, _d.key);
        } else {
          newActiveVals.push(_d.key);
        }
        let newQp = _.clone(qp);
        newQp[d.key] = newActiveVals;
        let newHref = this.props.history.createPath({ pathname: SEARCH_URL, query: newQp });
        return this._renderAgg(_d.key, _d.total, `2agg${_d.key}`, newHref, isActive);
      });
      return (
        <div key={`2aggContainer${d.key}`}>
          <p style={style.aggLabel}>{d.key}</p>
          {valueNodes}
        </div>
      );
    });

    return (
      <div>
        {catNodes}
      </div>
    );
  },

  _renderAgg (name, total, _key, href, isActive) {
    let activityStyle = isActive ? style.activeAgg: style.inactiveAgg;
    return (
      <Link to={href} key={_key}>
        <div key={`aggA${_key}`} style={[style.agg, activityStyle]}>        
          <span>{name}</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </Link>
    );
  },

  _getRawUrl () {
    return `${SEARCH_URL}?q=${this.props.query}`;
  }
});

const LINK_COLOR = '#11728b';
var style = {
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
  panel: {
    marginTop: '0.5rem'
  },
  aggLabel: {
    marginBottom: 0
  }
};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    query: state.query,
    queryParams: _state.routing.location.query,
    activeCategory: state.activeCategory,
    activeCategoryName: state.activeCategoryName,
    categoryAggs: state.categoryAggs,
    secondaryAggs: state.secondaryAggs
  };
};

module.exports = connect(mapStateToProps)(Radium(FacetSelector));
