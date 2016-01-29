import React, { Component } from 'react';
import { Router } from 'react-router';
import { Provider } from 'react-redux';
import { createHistory, useQueries } from 'history'

// import store config and routes
const ConfigureStore = require('./store/configure_store.js');
const Routes = require('./routes.jsx');

const ReduxApplication = React.createClass({
	render() {
    // configure store, with history in redux state
    let history = useQueries(createHistory)();
    let store = ConfigureStore(undefined, history);

    return (
      <Provider store={store}>
        <Router history={history}>
          {Routes}
        </Router>
      </Provider>
    );
	}
});

module.exports = ReduxApplication;
