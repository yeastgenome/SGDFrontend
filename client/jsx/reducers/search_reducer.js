import _ from 'underscore';
import { getCategoryDisplayName } from '../lib/search_helpers';

const FILTERED_FACET_VALUES = ['cellular component', 'biological process', 'molecular function'];
const DEFAULT_RESULTS_PER_PAGE = 25;
const WRAPPED_PAGE_SIZE = 500;
const DEFAULT_STATE = {
  userInput: '',
  results: [],
  activeCategory: null,
  aggregations: [],
  total: 0,
  currentPage: 0,
  totalPages: 0,
  resultsPerPage: DEFAULT_RESULTS_PER_PAGE,
  query: '',
  isPending: false,
  isPaginatePending: false, // if the only change is the page, note special state for rendering total
  apiError: null,
  isHydrated: false
};

const searchResultsReducer = function (_state, action) {
  let state = _.clone(_state);
  if (typeof state === 'undefined') {
    return DEFAULT_STATE;
  }
  // let the URL change the query and other params
  if (action.type === '@@router/UPDATE_LOCATION' && action.payload.pathname === '/search') {
    let params = action.payload.query;
    console.log('param for page size: ', params.page_size)
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
    // if wrapResults and on genes, allow large request size, otherwise look for param size, or just default
    let unwrappedPageSize = DEFAULT_RESULTS_PER_PAGE;
    state.resultsPerPage = (state.activeCategory === 'locus' && params.wrapResults === 'true') ?
      WRAPPED_PAGE_SIZE : unwrappedPageSize;
    return state;
  }
  switch (action.type) {
    case 'START_SEARCH_FETCH':
      state.isPending = true;
      return state;
      break;
    case 'SEARCH_RESPONSE':
      state.total = action.response.total;
      state.results = action.response.results.map( d => {
        d.categoryName = getCategoryDisplayName(d.category);
        return d;
      });
      state.aggregations = action.response.aggregations.map( d => {
        d.name = d.key;
        // filter out root terms from values
        d.values = d.values.filter( d => {
          return (FILTERED_FACET_VALUES.indexOf(d.key) < 0);
        });
        return d;
      });
      state.totalPages = Math.floor(state.total / state.resultsPerPage) + ((state.total % state.resultsPerPage === 0) ? 0 : 1);
      state.isPending = false;
      state.isAggPending = false;
      state.isPaginatePending = false;
      return state;
      break;
    case 'SET_USER_INPUT':
      state.userInput = action.value;
      return state;
      break;
    case 'SEARCH_API_ERROR':
      state.apiError = action.value;
      return state;
      break;
    case 'HYDRATE_SEARCH':
      state.isHydrated = true;
      return state;
      break; 
    default:
      return state;
  }
}

export default searchResultsReducer;
