import React from 'react';
import ReactDOM from 'react-dom';
import AppSearchBar from '../containers/app_search_bar.jsx';
import ConfigureStore from '../store/configure_store.js';
import { createBrowserHistory } from 'history';

const SEARCH_EL_ID = 'j-search-container';

const SetupSearch = function () {
  // configure store, with history in redux state
  let history = createBrowserHistory();
  let store = ConfigureStore(undefined, history);
  ReactDOM.render(
    <AppSearchBar store={store} />,
    document.getElementById(SEARCH_EL_ID)
  );
};

module.exports = SetupSearch;
