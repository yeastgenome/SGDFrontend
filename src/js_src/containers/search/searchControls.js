import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import style from './style.css';
import { getQueryParamWithValueChanged,convertSearchObjectToString } from '../../lib/searchHelpers';

import { selectTotalPages, selectQueryParams } from '../../selectors/searchSelectors';

const SEARCH_PATH = '/search';

class SearchControlsComponent extends Component {
  renderViewAs() {
    let listQp = getQueryParamWithValueChanged('mode', 'list', this.props.queryParams);
    listQp = convertSearchObjectToString(listQp);
    let tableQp = getQueryParamWithValueChanged('mode', 'table', this.props.queryParams);
    tableQp = convertSearchObjectToString(tableQp);
    let listHref = { pathname: SEARCH_PATH, search: listQp};
    let tableHref = { pathname: SEARCH_PATH, search: tableQp};
    return (
      <div className={style.control}>
        <label className={style.searchLabel}>View As</label>
        <div className='button-group' role='group'>
          <Link className={`button ${this.props.isList ? '': 'hollow'}`} to={listHref}><i className='fa fa-list' /> List</Link>
          <Link className={`button ${!this.props.isList ? '': 'hollow'}`} to={tableHref}><i className='fa fa-table' /> Table</Link>
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
    prevQp = convertSearchObjectToString(prevQp);
    let nextQp = getQueryParamWithValueChanged('page', nextPage, this.props.queryParams);
    nextQp = convertSearchObjectToString(nextQp);
    let prevHef = { pathname: SEARCH_PATH, search: prevQp};
    let nextHef = { pathname: SEARCH_PATH, search: nextQp};
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
  currentPage: PropTypes.number,
  isList: PropTypes.bool,
  queryParams: PropTypes.object,
  totalPages: PropTypes.number
};

function mapStateToProps(state) {
  let _queryParams = selectQueryParams(state);
  let _isList = (_queryParams.mode === 'list');
  return {
    currentPage: parseInt(_queryParams.page) || 1,
    isList: _isList,
    queryParams: _queryParams,
    totalPages: selectTotalPages(state)
  };
}

export { SearchControlsComponent as SearchControlsComponent };
export default connect(mapStateToProps)(SearchControlsComponent);
