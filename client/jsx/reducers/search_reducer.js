import _ from 'underscore';
import { getCategoryDisplayName } from '../lib/search_helpers';

const DEFAULT_RESULTS_PER_PAGE = 10;
const LARGER_RESULTS_PER_PAGE = 220;
const DEFAULT_STATE = {
  userInput: '',
  autocompleteResults: [],
  results: [],
  activeCategory: null,
  activeCategoryName: null,
  aggregations: [],
  total: 0,
  currentPage: 0,
  totalPages: 0,
  resultsPerPage: DEFAULT_RESULTS_PER_PAGE,
  query: '',
  autoCompleteQuery: '',
  isPending: false,
  isPaginatePending: false, // if the only change is the page, note special state for rendering total
  apiError: null
};

const searchResultsReducer = function (_state, action) {
  let state = _.clone(_state);
  if (typeof state === 'undefined') {
    return DEFAULT_STATE;
  }
  // let the URL change the query and other params
  if (action.type === '@@router/UPDATE_LOCATION' && action.payload.pathname === '/search') {
    let params = action.payload.query;
    // set userInput and query from q
    let newQuery = (typeof params.q === 'string') ? params.q : '';
    state.query = newQuery;
    state.userInput = newQuery;
    // set currentPage from page
    let newPage = (typeof params.page === 'string' || typeof params.page === 'number') ? parseInt(params.page) : 0;
    // set paginate pending if page is changing
    if (newPage !== state.currentPage) state.isPaginatePending = true;
    state.currentPage = newPage;
    // set active aggs
    let activeCat = (typeof params.category === 'string') ? params.category : null;
    // if changing cat, set isAggPending to true before setting active cat
    if (state.activeCategory !== activeCat) state.isAggPending = true;
    state.activeCategory = activeCat;
    state.activeCategoryName = getCategoryDisplayName(activeCat);
    // if wrapResults and on genes, allow large request size
    state.resultsPerPage = (state.activeCategory === 'locus' && params.wrapResults === 'true') ?
      LARGER_RESULTS_PER_PAGE : DEFAULT_RESULTS_PER_PAGE;
    return state;
  }
  if (action.type === 'START_SEARCH_FETCH') {
    state.isPending = true;
    return state;
  }
  if (action.type === 'SEARCH_RESPONSE') {
    state.total = action.response.total;
    state.results = action.response.results;
    state.totalPages = Math.floor(state.total / state.resultsPerPage) + ((state.total % state.resultsPerPage === 0) ? 0 : 1);
    state.aggregations = action.response.aggregations;
    state.isPending = false;
    state.isAggPending = false;
    state.isPaginatePending = false;
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

export default searchResultsReducer;
