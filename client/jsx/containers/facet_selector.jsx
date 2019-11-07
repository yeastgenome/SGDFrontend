import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { routeActions, push } from 'react-router-redux';
import Radium from 'radium';
import _ from 'underscore';
import pluralize from 'pluralize';
import StatusBtns from '../components/status_buttons/status_btns.jsx';
import { getHrefWithoutAgg, getCategoryDisplayName, getFacetName } from '../lib/search_helpers';
import ClassNames from 'classnames';
import S from 'string';

const DEFAULT_FACET_LENGTH = 5;
const MEDIUM_FACET_LENGTH = 20;
const SEARCH_URL = '/search';
const SELECT_MAX_CHAR_WIDTH = 8;
const SELECT_OPTION_DELEMITER = '@@';

const FacetSelector = React.createClass({
  propTypes: {
    downloadStatus: React.PropTypes.func,
    downloadStatusStr: React.PropTypes.string
  },
  render() {
    if (this.props.isAggPending) return null;
    return (
      <div>
        {this.props.activeCategory
          ? this._renderCatAggs()
          : this._renderCatSelector()}
      </div>
    );
  },

  _renderCatSelector() {
    let keySuffix = this.props.isMobile ? 'm' : '';
    let aggs =
      this.props.aggregations.length === 0
        ? []
        : this.props.aggregations[0].values;
    let aggNodes = aggs.map((d, i) => {
      let name = pluralize(getCategoryDisplayName(d.key));
      let href = '';
      if (d.key === 'download') {
        if(!location.search.toLocaleLowerCase().includes('status=active')){
          href = `${this._getRawUrl()}&category=${d.key}&status=Active`;
        }
        else{
          href = `${this._getRawUrl()}&category=${d.key}`;
        }
        
      } else {
        href = `${this._getRawUrl()}&category=${d.key}`;
      }
      return this._renderAgg(name, d.total, d.key, href, false, true);
    });
    return (
      <div>
        <p className={'cat-label'}>Categories</p>
        {aggNodes}
      </div>
    );
  },

  _renderCatAggs() {
    let catName =
      this.props.activeCategory === 'locus'
        ? 'Genes / Genomic Features'
        : pluralize(getCategoryDisplayName(this.props.activeCategory));
    return (
      <div>
        <p>
          <Link to={this._getRawUrl()}>
            <i className='fa fa-chevron-left' /> Show all categories
          </Link>
        </p>
        <h2 className='search-cat-title'>
          <span className={`search-cat ${this.props.activeCategory}`} />
          {catName}
        </h2>
        {this._renderSecondaryAggs()}
      </div>
    );
  },

  _renderSecondaryAggs() {
    const qp = this.props.queryParams;

    // if no filters, show a message
    let emptyMsgNode = <p>No filters are available for this category.</p>;
    if (this.props.aggregations.length === 0) {
      return emptyMsgNode;
      // if there are filters, but no values, show same message
    } else if (
      _.max(this.props.aggregations, d => {
        return d.values.length;
      }).values.length === 0
    ) {
      return emptyMsgNode;
    }
    let catNodes = this.props.aggregations.map((d, i) => {
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
      }
      if (d.key === 'status' && qp.category === 'download') {
        return <FacetList customFacetRadioBtnFlag={true} customFacetFlag={true} aggKey={d.key} values={[{}]} currentValues={currentAgg.values} queryParams={this.props.queryParams} key={d.key} name={getFacetName(d.key)} downloadStatus={this.props.downloadStatus} downloadStatusStr={this.props.downloadStatusStr} />;
      } else {
        return <FacetList customFacetRadioBtnFlag={true} customFacetFlag={false} aggKey={d.key} values={d.values} currentValues={currentAgg.values} queryParams={this.props.queryParams} key={d.key} name={getFacetName(d.key)} downloadStatus={this.props.downloadStatus} downloadStatusStr={this.props.downloadStatusStr} />;
      }
    });

    return <div>{catNodes}</div>;
  },

  _renderAgg(name, total, _key, href, isActive, isCategory) {
    let activityStyle = isActive ? 'active-agg' : 'inactive-agg';
    let klass = isActive ? 'search-agg active' : 'search-agg';
    let catIconNode = isCategory ? (
      <span className={`search-cat ${_key}`} />
    ) : null;
    return (
      <Link to={href} key={_key}>
        <div
          key={`aggA${_key}`}
          className={ClassNames(klass, 'agg', activityStyle)}
        >
          <span>
            {catIconNode}
            {name}
          </span>
          <span>{total.toLocaleString()}</span>
        </div>
      </Link>
    );
  },

  _getRawUrl() {
    return `${SEARCH_URL}?q=${encodeURIComponent(this.props.query)}`;
  },

  _getToggledHref(aggKey, value, currentValues, isReset) {
    return getHrefWithoutAgg(
      this.props.queryParams,
      aggKey,
      value,
      currentValues,
      isReset
    );
  }
});

