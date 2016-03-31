import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { routeActions } from 'react-router-redux'
import Radium from 'radium';
import _ from 'underscore';

import { getHrefWithoutAgg } from '../lib/search_helpers';

const DEFAULT_FACET_LENGTH = 5;
const MEDIUM_FACET_LENGTH = 20;
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
      return this._renderAgg(d.key, d.total, d.key, href, false, true);
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
        <p><Link to={this._getRawUrl()}><i className='fa fa-chevron-left' /> Show all categories</Link></p>
        <h2 className='search-cat-title'><span className={`search-cat ${this.props.activeCategory}`}/>{this.props.activeCategoryName}</h2>
        {this._renderSecondaryAggs()}
      </div>
    );
  },

  _renderSecondaryAggs () {
    const qp = this.props.queryParams;
    // if no filters, show a message
    let emptyMsgNode = <p>No filters are available for this category.</p>;;
    if (this.props.aggregations.length === 0) {
      return emptyMsgNode;
    // if there are filters, but no values, show same message
    } else if (_.max(this.props.aggregations, d => { return d.values.length; }).values.length === 0) {
      return emptyMsgNode;
    }
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
      return (
        <FacetList aggKey={d.key} values={d.values} currentValues={currentAgg.values} queryParams={this.props.queryParams} key={d.key}/>
      );
    });

    return (
      <div>
        {catNodes}
      </div>
    );
  },

  _renderAgg (name, total, _key, href, isActive, isCategory) {
    let activityStyle = isActive ? style.activeAgg: style.inactiveAgg;
    let catIconNode = isCategory ? <span className={`search-cat ${_key}`}></span> : null;
    return (
      <Link to={href} key={_key}>
        <div key={`aggA${_key}`} style={[style.agg, activityStyle]}>
          <span>{catIconNode}{name}</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </Link>
    );
  },

  _getRawUrl () {
    return `${SEARCH_URL}?q=${this.props.query}`;
  },

  _getToggledHref (aggKey, value, currentValues, isReset) {
    return getHrefWithoutAgg(this.props.queryParams, aggKey, value, currentValues, isReset);
  }
});

const FacetList = Radium(React.createClass({
  propTypes: {
    aggKey: React.PropTypes.string.isRequired,
    values: React.PropTypes.array.isRequired,
    currentValues: React.PropTypes.array.isRequired,
    queryParams: React.PropTypes.object.isRequired,
    name: React.PropTypes.string,
  },

  getInitialState () {
    // null means don't slice, show all
    return {
      isCollapsed: false,
      visibleLength: DEFAULT_FACET_LENGTH
    };
  },

  render () {
    // if no values, don't show
    if (this.props.values.length === 0) return null;
    const slicedValues = (this.state.visibleLength === null) ? this.props.values : this.props.values.slice(0, this.state.visibleLength);
    const valueNodes = slicedValues.map( (d, i) => {
      let isActive = (this.props.currentValues.indexOf(d.key) > -1);
      let newHref = this._getToggledHref(this.props.aggKey, d.key, this.props.currentValues);
      return this._renderAgg(d.key, d.total, `2agg${d.key}.${i}`, newHref, isActive);
    });
    const iconString = this.state.isCollapsed ? 'right' : 'down';
    const valuesNodesMaybe = this.state.isCollapsed ? null : <div>{valueNodes}{this._renderShowMoreMaybe()}</div>;
    return (
      <div>
        <p onClick={this._toggleIsCollapsed} style={style.aggLabel}><span>{this.props.name || this.props.aggKey}</span><i className={`fa fa-angle-${iconString}`} style={[style.icon]} /></p>
        {valuesNodesMaybe}
      </div>
    );
  },

  _renderShowMoreMaybe () {
    const visibleLength = this.state.visibleLength;
    const valLength = this.props.values.length;
    // no more to show, show nothing
    if (visibleLength === DEFAULT_FACET_LENGTH && valLength <= visibleLength) return null;
    let text, _onClick;
    // currently showing all, allow collapse
    if (visibleLength === null) {
      _onClick = e => {
        e.preventDefault();
        this.setState({ visibleLength: DEFAULT_FACET_LENGTH });
      };
      text = `Show ${DEFAULT_FACET_LENGTH}`;
    // only showing 5, show more
    } else if (visibleLength === DEFAULT_FACET_LENGTH) {
      _onClick = e => {
        e.preventDefault();
        this.setState({ visibleLength: MEDIUM_FACET_LENGTH });
      };
      text = 'Show more';
    // medium length, show all
    } else {
      _onClick = e => {
        e.preventDefault();
        this.setState({ visibleLength: null });
      };
      text = 'Show all';
    }
    return <p className='text-right'><a onClick={_onClick}>{text}</a></p>;
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

  _getToggledHref (aggKey, value, currentValues, isReset) {
    return getHrefWithoutAgg(this.props.queryParams, aggKey, value, currentValues, isReset);
  },

  _toggleIsCollapsed () {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  }
}));

const LINK_COLOR = '#6582A6';
const HOVER_COLOR = '#e6e6e6';
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
    border: `1px solid ${HOVER_COLOR}`,
    ':hover': {
      background: LINK_COLOR
    }
  },
  inactiveAgg: {
    background: 'none',
    color: LINK_COLOR,
    border: '1px solid transparent',
    ':hover': {
      background: HOVER_COLOR
    }
  },
  panel: {
    marginTop: '0.5rem'
  },
  aggLabel: {
    margin: '0 0 0.5rem 0',
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    textTransform: 'capitalize',
    fontWeight: 'bold'
  },
  icon: {
    fontWeight: 'bold'
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
