// import { createStore, compose, applyMiddleware, combineReducers } from "redux";
// import thunk from "redux-thunk";
// import { routeReducer, syncHistory } from "react-router-redux";
// import reduxPromise from "redux-promise";
// import searchReducer from "../reducers/search_reducer.js";

// // add history to reducer and thunk to dispatch functions as actions
// const ConfigureStore = (initialState, history) => {
//   const devTools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
//   let addDevTools = (process.env.NODE_ENV === 'dev' || 'development') ? devTools : {};

//   const reducerObj = {
//     searchResults: searchReducer,
//     routing: routeReducer
//   };
//   const reducer = combineReducers(reducerObj);

//   const store = compose(
//     applyMiddleware(reduxPromise),
//     applyMiddleware(thunk),
//     applyMiddleware(syncHistory(history))
//   )(createStore)(reducer, initialState, addDevTools);
//   return store;
// };

// export default ConfigureStore;


import { createStore, compose, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import { routerReducer, routerMiddleware } from "react-router-redux";
import reduxPromise from "redux-promise";
import searchReducer from "../reducers/search_reducer.js";
import { composeWithDevTools } from 'redux-devtools-extension'

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  let composer = (process.env.NODE_ENV === 'dev' || 'development') ? composeWithDevTools : compose;
  
  const reducerObj = {
    searchResults: searchReducer,
    routing: routerReducer
  };
  
  const reducer = combineReducers(reducerObj);
  const middlewares = [reduxPromise,thunk,routerMiddleware(history)]
  const middlewareEnhancer = applyMiddleware(...middlewares)
  const enhancers = [middlewareEnhancer]
  const composedEnhancers = composer(...enhancers);

// createStore()
  const store = createStore(reducer,initialState,composedEnhancers);
  return store
};

export default ConfigureStore;
