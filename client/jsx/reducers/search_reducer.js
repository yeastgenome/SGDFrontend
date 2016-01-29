import _ from 'underscore';

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

const searchResultsReducer = function (_state, action) {
  let state = _.clone(_state);
  console.log(action.type)
  if (typeof state === 'undefined') {
    return DEFAULT_STATE;
  }
  // let the URL change the query and other params
  if (action.type === '@@reduxReactRouter/routerDidChange') {
    let params = action.payload.location.query;
    // set userInput and query from q
    let newQuery = (typeof params.q === 'string') ? params.q : '';
    state.query = newQuery;
    state.userInput = newQuery;
    // set currentPage from page
    let intPage = (typeof params.page === 'string' || typeof params.page === 'number') ? parseInt(params.page) : 0;
    state.currentPage = intPage;
    // set active aggs
    let formattedActiveAggs = (typeof params.categories === 'string') ? params.categories.split(',') : [];
    state.activeAggregations = formattedActiveAggs;

    return state;
  }
  if (action.type === 'START_SEARCH_FETCH') {
    state.isPending = true;
    return state;
  }
  if (action.type === 'SEARCH_RESPONSE') {
    state.total = action.response.total;
    state.results = action.response.results;
    state.totalPages = Math.floor(state.total / RESULTS_PER_PAGE) + ((state.total % RESULTS_PER_PAGE === 0) ? 0 : 1);
    state.aggregations = action.response.aggregations;
    state.isPending = false;
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
  if (action.type === 'SEARCH_API_ERROR') {
    state.apiError = action.value;
    return state
  }
  return state;
};

module.exports = searchResultsReducer;
