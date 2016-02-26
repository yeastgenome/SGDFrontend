require('isomorphic-fetch');
import { getCategoryDisplayName, createPath } from '../lib/search_helpers';
import _ from 'underscore';

const AUTOCOMPLETE_URL = '/backend/autocomplete_results';
const DEFAULT_RESULTS_PER_PAGE = 10;
const LARGER_RESULTS_PER_PAGE = 220;
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

export function fetchSearchResults () {
  return function (dispatch, getState) {
    // format the API request from quer params
    const state = getState();
    const qp = (state.routing.location.query);
    const searchPath = getState().routing.location.search;
    // from page and results per page, add limit and offset to API request
    const page = qp['page'] || 1;
    // allow results per page to be bigger if on locus and wrapping results;
    const isLarge = (qp['category'] === 'locus' && state.searchResults.wrapGeneResults);
    const resultsPerPage = (isLarge) ? LARGER_RESULTS_PER_PAGE : DEFAULT_RESULTS_PER_PAGE;
    const _offset = state.searchResults.currentPage * resultsPerPage; 
    const _limit = resultsPerPage;
    const newQp = _.clone(qp);
    newQp.offset = _offset;
    newQp.limit = _limit;
    const url = createPath({ pathname: RESULTS_URL, query: newQp });
    fetchFromApi(url)
      .then( response => {
        if (!response) return;
        response.aggregations = response.aggregations.map( d => {
          d.name = d.key;
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
