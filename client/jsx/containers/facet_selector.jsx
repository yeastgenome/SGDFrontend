import Select from 'react-select';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { routeActions } from 'react-router-redux'
import Radium from 'radium';
import _ from 'underscore';

import { getHrefWithoutAgg } from '../lib/search_helpers';

const SEARCH_URL = '/search';
const SELECT_MAX_CHAR_WIDTH = 8;

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
      return this._renderAgg(d.key, d.total, d.key, href);
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
    let catNodes = this.props.secondaryAggs.map( (d, i) => {
      // get current values
      let curAgg = _.findWhere(this.props.activeSecondaryAggs, { key: d.key });
      let currentActiveVals = (typeof curAgg === 'object') ? curAgg.values : [];
      // TEMP
      if (d.key === 'molecular_functions') {
        return this._renderReactSelect(d.key, d.values, currentActiveVals);
      }
      let valueNodes = d.values.map( (_d, i) => {
        let isActive = (currentActiveVals.indexOf(_d.key) > -1);
        let newHref = this._getToggledHref(d.key, _d.key, currentActiveVals);
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

  _renderReactSelect (aggKey, selectableValues, currentValues) {
    const _onChange = selectedKey => {
      let newHref = this._getToggledHref(aggKey, selectedKey, currentValues);
      this.props.dispatch(routeActions.push(newHref));
    };
    let selectValues = selectableValues.map( d => {
      // let _label = (d.key.length < SELECT_MAX_CHAR_WIDTH) ? d.key : `${d.key.slice(0, SELECT_MAX_CHAR_WIDTH)}...`;
      return { label: `${d.key} (${d.total})`, value: d.key };
    });
    return (
      <div key='mfSelector'>
        <p style={style.aggLabel}>Molecular Functions</p>
        <Select multi simpleValue placeholder="Select" options={selectValues} value={currentValues} onChange={_onChange} />
      </div>
    )
  },

  _getRawUrl () {
    return `${SEARCH_URL}?q=${this.props.query}`;
  },

  _getToggledHref (aggKey, value, currentValues) {
    return getHrefWithoutAgg(this.props.history, this.props.queryParams, aggKey, value, currentValues);
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
    userSelect: 'none',
    transition: 'background-color 300ms ease-out'
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
    secondaryAggs: state.secondaryAggs,
    activeSecondaryAggs: state.activeSecondaryAggs
  };
};

module.exports = connect(mapStateToProps)(Radium(FacetSelector));
