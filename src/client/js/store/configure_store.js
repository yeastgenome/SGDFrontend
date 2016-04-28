import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routerReducer, routerMiddleware, syncHistoryWithStore } from 'react-router-redux';

// custom reducers
import authReducer from '../reducers/auth_reducer';

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  let reducerObj = {
    auth: authReducer,
    routing: routerReducer,
  };
  const reducer = combineReducers(reducerObj);
  const _store = compose(
    applyMiddleware(thunk, routerMiddleware(history))
  )(createStore)(reducer, initialState);
  const _history = syncHistoryWithStore(history, _store);
  return {
    history: _history,
    store: _store
  };
};

module.exports = ConfigureStore;
