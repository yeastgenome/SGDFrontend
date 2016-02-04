import React, { Component } from 'react';
import { Router, Route } from 'react-router';
import { Provider } from 'react-redux';
import { createHashHistory, useQueries } from 'history'

// import store config and routes
import ConfigureStore from './store/configure_store';
import Routes from './routes';

const ReduxApplication = React.createClass({
  render() {
    // configure store, with history in redux state
    let history = useQueries(createHashHistory)();
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
