import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routeReducer, syncHistory } from 'react-router-redux';

// custom reducers
const ReadyStateReducer = require('../reducers/ready_state_reducer.js');
const searchReducer = require('../reducers/search_reducer.js');

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  let reducerObj = {
    searchResults: searchReducer,
    routing: routeReducer,
  };
  const reducer = combineReducers(reducerObj);

  let store = compose(
    applyMiddleware(thunk),
    applyMiddleware(syncHistory(history))
  )(createStore)(reducer, initialState);
  return store;
};

module.exports = ConfigureStore;
