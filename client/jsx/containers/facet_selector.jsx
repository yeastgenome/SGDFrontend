import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { routeActions } from 'react-router-redux'
import Radium from 'radium';
import Select from 'react-select';
import _ from 'underscore';

import { getHrefWithoutAgg } from '../lib/search_helpers';

const SEARCH_URL = '/search';
const SELECT_MAX_CHAR_WIDTH = 8;
const SELECT_OPTION_DELEMITER = '@@';

const FacetSelector = React.createClass({
  render() {
    if (this.props.isAggPending) return null;
    return (
      <div style={[style.panel]}>
        {this.props.activeCategory ? this._renderCatAggs() : this._renderCatSelector()}
      </div>
    );
  },

  _renderCatSelector () {
    let keySuffix = this.props.isMobile ? 'm': '';
    let aggs = (this.props.aggregations.length === 0) ? [] : this.props.aggregations[0].values;
    let aggNodes = aggs.map( (d, i) => {
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
        {this._renderSecondaryAggs()}
      </div>
    );
  },

  _renderSecondaryAggs () {
    const qp = this.props.queryParams;
    let catNodes = this.props.aggregations.map( (d, i) => {
      // create a currentAgg object like { key: 'cellular component', values: ['cytoplasm'] }
      let currentAgg = { key: d.key };
      let rawValue = qp[d.key];
      switch (typeof rawValue) {
        case 'string':
          currentAgg.values = [rawValue];
          break;
        case 'object':
          currentAgg.values = rawValue;
          break;
        default:
          currentAgg.values = [];
          break;
      };
      // TEMP
      if (d.key === 'biological_process' || d.key === 'cellular_component' || d.key === 'molecular_function') {
        return this._renderReactSelect(d.key, d.values, currentAgg.values);
      }
      let valueNodes = d.values.map( (_d, _i) => {
        let isActive = (currentAgg.values.indexOf(_d.key) > -1);
        let newHref = this._getToggledHref(d.key, _d.key, currentAgg.values);
        return this._renderAgg(_d.key, _d.total, `2agg${_d.key}${i}.${_i}`, newHref, isActive);
      });
      return (
        <div key={`2aggContainer${d.key}`}>
          <p style={style.aggLabel}>{d.name || d.key}</p>
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
    const _onChange = selectedItems => {
      let newVals = (selectedItems === '') ? [] : selectedItems.split(SELECT_OPTION_DELEMITER);
      let newHref = this._getToggledHref(aggKey, newVals, currentValues, true);
      this.props.dispatch(routeActions.push(newHref));
    };
    let selectValues = selectableValues.map( d => {
      return { label: `${d.key} (${d.total})`, value: d.key };
    });
    // trim labels once selected to display
    const _valueRenderer = val => {
      let _label = (val.label.length < SELECT_MAX_CHAR_WIDTH) ? val.label : `${val.label.slice(0, SELECT_MAX_CHAR_WIDTH)}...`;
      return <span>{_label}</span>;
    };

    return (
      <div key={`aggSelect${aggKey}`}>
        <p style={style.aggLabel}>{aggKey}</p>
        <Select multi simpleValue placeholder="Select" options={selectValues} value={currentValues} onChange={_onChange} valueRenderer={_valueRenderer} delimiter={SELECT_OPTION_DELEMITER} />
      </div>
    )
  },

  _getRawUrl () {
    return `${SEARCH_URL}?q=${this.props.query}`;
  },

  _getToggledHref (aggKey, value, currentValues, isReset) {
    return getHrefWithoutAgg(this.props.queryParams, aggKey, value, currentValues, isReset);
  }
});

const LINK_COLOR = '#6582A6';
const style = {
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
    aggregations: state.aggregations,
    query: state.query,
    queryParams: _state.routing.location.query,
    activeCategory: state.activeCategory,
    activeCategoryName: state.activeCategoryName,
    isAggPending: state.isAggPending
  };
};

module.exports = connect(mapStateToProps)(Radium(FacetSelector));
