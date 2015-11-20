require('isomorphic-fetch');
const AUTOCOMPLETE_URL = '/backend/autocomplete_results';
const RESULTS_PER_PAGE = 10;
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
const getCategoryDisplayName = function (key) {
  const labels = {
    locus: 'Loci',
    reference: 'References',
    cellular_component: 'Cellular Components',
    molecular_function: 'Molecular Functions',
    biological_process: 'Biological Processes',
    phenotype: 'Phenotypes',
    strain: 'Strains',
    author: 'Authors',
    download: 'Download'
  };
  return labels[key];
}

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
    // stringify aggregations for url
    let selectedAggs = state.aggregations
      .filter( d => { return d.isActive; })
      .map( d => { return d.key; });
    let aggQueryParam = state.activeAggregations.length === 0 ? '' : `categories=${state.activeAggregations.join()}`;
    // offset and limit for paginate
    let offsetStart = (state.currentPage === 0 ? 0 : 1);
    let _offset = (state.currentPage + offsetStart) * RESULTS_PER_PAGE;
    let url = `${RESULTS_URL}?q=${query}&${aggQueryParam}&limit=${RESULTS_PER_PAGE}&offset=${_offset}`;
    const AUTOCOMPLETE_URL = '/backend/autocomplete_results';
    fetchFromApi(url)
      .then( response => {
        response.aggregations = response.aggregations.map( d => {
          d.key = d.name;
          d.name = getCategoryDisplayName(d.name);
          return d;
        });
        response.results = response.results.map( d => {
          d.category = getCategoryDisplayName(d.category);
          return d;
        });
        return dispatch(receiveSearchResponse(response)); 
      });
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
    // TEMP don't fetch just hardcode
    let response = {  
     "results":[  
        {  
           "category":"suggestion",
           "name":"ACTin"
        },
        {  
           "href":"/go/GO:0019211/overview",
           "category":"GO",
           "name":"phosphatase activator activity"
        },
        {  
           "href":"/go/GO:0044692/overview",
           "category":"GO",
           "name":"exoribonuclease activator activity"
        },
        {  
           "href":"/go/GO:0005096/overview",
           "category":"GO",
           "name":"GTPase activator activity"
        }
      ]
    };
    let action = receiveAutocompleteResponse(response.results);
    return dispatch(action);
  };
};

export function receiveAutocompleteResponse (_response) {
  return {
    type: 'AUTOCOMPLETE_RESPONSE',
    value: _response
  };
};
