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
import Blank from './components/blank';
import Tags from './containers/curateLit/tags';
import CurateLit from './containers/curateLit/layout';
import CurateLitPhenotype from './containers/curateLit/phenotype';
// import CurateLitOverview from './containers/curateLit/index';
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
      <IndexRoute component={requireAuthentication(Blank)} />
      <Route component={requireAuthentication(Tags)} path='tags' />
      <Route component={requireAuthentication(Blank)} path='protein' />
      <Route component={requireAuthentication(CurateLitPhenotype)} path='phenotypes' />
      <Route component={requireAuthentication(Blank)} path='go' />
      <Route component={requireAuthentication(Blank)} path='datasets' />
      <Route component={requireAuthentication(Blank)} path='regulation' />
      <Route component={requireAuthentication(Blank)} path='interaction' />
    </Route>
    <Route component={requireAuthentication(AuthorResponse)} path='author_response' />
  </Route>
);
