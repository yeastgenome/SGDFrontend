import React  from 'react';
import { IndexRoute, Route  } from 'react-router';

import { requireAuthentication } from './containers/authenticateComponent';
import Layout from './containers/layout';
import PublicHome from './containers/publicHome';
import CurateHome from './containers/curateHome';
import Batch from './containers/batch';
import Search from './containers/search';
import Login from './containers/login';

import LocusShow from './containers/locus/show';
import RefShow from './containers/reference/show';

export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={PublicHome} />
    <Route component={requireAuthentication(Search)} path='search' />
    <Route component={Login} path='login' />
    <Route component={requireAuthentication(CurateHome)} path='curate' />
    <Route component={requireAuthentication(Batch)} path='batch' />
    <Route component={requireAuthentication(LocusShow)} path='locus/:id/overview' />
    <Route component={requireAuthentication(RefShow)} path='reference/:id/overview' />
  </Route>
);
