import React from 'react';
import ReactDOM from 'react-dom';
import 'babel/polyfill'; // allow promise

import ReduxApplication from './redux_application.jsx';
// *** STARTS THE BROWSER APPLICATION ***
// ------------------*-------------------
var bundledView = {};
bundledView.render = function () {
  ReactDOM.render(<ReduxApplication />, document.getElementById("j-application"));
}

module.exports = bundledView;
