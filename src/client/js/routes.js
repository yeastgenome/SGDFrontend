import React from 'react';
import { Route, IndexRoute } from 'react-router';

// import handler containers
import { requireAuthentication } from './containers/authenticate_component';
import Layout from './containers/layout';
import Account from './containers/account';
import Dashboard from './containers/dashboard';
import DashboardIndex from './containers/dashboard_index';
import ExampleContainer from './containers/example_container';
import Login from './containers/login';
import FilesIndex from './containers/files/files_index';
import NewFile from './containers/files/new_file';
import NotFound from './containers/not_found';

export default (
  <Route path='/' component={Layout}>
  	<IndexRoute component={Login} />
    <Route path='account' component={Account} />
    <Route path='login' component={Login} />
    <Route path='dashboard' component={requireAuthentication(Dashboard)}>
      <IndexRoute component={DashboardIndex} />
      <Route path='files'>
        <IndexRoute component={FilesIndex} />
        <Route path='new' component={NewFile} />
      </Route>
    </Route>
    <Route path='*' component={NotFound} />
  </Route>
);
