import { createHistory, createLocation } from 'history';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routerStateReducer, reduxReactRouter } from 'redux-router';

const SearchReducer = require('../reducers/search_reducer.js');

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = () => {
  const reducer = combineReducers({
    searchResults: SearchReducer,
    router: routerStateReducer
  });

  const store = compose(
    reduxReactRouter({ createHistory }),
    applyMiddleware(thunk)
  )(createStore)(reducer);
  return store;
};

module.exports = ConfigureStore;
