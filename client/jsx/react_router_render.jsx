import React from 'react';
import ReactDOM from 'react-dom';
import { createHistory, useQueries } from 'history'

import ConfigureStore from './store/configure_store.js';
import ReduxApplication from './redux_application.jsx';

// *** STARTS THE BROWSER REACT-ROUTER APPLICATION ***
// ------------------*-------------------
var reactRouterRender = {};
reactRouterRender.render = function () {
  // configure redux store
  let _history = useQueries(createHistory)();
  let _store = ConfigureStore(undefined, _history);
  ReactDOM.render(<ReduxApplication history={_history} store={_store} />, document.getElementById('j-application-target'));
}

module.exports = reactRouterRender;
