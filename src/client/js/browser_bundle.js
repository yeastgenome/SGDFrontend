import React from 'react';
import ReactDOM from 'react-dom';
import 'babel/polyfill'; // allow promise

import ReduxApplication from './redux_application';
// *** STARTS THE BROWSER APPLICATION ***
// ------------------*-------------------
ReactDOM.render(<ReduxApplication />, document.getElementById('j-application'));
