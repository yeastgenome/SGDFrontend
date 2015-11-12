import React, { Component } from 'react';
import { Route, Link } from 'react-router';
import createHistory from 'history/lib/createBrowserHistory';
import { ReduxRouter, routerStateReducer, reduxReactRouter } from 'redux-router';
import { Provider, connect } from 'react-redux';

// import store config
const ConfigureStore = require('./store/configure_store.js');
// import handler containers
const Layout = require('./containers/layout.jsx');
const Search = require('./containers/search.jsx');

const ReduxApplication = React.createClass({
	render() {
    // configure store
    let store = ConfigureStore();

    return (
      <Provider store={store}>
        <ReduxRouter>
          <Route path="/" component={Layout}>
            <Route path="search" component={Search} />
          </Route>
        </ReduxRouter>
      </Provider>
    );
	}
});

module.exports = ReduxApplication;
