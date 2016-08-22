import React, { Component } from 'react';
import { Router } from 'react-router';
import { Provider } from 'react-redux';

// import routes
import Routes from './routes.jsx';

const ReduxApplication = React.createClass({
  propTypes: {
    history: React.PropTypes.object.isRequired,
    store: React.PropTypes.object.isRequired
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

module.exports = ReduxApplication;
