import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { routeReducer, syncHistory } from 'react-router-redux';

// custom reducers
import searchReducer from '../reducers/search_reducer.js';

// add history to reducer and thunk to dispatch functions as actions
const ConfigureStore = (initialState, history) => {
  const reducerObj = {
    searchResults: searchReducer,
    routing: routeReducer,
  };
  const reducer = combineReducers(reducerObj);
  if (process.env.NODE_ENV == 'development'){
    //redux debugging
    const store = compose(applyMiddleware(thunk), applyMiddleware(syncHistory(history)))(createStore)(reducer, initialState, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
    return store;
  }
  else{
    const store = compose(applyMiddleware(thunk), applyMiddleware(syncHistory(history)))(createStore)(reducer, initialState);
    return store;
  }
  
};

export default ConfigureStore;