const FacetList = Radium(
  React.createClass({
    propTypes: {
      aggKey: React.PropTypes.string.isRequired,
      values: React.PropTypes.array.isRequired,
      currentValues: React.PropTypes.array.isRequired,
      queryParams: React.PropTypes.object.isRequired,
      name: React.PropTypes.string,
      customFacetFlag: React.PropTypes.bool,
      customFacetRadioBtnFlag: React.PropTypes.bool,
      downloadStatus: React.PropTypes.func,
      downloadStatusStr: React.PropTypes.string
    },

    getInitialState() {
      // null means don't slice, show all
      let tempStr = 'active'
        if (location.search
            .toLocaleLowerCase()
            .indexOf('active') > -1) {
              tempStr='active';
        } else if (location.search
            .toLocaleLowerCase()
            .indexOf('archived') > -1) {
              tempStr = 'archived';
        }

      return { isCollapsed: false, visibleLength: DEFAULT_FACET_LENGTH, selectedStatus: tempStr, statusObj: { active: { href: '/search?category=download&page=0&q=&status=Active' }, archived: { href: '/search?category=download&page=0&q=&status=Archived' } } };
    },

    render() {
      // if no values, don't show
      if (this.props.values.length === 0) return null;
      const slicedValues =
        this.state.visibleLength === null
          ? this.props.values
          : this.props.values.slice(0, this.state.visibleLength);
      const valueNodes = slicedValues.map((d, i) => {
        let isActive = this.props.currentValues.indexOf(d.key) > -1;
        let newHref = this._getToggledHref(
          this.props.aggKey,
          d.key,
          this.props.currentValues
        );
        if (this.props.customFacetFlag) {
          let temp = [];
          for (let itm in this.state.statusObj) {
            let modNewRef = this._getToggledHref('status', itm, this.props.currentValues);
            if(this.props.downloadStatusStr){
              temp.push(this._renderStatusButtons(itm, `2agg${itm}`, modNewRef, isActive, this.props.downloadStatusStr));
            }
            else{
              temp.push(this._renderStatusButtons(itm, `2agg${itm}`, modNewRef, isActive, ''));

            }
            
          }
          return temp;
        }
        return this._renderAgg(
          d.key,
          d.total,
          `2agg${d.key}.${i}`,
          newHref,
          isActive
        );
      });
      const iconString = this.state.isCollapsed ? 'right' : 'down';
      const valuesNodesMaybe = this.state.isCollapsed ? null : (
        <div>
          {valueNodes}
          {this._renderShowMoreMaybe()}
        </div>
      );
      return (
        <div>
          <p onClick={this._toggleIsCollapsed} className={'agg-label'}>
            <span>{this.props.name || this.props.aggKey}</span>
            <i className={`fa fa-angle-${iconString} icon`} />
          </p>
          {valuesNodesMaybe}
        </div>
      );
    },
    _onStatusBtnChange(event) {
      
      this.setState({
        selectedStatus: event.currentTarget.value.toLowerCase()
      });
      this.props.downloadStatus(event.currentTarget.value.toLowerCase());
    },

    _renderStatusButtons(name, _key, href, isActive, dStr) {
      if(dStr){
        return <StatusBtns name={name} btnKey={_key} key={_key} href={href} isActive={isActive} btnClick={this._onStatusBtnChange} flag={dStr.toLowerCase() === name.toLowerCase()} actionFunc={this.props.actionTrigger} sString={this.props.sStatus} />;
      }
      else{
        return <StatusBtns name={name} btnKey={_key} key={_key} href={href} isActive={isActive} btnClick={this._onStatusBtnChange} flag={this.state.selectedStatus === name.toLowerCase()} actionFunc={this.props.actionTrigger} sString={this.props.sStatus} />;
      }
      
    },

    _renderShowMoreMaybe() {
      const visibleLength = this.state.visibleLength;
      const valLength = this.props.values.length;
      // no more to show, show nothing
      if (visibleLength === DEFAULT_FACET_LENGTH && valLength <= visibleLength)
        return null;
      /*else if (valLength == 1){
        return null;
      }*/
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
      }
      else if (valLength < DEFAULT_FACET_LENGTH) {
        _onClick = e => {
          e.preventDefault();
          this.setState({
            visibleLength: valLength
          });
        }
      }
    
      else if (valLength === MEDIUM_FACET_LENGTH) {
        _onClick = e => {
          e.preventDefault();
          this.setState({
            visibleLength: DEFAULT_FACET_LENGTH
          });
        };
        text = `Show ${DEFAULT_FACET_LENGTH}`;

      }
       else {
        _onClick = e => {
          e.preventDefault();
          this.setState({ visibleLength: null });
        };
        text = 'Show all';
      }
      return (
        <p className='text-right'>
          <a onClick={_onClick}>{text}</a>
        </p>
      );
    },

    _renderAgg(name, total, _key, href, isActive) {
      let activityStyle = isActive ? 'active-agg' : 'inactive-agg';
      let klass = isActive ? 'search-agg active' : 'search-agg';
      return (
        <Link to={href} key={_key}>
          <div
            key={`aggA${_key}`}
            className={ClassNames(klass, 'agg', activityStyle)}
          >
            <span>{name}</span>
            <span>{total.toLocaleString()}</span>
          </div>
        </Link>
      );
    },

    _getToggledHref(aggKey, value, currentValues, isReset) {
      return getHrefWithoutAgg(
        this.props.queryParams,
        aggKey,
        value,
        currentValues,
        isReset
      );
    },

    _toggleIsCollapsed() {
      this.setState({ isCollapsed: !this.state.isCollapsed });
    }
  })
);

function mapStateToProps(_state) {
  let state = _state.searchResults;
  state.aggregations.map( item => {
    if (item.key == 'year'){
      item['values'].sortOnYear('key', true);
      return;
    }
  });
  return {
    aggregations: state.aggregations,
    query: state.query,
    queryParams: _state.routing.location.query,
    activeCategory: state.activeCategory,
    isAggPending: state.isAggPending,
  };
};

Array.prototype.sortOnYear = function(key, order) {
  this.sort((a, b) => {
    if (order) {
      if (a[key] > b[key]) {
        return -1;
      } else if (a[key] < b[key]) {
        return 1;
      } else {
        return 0;
      }
    }
    else{
      if (a[key] < b[key]) {
        return -1;
      } else if (a[key] > b[key]) {
        return 1;
      } else {
        return 0;
      }
    }
    
  });
};

export default connect(mapStateToProps)(Radium(FacetSelector));
