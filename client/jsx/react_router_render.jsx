import React from 'react';
import ReactDOM from 'react-dom';
import { createHistory, useQueries } from 'history';

import ConfigureStore from './store/configure_store.js';
import ReduxApplication from './redux_application.jsx';
import { syncHistoryWithStore } from 'react-router-redux';

// *** STARTS THE BROWSER REACT-ROUTER APPLICATION ***
// ------------------*-------------------
var reactRouterRender = {};
reactRouterRender.render = function () {
  // configure redux store
  let _history = useQueries(createHistory)();
  let _store = ConfigureStore(undefined, _history);
  let _syncedHistory = syncHistoryWithStore(_history, _store);
  ReactDOM.render(
    <ReduxApplication history={_syncedHistory} store={_store} />,
    document.getElementById('j-application-target')
  );
};

module.exports = reactRouterRender;
