import React  from 'react';
import { IndexRoute, Route  } from 'react-router';

// unauthenticated routes and layout
import Layout from './containers/layout';
import PublicHome from './containers/publicHome';
import Help from './containers/help';
import Login from './containers/login';
// authenticated curate inputs
import { requireAuthentication } from './containers/authenticateComponent';
import CurateLayout from './containers/curateHome/layout';
import CurateHome from './containers/curateHome';
import Search from './containers/search';
import LocusShow from './containers/locus/show';
import TriageIndex from './containers/triage';
// curate lit biz
import CurateLit from './containers/curateLit/layout';
import CurateLitBasic from './containers/curateLit/litBasicInfo';
import CurateLitPhenotype from './containers/curateLit/phenotype';
import CurateLitOverview from './containers/curateLit/index';
import CurateLitActions from './containers/curateLit/actions';
// public interfaces with no layout
import AuthorResponse from './containers/authorResponse/index';
import SpreadsheetUpload from './containers/spreadsheetUpload/index';

// <Route component={requireAuthentication(SpreadsheetUpload)} path='spreadsheet_upload' />
export default (
  <Route component={Layout} path='/'>
    <IndexRoute component={PublicHome} />
    <Route component={Help} path='help' />
    <Route component={requireAuthentication(Search)} path='search' />
    <Route component={Login} path='login' />
    <Route component={CurateLayout} path='curate'>
      <IndexRoute component={requireAuthentication(CurateHome)} />
      <Route component={requireAuthentication(TriageIndex)} path='triage' />
      <Route component={requireAuthentication(SpreadsheetUpload)} path='spreadsheet_upload' />
    </Route>
    <Route component={requireAuthentication(LocusShow)} path='curate/locus/:id' />
    <Route component={requireAuthentication(CurateLit)} path='curate/reference/:id'>
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
