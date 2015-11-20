const RESULTS_PER_PAGE = 10;
const DEFAULT_STATE = {
  userInput: '',
  autocompleteResults: [],
  results: [],
  aggregations: [],
  activeAggregations: [],
  selectedCategories: [],
  total: 0,
  currentPage: 0,
  totalPages: 0,
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
  if (action.type === 'UPDATE_PARAMS') {
    state.query = (typeof action.query === 'string') ? action.query : '';
    state.currentPage = action.currentPage;
    state.activeAggregations = action.categories;
    return state;
  }
  if (action.type === 'START_SEARCH_FETCH') {
    state.aggregations = [];
    state.isPending = true;
    return state;
  }
  if (action.type === 'SEARCH_RESPONSE') {
    state.total = action.response.total;
    state.results = action.response.results;
    state.totalPages = Math.floor(state.total / RESULTS_PER_PAGE) + ((state.total % RESULTS_PER_PAGE === 0) ? 0 : 1);
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
