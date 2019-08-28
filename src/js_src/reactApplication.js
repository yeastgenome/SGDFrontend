import React, { Component } from 'react';
import { createMemoryHistory } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createHashHistory } from 'history';

import configureStore from './lib/configureStore';
import routes from './routes';


class ReactApp extends Component {
  render() {
    let isBrowser = typeof window === 'object';
    let history = isBrowser ? createHashHistory() : createMemoryHistory('/');
    let store = configureStore(history);
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          {routes}
        </ConnectedRouter>
      </Provider>
    );
  }
}

export default ReactApp;
