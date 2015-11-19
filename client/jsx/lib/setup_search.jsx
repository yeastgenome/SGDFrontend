import React from 'react';
import ReactDOM from 'react-dom';
const AppSearchBar = require('../containers/app_search_bar.jsx');
const ConfigureStore = require('../store/configure_store.js');

const SetupSearch = function () {
  let store = ConfigureStore();
  ReactDOM.render(<AppSearchBar store={store} />, document.getElementById('j-search-container'));
};

module.exports = SetupSearch;
