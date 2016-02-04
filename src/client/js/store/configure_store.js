import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routeReducer, syncHistory } from 'react-router-redux';

// custom reducers
import authReducer from '../reducers/auth_reducer';

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  let reducerObj = {
    auth: authReducer,
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
