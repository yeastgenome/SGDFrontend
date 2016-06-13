import React from 'react';
import { Route, IndexRoute } from 'react-router';

// import handler containers
import { requireAuthentication } from './containers/authenticate_component';
import Layout from './containers/layout';
import PublicIndex from './containers/public_index';
import ColleaguesIndex from './containers/colleagues/colleagues_index';
import ColleaguesEdit from './containers/colleagues/colleagues_edit';
import ColleaguesShow from './containers/colleagues/colleagues_show';
import Dashboard from './containers/dashboard';
import DashboardIndex from './containers/dashboard_index';
import ExampleContainer from './containers/example_container';
import Login from './containers/login';
import NewFile from './containers/files/new_file';
import NotFound from './containers/not_found';

export default (
  <Route path='/' component={Layout}>
  	<IndexRoute component={PublicIndex} />
    <Route path='login' component={Login} />
    <Route path='curate' component={requireAuthentication(Dashboard)}>
      <IndexRoute component={DashboardIndex} />
      <Route path='files'>
        <IndexRoute component={NewFile} />
        <Route path='new' component={NewFile} />
      </Route>
      <Route path='colleagues'>
        <IndexRoute component={ColleaguesIndex}/>
        <Route path='new' component={ColleaguesEdit} />
        <Route path=':colleagueLastName' component={ColleaguesShow} />
      </Route>
    </Route>
    <Route path='*' component={NotFound} />
  </Route>
);
