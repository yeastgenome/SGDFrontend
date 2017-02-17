import React  from 'react';
import { IndexRoute, Route  } from 'react-router';

// public routes and layout
import Layout from './containers/layout';
import PublicHome from './containers/publicHome';
import Login from './containers/login';
// authenticated curate inputs
import { requireAuthentication } from './containers/authenticateComponent';
import CurateLayout from './containers/curateHome/layout';
import CurateHome from './containers/curateHome';
import Search from './containers/search';
import LocusShow from './containers/locus/show';
import RefShow from './containers/reference/show';
import TriageIndex from './containers/triage';
import CurateLit from './containers/curateLit/layout';
// TEMP
import CurateLitBasic from './containers/triageLit/litBasicInfo';
// import CurateLitBasic from './containers/curateLit/basic';

import CurateLitPhenotype from './containers/curateLit/phenotype';
import CurateLitOverview from './containers/curateLit/index';
import CurateLitActions from './containers/curateLit/actions';
import TriageLit from './containers/triageLit/index';
import AuthorResponse from './containers/authorResponse/index';
import SpreadsheetUpload from './containers/spreadsheetUpload/index';

// <Route component={requireAuthentication(SpreadsheetUpload)} path='spreadsheet_upload' />
export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={PublicHome} />
    <Route component={requireAuthentication(Search)} path='search' />
    <Route component={Login} path='login' />
    <Route component={CurateLayout} path='curate'>
      <IndexRoute component={requireAuthentication(CurateHome)} />
      <Route component={requireAuthentication(TriageIndex)} path='triage' />
      <Route component={requireAuthentication(SpreadsheetUpload)} path='spreadsheet_upload' />
    </Route>
    <Route component={requireAuthentication(TriageLit)} path='triage_literature/:id' />
    <Route component={requireAuthentication(LocusShow)} path='locus/:id/overview' />
    <Route component={requireAuthentication(RefShow)} path='reference/:id/overview' />
    <Route component={requireAuthentication(CurateLit)} path='annotate/reference/:id'>
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
    <Route component={requireAuthentication(AuthorResponse)} path='author_response' />
  </Route>
);
