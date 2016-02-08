require('isomorphic-fetch');
const AUTOCOMPLETE_URL = '/backend/autocomplete_results';
const RESULTS_PER_PAGE = 10;
const RESULTS_URL = '/backend/get_search_results';

import { getCategoryDisplayName } from '../lib/search_helpers';

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

export function fetchSearchResults () {
  return function (dispatch, getState) {
    let state = getState().searchResults;
    let query = state.query;
    // offset and limit for paginate
    let _offset = state.currentPage * RESULTS_PER_PAGE;
    let catQueryParam = state.activeCategory ? `&category=${state.activeCategory}` : '';
    let url = `${RESULTS_URL}?q=${query}${catQueryParam}&limit=${RESULTS_PER_PAGE}&offset=${_offset}`;
    fetchFromApi(url)
      .then( response => {
        if (!response) return;
        response.aggregations = response.aggregations.map( d => {
          d.key = d.key;
          d.name = getCategoryDisplayName(d.key);
          return d;
        });
        response.results = response.results.map( d => {
          d.category = getCategoryDisplayName(d.category);
          return d;
        });
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

export function toggleAgg (_key) {
  return {
    type: 'TOGGLE_AGG',
    key: _key
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
