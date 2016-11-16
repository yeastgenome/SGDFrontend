import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import style from './style.css';
import { getQueryParamWithValueChanged } from '../../lib/searchHelpers';

import {
  selectActiveCategory,
  selectTotalPages,
  selectQueryParams
} from '../../selectors/searchSelectors';

const SEARCH_PATH = '/search';

class SearchControlsComponent extends Component {
  renderViewAs() {
    let listQp = getQueryParamWithValueChanged('mode', 'list', this.props.queryParams);
    let tableQp = getQueryParamWithValueChanged('mode', 'table', this.props.queryParams);
    let listHref = { pathname: SEARCH_PATH, query: listQp };
    let tableHref = { pathname: SEARCH_PATH, query: tableQp };
    return (
      <div className={style.control}>
        <label className={style.searchLabel}>View As</label>
        <div className='button-group' role='group'>
          <Link className={`button ${!this.props.isTable ? '': 'hollow'}`} to={listHref}><i className='fa fa-list' /> List</Link>
          <Link className={`button ${this.props.isTable ? '': 'hollow'}`} to={tableHref}><i className='fa fa-table' /> Table</Link>
        </div>
      </div>
    );
  }

  renderPaginator() {
    let curPage = this.props.currentPage;
    let totPage = this.props.totalPages;
    let nextPage = Math.min(this.props.totalPages, curPage + 1);
    let prevPage = Math.max(1, curPage - 1);
    let prevQp = getQueryParamWithValueChanged('page', prevPage, this.props.queryParams);
    let nextQp = getQueryParamWithValueChanged('page', nextPage, this.props.queryParams);
    let prevHef = { pathname: SEARCH_PATH, query: prevQp };
    let nextHef = { pathname: SEARCH_PATH, query: nextQp };
    let isPrevDisabled = curPage <= 1;
    let isNextDisabled = curPage >= totPage;
    return (
      <div className={style.control}>
        <label className={`${style.searchLabel}`}>Page {curPage.toLocaleString()} of {totPage.toLocaleString()}</label>
        <div className='button-group' role='group'>
          <Link className={`button ${isPrevDisabled ? ' disabled' : ''}`} to={prevHef}><i className='fa fa-chevron-left' /></Link>
          <Link className={`button ${isNextDisabled ? ' disabled' : ''}`} to={nextHef}><i className='fa fa-chevron-right' /></Link>
        </div>
      </div>
    );
  }

  renderNonViewAs() {
    if (this.props.isMultiTable) return null;
    return (
      <div className={style.controlContainer}>
        {this.renderPaginator()}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderViewAs()}
        {this.renderNonViewAs()}
      </div>
    );
  }
}

SearchControlsComponent.propTypes = {
  currentPage: React.PropTypes.number,
  isMultiTable: React.PropTypes.bool,
  isTable: React.PropTypes.bool,
  queryParams: React.PropTypes.object,
  totalPages: React.PropTypes.number
};

function mapStateToProps(state) {
  let _queryParams = selectQueryParams(state);
  let activeCategory = selectActiveCategory(state);
  let _isTable = (_queryParams.mode === 'table');
  let _isMultiTable = (_isTable && activeCategory === 'none') ;
  return {
    currentPage: parseInt(_queryParams.page) || 1,
    isTable: _isTable,
    isMultiTable: _isMultiTable,
    queryParams: _queryParams,
    totalPages: selectTotalPages(state)
  };
}

export { SearchControlsComponent as SearchControlsComponent };
export default connect(mapStateToProps)(SearchControlsComponent);
