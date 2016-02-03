import _ from 'underscore';
import getCategoryDisplayName from '../lib/get_category_display_name';

const SECONDARY_AGG_KEYS = ['qualifier'];

const RESULTS_PER_PAGE = 10;
const DEFAULT_STATE = {
  userInput: '',
  autocompleteResults: [],
  results: [],
  activeCategory: null,
  activeCategoryName: null,
  categoryAggs: [],
  secondaryAggs: [], // [{ key, name, values: [{ key, name, total }] }]
  activeSecondaryAggs: [], // [ { key, values: [key1, key2] }]
  wrapGeneResults: false,
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
    let intPage = (typeof params.page === 'string' || typeof params.page === 'number') ? parseInt(params.page) : 0;
    state.currentPage = intPage;
    // set active aggs
    let activeCat = (typeof params.category === 'string') ? params.category : null;
    state.activeCategory = activeCat;
    state.activeCategoryName = getCategoryDisplayName(activeCat);
    let newActiveSecondaryAggs = [];
    // parse through query params that aren't q or category to populate active secondary aggs
    let secondaryAggKeys = _.without(_.keys(params), 'q', 'category');
    secondaryAggKeys.forEach( key => {
      let localAggObj = {};
      if (typeof params[key] === 'string') {
        localAggObj[key] = [params[key]];
        newActiveSecondaryAggs.push(localAggObj);
      } else if (typeof params[key] === 'object') {
        localAggObj[key] = params[key];
        newActiveSecondaryAggs.push(localAggObj);
      }
    });
    state.activeSecondaryAggs = newActiveSecondaryAggs;
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
    if (typeof state.activeCategory === 'string') {
      state.secondaryAggs = action.response.aggregations;
    } else {
      state.categoryAggs = action.response.aggregations;
    }
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
  if (action.type === 'TOGGLE_GENE_WRAP') {
    state.wrapGeneResults = !state.wrapGeneResults;
    return state;
  }
  if (action.type === 'SEARCH_API_ERROR') {
    state.apiError = action.value;
    return state
  }
  return state;
};

module.exports = searchResultsReducer;
