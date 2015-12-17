import { createHistory } from 'history';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routerStateReducer, reduxReactRouter } from 'redux-router';

// custom reducers
const ReadyStateReducer = require('../reducers/ready_state_reducer.js');
const SearchReducer = require('../reducers/search_reducer.js');

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (useRouterReducer) => {
  let reducerObj = {
    readyState: ReadyStateReducer,
    router: routerStateReducer,
    searchResults: SearchReducer
  };
  const reducer = combineReducers(reducerObj);

  let store;
  if (useRouterReducer) {
    store = compose(
      reduxReactRouter({ createHistory }),
      applyMiddleware(thunk)
    )(createStore)(reducer);
  } else {
    store = compose(
      applyMiddleware(thunk)
    )(createStore)(reducer);
  }
  return store;
};

module.exports = ConfigureStore;
