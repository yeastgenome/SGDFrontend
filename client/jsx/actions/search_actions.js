require('isomorphic-fetch');
import { getCategoryDisplayName, createPath } from '../lib/search_helpers';
import _ from 'underscore';

const AUTOCOMPLETE_URL = '/backend/autocomplete_results';
const RESULTS_URL = '/backend/get_search_results';

// helper methods
const fetchFromApi = function (url) {
  return fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error('API error.');
      }
      return response.json();
    });
};

export function setUserInput (newValue) {
  return {
    type: 'SET_USER_INPUT',
    value: newValue
  };
};

export function startSearchFetch () {
  return {
    type: 'START_SEARCH_FETCH',
  };
};

// on the first time, does NOT fetch, just uses global bootstrappedSearchResults
export function fetchSearchResults () {
  return function (dispatch, getState) {
    // format the API request from quer params
    const state = getState();
    const searchState = state.searchResults;
    // if not isHydrated and global bootstrappedSearchResults, use that as result, don't fetch anything, set isHydrated to false
    if (!searchState.isHydrated && typeof bootstrappedSearchResults === 'object') {
      dispatch(hydrateSearch());
      return dispatch(receiveSearchResponse(bootstrappedSearchResults));
    }
    const qp = (state.routing.location.query);
    const searchPath = state.routing.location.search;
    // from page and results per page, add limit and offset to API request
    const page = qp['page'] || 1;
    const _offset = searchState.currentPage * searchState.resultsPerPage; 
    const _limit = searchState.resultsPerPage;
    const newQp = _.clone(qp);
    newQp.offset = _offset;
    newQp.limit = _limit;
    const url = createPath({ pathname: RESULTS_URL, query: newQp });
    fetchFromApi(url)
      .then( response => {
        if (!response) return;
        dispatch(setApiError(false));
        return dispatch(receiveSearchResponse(response)); 
      })
      // .catch(function(err) {
      //   return dispatch(setApiError(true));
      // });
  }
};

export function receiveSearchResponse (_response) {
  return {
    type: 'SEARCH_RESPONSE',
    response: _response
  };
};

export function fetchAutocompleteResults () {
  return function (dispatch, getState) {
    let state = getState().searchResults;
    let url = `${AUTOCOMPLETE_URL}?q=${state.userInput}`;
    fetchFromApi(url)
      .then( response => {
        if (!response) return;
        // change result labels
        let results = response.results.map( d => {
          d.category = getCategoryDisplayName(d.category);
          return d;
        });
        let action = receiveAutocompleteResponse(results);
        return dispatch(action);
      });
  };
};

export function receiveAutocompleteResponse (_response) {
  return {
    type: 'AUTOCOMPLETE_RESPONSE',
    value: _response
  };
};

export function toggleGeneWrap () {
  return {
    type: 'TOGGLE_GENE_WRAP',
  };
};

export function setApiError (isError) {
  return {
    type: 'SEARCH_API_ERROR',
    value: isError
  };
};

export function hydrateSearch () {
  return {
    type: 'HYDRATE_SEARCH'
  };
};
