import React  from 'react';
import { IndexRoute, Route  } from 'react-router';

// public routes and layout
import Layout from './containers/layout';
import PublicHome from './containers/publicHome';
import Login from './containers/login';
// authenticated curate inputs
import { requireAuthentication } from './containers/authenticateComponent';
import CurateHome from './containers/curateHome';
import Batch from './containers/batch';
import Search from './containers/search';
import LocusShow from './containers/locus/show';
import RefShow from './containers/reference/show';
import LitIndex from './containers/literature';
import CurateLit from './containers/curateLit/layout';
// TEMP
import CurateLitBasic from './containers/triageLit/litBasicInfo';
// import CurateLitBasic from './containers/curateLit/basic';

import CurateLitPhenotype from './containers/curateLit/phenotype';
import CurateLitOverview from './containers/curateLit/index';
import CurateLitActions from './containers/curateLit/actions';
import TriageLit from './containers/triageLit/index';


export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={PublicHome} />
    <Route component={requireAuthentication(Search)} path='search' />
    <Route component={Login} path='login' />
    <Route component={requireAuthentication(CurateHome)} path='curate' />
    <Route component={requireAuthentication(Batch)} path='batch' />
    <Route component={requireAuthentication(LocusShow)} path='locus/:id/overview' />
    <Route component={requireAuthentication(RefShow)} path='reference/:id/overview' />
    <Route component={requireAuthentication(LitIndex)} path='literature' />
    <Route component={requireAuthentication(LitIndex)} path='triage_literature' />
    <Route component={requireAuthentication(CurateLit)} path='curate_literature/:id'>
      <IndexRoute component={requireAuthentication(CurateLitBasic)} />
      <Route component={requireAuthentication(CurateLitOverview)} path='loci' />
      <Route component={requireAuthentication(CurateLitOverview)} path='protein' />
      <Route component={requireAuthentication(CurateLitPhenotype)} path='phenotypes' />
      <Route component={requireAuthentication(CurateLitOverview)} path='go' />
      <Route component={requireAuthentication(CurateLitOverview)} path='datasets' />
      <Route component={requireAuthentication(CurateLitOverview)} path='regulation' />
      <Route component={requireAuthentication(CurateLitOverview)} path='interaction' />
      <Route component={requireAuthentication(CurateLitActions)} path='actions' />
    </Route>
    <Route component={requireAuthentication(TriageLit)} path='triage_literature/:id' />
  </Route>
);
