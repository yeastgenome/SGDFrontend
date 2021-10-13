require('isomorphic-fetch');
import { createPath } from '../lib/search_helpers';
import _ from 'underscore';
const queryString = require('query-string');
const RESULTS_URL = '/redirect_backend?param=get_search_results';
const WRAPPED_PAGE_SIZE = 250;

// helper methods
function fetchFromApi(url) {
  return fetch(url)
    .then(function (response) {
      if (response.status >= 400) {
        throw new Error('API error.');
      }
      return response.json();
    });
};
// fetches large page recursively until downloaded
function fetchPaginated(qp, onResponse, onComplete, page, allResults) {
  page = page || 0;
  allResults = allResults || [];
  let _offset = page * WRAPPED_PAGE_SIZE;
  let _limit = WRAPPED_PAGE_SIZE;
  let newQp = _.clone(qp);
  newQp.limit = _limit;
  newQp.offset = _offset;
  let url = createPath({ pathname: RESULTS_URL, search: newQp });
  fetchFromApi(url)
    .then(response => {
      let newResults = allResults.concat(response.results);
      if (typeof onResponse === 'function') onResponse(newResults);
      if (newResults.length < response.total) {
        return fetchPaginated(qp, onResponse, onComplete, page + 1, newResults);
      } else {
        if (typeof onComplete === 'function') onComplete(newResults);
        return;
      }
    });
};

export function setUserInput(newValue) {
  return {
    type: 'SET_USER_INPUT',
    value: newValue
  };
};

// start fetch, fetch, and start async fetching
export function startSearchFetchMaybeAsycFetch() {

  return function (dispatch, getState) {
    dispatch(startSearchFetch());
    dispatch(fetchSearchResults());
    const state = getState().searchResults;
    if (state.activeCategory === 'locus' && state.geneMode !== 'list') {
      dispatch(startAsyncFetch());
    }
  };
};

export function startSearchFetch() {
  return {
    type: 'START_SEARCH_FETCH',
  };
};

// paginated fetches for wrapped results
export function startAsyncFetch() {
  return function (dispatch, getState) {
    dispatch({ type: 'START_ASYNC_FETCH' });
    const state = getState();
    const qp = queryString.parse(state.router.location.search);
    function onResponse(results) {
      dispatch(receiveAsyncResponse(results));
    };
    function onComplete(results) {
      dispatch(finishAsync());
    }
    fetchPaginated(qp, onResponse, onComplete);
  };
};

// on the first time, does NOT fetch, just uses global bootstrappedSearchResults
export function fetchSearchResults() {
  return function (dispatch, getState) {
    // format the API request from quer params

    const state = getState();
    const searchState = state.searchResults;
    // if not isHydrated and global bootstrappedSearchResults, use that as result, don't fetch anything, set isHydrated to false
    if (!searchState.isHydrated && typeof bootstrappedSearchResults === 'object') {
      dispatch(hydrateSearch());
      return dispatch(receiveSearchResponse(bootstrappedSearchResults));
    }
    const qp = queryString.parse(state.router.location.search);
    // from page and results per page, add limit and offset to API request
    const _offset = searchState.currentPage * searchState.resultsPerPage;
    const _limit = searchState.resultsPerPage;
    const newQp = _.clone(qp);
    newQp.offset = _offset;
    newQp.limit = _limit;
    /*if(state.searchResults.downloadsFlag){
      newQp.status = 'Active';
    }*/
    const url = createPath({ pathname: RESULTS_URL, search: newQp });
    fetchFromApi(url)
      .then(response => {
        if (!response) return;
        dispatch(setApiError(false));
        return dispatch(receiveSearchResponse(response));
      })
    // .catch(function(err) {
    //   return dispatch(setApiError(true));
    // });
  };
};

export function receiveSearchResponse(_response) {
  console.log(_response);
  return {
    type: 'SEARCH_RESPONSE',
    response: _response
  };
};

export function receiveAsyncResponse(_results) {
  return {
    type: 'ASYNC_SEARCH_RESPONSE',
    results: _results
  };
};

export function finishAsync() {
  return {
    type: 'FINISH_ASYNC',
  };
};

export function setApiError(isError) {
  return {
    type: 'SEARCH_API_ERROR',
    value: isError
  };
};

export function hydrateSearch() {
  return {
    type: 'HYDRATE_SEARCH'
  };
};
