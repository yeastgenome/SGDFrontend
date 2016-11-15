import React from 'react';
import { IndexRoute, Route  } from 'react-router';

import { requireAuthentication } from './containers/authenticateComponent';
import Layout from './containers/layout';
import Home from './containers/home';
import Login from './containers/login';

export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={requireAuthentication(Home)} />
    <Route component={Login} path='login' />
  </Route>
);
