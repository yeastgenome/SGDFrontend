import 'babel/polyfill'; // allow promise
import React from 'react';
import ReactDOM from 'react-dom';
import { hashHistory } from 'react-router';

import ConfigureStore from './store/configure_store';
import ReduxApplication from './redux_application';
import { setCSRFToken } from './actions/auth_actions';

// *** STARTS THE BROWSER APPLICATION ***
// ------------------*-------------------
// init store
let storeObj = ConfigureStore(undefined, hashHistory);
// send the CSRF token from the script tag to the store
if (window) {
  let tokenAction = setCSRFToken(window.CSRF_TOKEN);
  storeObj.store.dispatch(tokenAction);
}
// pass store and history to appp, which is all contained to a react component
ReactDOM.render(<ReduxApplication history={storeObj.history} store={storeObj.store} />, document.getElementById('j-application'));
