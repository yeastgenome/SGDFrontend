import React from 'react';
import { IndexRoute, Route  } from 'react-router';

import Home from './containers/home';
import Layout from './containers/layout';

export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={Home} />
  </Route>
);
