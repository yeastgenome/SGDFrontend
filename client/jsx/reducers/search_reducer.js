import _ from 'underscore';
import { getCategoryDisplayName } from '../lib/search_helpers';

const FILTERED_FACET_VALUES = ['cellular component', 'biological process', 'molecular function'];
const DEFAULT_RESULTS_PER_PAGE = 25;
const DEFAULT_SORT_BY = 'relevance';
const DEFAULT_GENE_MODE = 'list';
const DEFAULT_STATE = {
  userInput: '',
  results: [],
  asyncResults: [],
  activeCategory: null,
  aggregations: [],
  total: 0,
  currentPage: 0,
  totalPages: 0,
  resultsPerPage: DEFAULT_RESULTS_PER_PAGE,
  query: '',
  isPending: false,
  isAsyncPending: false,
  asyncProgress: 0.00,
  isPaginatePending: false, // if the only change is the page, note special state for rendering total
  apiError: null,
  isHydrated: false,
  sortBy: DEFAULT_SORT_BY,
  geneMode: DEFAULT_GENE_MODE
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
    state.resultsPerPage = params.page_size || DEFAULT_RESULTS_PER_PAGE;
    // set sortBy
    state.sortBy = params.sort_by || DEFAULT_SORT_BY;
    state.geneMode = params.geneMode || DEFAULT_GENE_MODE;
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
        // make list of loci from 3 possible types
        if (d.go_loci) {
          d.loci = d.go_loci;
        } else if (d.phenotype_loci) {
          d.loci = d.phenotype_loci;
        } else if (d.reference_loci) {
          d.loci = d.reference_loci;
        } else {
          d.loci = null;
        }
        return d;
      });
      state.aggregations = action.response.aggregations.map( d => {
        d.name = d.key;
        // filter out root terms from values
        d.values = d.values.filter( d => {
          return (FILTERED_FACET_VALUES.indexOf(d.key) < 0);
        });
        // sort to try to put relevant (mathces query) facet value on top
        if (state.query !== '') {
          // escape regex special characters http://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
          let regexQuery = state.query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          d.values = d.values.sort( (a, b) => {
            let aMatch = a.key.toLowerCase().match(regexQuery);
            let bMatch = b.key.toLowerCase().match(regexQuery);
            let totalIndex = (a.total > b.total) ? -1 : 1;
            if (aMatch && bMatch) {
              return totalIndex;
            } else if (aMatch) {
              return -1;
            } else if (bMatch) {
              return 1;
            } else {
              return totalIndex;
            }
          });
        }
        return d;
      });
      state.totalPages = Math.floor(state.total / state.resultsPerPage) + ((state.total % state.resultsPerPage === 0) ? 0 : 1);
      state.isPending = false;
      state.isAggPending = false;
      state.isPaginatePending = false;
      return state;
      break;

    case 'START_ASYNC_FETCH':
      state.asyncResults = [];
      state.isAsyncPending = true;
      state.asyncProgress = 0.00;
      return state;
      break;
    case 'ASYNC_SEARCH_RESPONSE':
      state.asyncResults = action.results.map( d => {
        d.categoryName = getCategoryDisplayName(d.category);
        return d;
      });
      state.asyncProgress = state.asyncResults.length / state.total;
      return state;
      break;
    case 'FINISH_ASYNC':
      state.isAsyncPending = false;
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
