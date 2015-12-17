import React, { Component } from 'react';
import { Route } from 'react-router';
import { ReduxRouter } from 'redux-router';
import { Provider } from 'react-redux';

// import store config and routes
const ConfigureStore = require('./store/configure_store.js');
const Routes = require('./routes.jsx');

const ReduxApplication = React.createClass({
	render() {
    // configure store, with history in redux state
    let store = ConfigureStore(true);

    return (
      <Provider store={store}>
        <ReduxRouter>
          {Routes}
        </ReduxRouter>
      </Provider>
    );
	}
});

module.exports = ReduxApplication;
