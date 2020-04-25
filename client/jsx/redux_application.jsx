import React, { Component } from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';

// import routes
import Routes from './routes.jsx';
import PropTypes from 'prop-types';

class ReduxApplication extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Provider store={this.props.store}>
        <ConnectedRouter history={this.props.history}>{Routes}</ConnectedRouter>
      </Provider>
    );
  }
}

ReduxApplication.propTypes = {
  history: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired,
};

module.exports = ReduxApplication;
