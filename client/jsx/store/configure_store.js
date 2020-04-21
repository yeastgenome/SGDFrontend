import { createStore, compose, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import { routerReducer, syncHistory } from "react-router-redux";
import reduxPromise from "redux-promise";
import searchReducer from "../reducers/search_reducer.js";

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  const devTools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  let addDevTools = (process.env.NODE_ENV === 'dev' || 'development') ? devTools : {};

  const reducerObj = {
    searchResults: searchReducer,
    routing: routerReducer
  };
  const reducer = combineReducers(reducerObj);

  const store = compose(
    applyMiddleware(reduxPromise),
    applyMiddleware(thunk),
    // applyMiddleware(syncHistory(history))
  )(createStore)(reducer, initialState, addDevTools);
  return store;
};

export default ConfigureStore;
