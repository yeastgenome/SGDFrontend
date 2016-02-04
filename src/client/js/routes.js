import React from 'react';
import { Route, IndexRoute } from 'react-router';

// import handler containers
import { requireAuthentication } from './containers/authenticate_component';
import Layout from './containers/layout';
import Account from './containers/account';
import Dashboard from './containers/dashboard';
import Index from './containers/index';
import ExampleContainer from './containers/example_container';
import Login from './containers/login';
import FilesIndex from './containers/files_index';
import NotFound from './containers/not_found';

module.exports = (
  <Route path='/' component={Layout}>
  	<IndexRoute component={Index} />
    <Route path='account' component={Account} />
    <Route path='login' component={Login} />
    <Route path='dashboard' component={requireAuthentication(Dashboard)}>
      <IndexRoute component={Index} />
      <Route path='files' component={FilesIndex} />
    </Route>
    <Route path='*' component={NotFound} />
  </Route>
);
