import { createStore, compose, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import { routeReducer, syncHistory } from "react-router-redux";
import reduxPromise from "redux-promise";

// custom reducers
import searchReducer from "../reducers/search_reducer.js";
import downloadsReducer from "../reducers/downloads_reducer.js";

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  const reducerObj = {
    searchResults: searchReducer,
    downloads: downloadsReducer,
    routing: routeReducer
  };
  const reducer = combineReducers(reducerObj);

  const store = compose(
    applyMiddleware(reduxPromise),
    applyMiddleware(thunk),
    applyMiddleware(syncHistory(history))
  )(createStore)(reducer, initialState);
  return store;
};

export default ConfigureStore;
