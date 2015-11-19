const RESULTS_PER_PAGE = 10;
const DEFAULT_STATE = {
  userInput: '',
  autocompleteResults: [],
  results: [],
  aggregations: [],
  selectedCategories: [],
  total: 0,
  currentPage: 0,
  resultsPerPage: RESULTS_PER_PAGE,
  query: '',
  autoCompleteQuery: '',
  isPending: false,
  apiError: null
};

const searchResultsReducer = function (state, action) {
  console.log(action.type)
  if (typeof state === 'undefined') {
    return DEFAULT_STATE;
  }
  if (action.type === 'START_SEARCH_FETCH') {
    state.query = action.query;
    state.aggregations = [];
    state.isPending = true;
    state.currentPage = 0;
    return state;
  }
  if (action.type === 'SEARCH_RESPONSE') {
    state.total = action.response.total;
    state.results = action.response.results;
    state.aggregations = replaceAggs(state.aggregations, action.response.aggregations);
    state.isPending = false;
    return state;
  }
  // let the URL change the query
  if (action.type === '@@reduxReactRouter/routerDidChange') {
    state.query = action.payload.location.query.q;
    state.userInput = action.payload.location.query.q;
    return state;
  }
  if (action.type === 'TOGGLE_AGG') {
    state.currentPage = 0;
    state.isPending = true;
    state.aggregations = state.aggregations.map( d => {
      if (d.key === action.key) d.isActive = !d.isActive;
      return d;
    });
    return state;
  }
  if (action.type === 'PAGINATE') {
    state.currentPage = action.number;
    // maybe load while fetching next page
    let desiredResultsNum = Math.min(state.total, (state.currentPage + 1) * state.resultsPerPage);
    if (desiredResultsNum > state.results.length) state.isPending = true;
    return state;
  }
  if (action.type === 'EXTRA_SEARCH_RESPONSE') {
    state.isPending = false;
    state.results = state.results.concat(action.response.results);
    return state;
  }
  if (action.type === 'SET_USER_INPUT') {
    state.userInput = action.value;
    return state;
  }
  if (action.type === 'AUTOCOMPLETE_RESPONSE') {
    state.autocompleteResults = action.value;
    return state;
  }
  return state;
};

// Format from response, replace the nubers, but not the active state, sort by total.  Only have the entries in newAggs
const replaceAggs = function (oldAggs, newAggs) {
  if (oldAggs.length !== newAggs.length) return newAggs;
  return oldAggs;
};

module.exports = searchResultsReducer;
