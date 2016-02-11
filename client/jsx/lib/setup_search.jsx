import React from 'react';
import ReactDOM from 'react-dom';
import AppSearchBar from '../containers/app_search_bar.jsx';
import ConfigureStore from '../store/configure_store.js';
import { createHistory, useQueries } from 'history'

const SetupSearch = function () {
  // configure store, with history in redux state
  let history = useQueries(createHistory)();
  let store = ConfigureStore(undefined, history);
  ReactDOM.render(<AppSearchBar store={store} />, document.getElementById('j-search-container'));
};

module.exports = SetupSearch;
