import React, { Component } from 'react';
import { Router, Route } from 'react-router';
import { Provider } from 'react-redux';
import { createHashHistory, useQueries } from 'history'

// import store config and routes
import ConfigureStore from './store/configure_store';
import Routes from './routes';

const ReduxApplication = React.createClass({
  propTypes: {
    history: React.PropTypes.object.isRequired,
    store: React.PropTypes.object.isRequired,
  },

  render() {
    return (
      <Provider store={this.props.store}>
        <Router history={this.props.history}>
          {Routes}
        </Router>
      </Provider>
    );
  }
});

export default ReduxApplication;
