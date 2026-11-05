import React from 'react';
import { Route, Switch } from 'react-router';

// import handler containers
import Layout from './containers/layout.jsx';
import ColleaguesShow from './components/colleagues/colleagues_show.jsx';
import Search from './containers/search.jsx';
import StyleGuide from './components/style_guide/style_guide.jsx';
import Primer3 from './components/primer3/primer3.jsx';
import GeneListAnalysis from './components/gene_list/gene_list_analysis.jsx';

module.exports = (
  <Route
    render={() => (
      <Layout>
        <Switch>
          <Route path="/colleague/:formatName" component={ColleaguesShow} />
          <Route path="/search" component={Search} />
          <Route path="/style-guide" component={StyleGuide} />
          <Route path="/primer3" component={Primer3} />
          <Route path="/gene-list-analysis2" render={(props) => <GeneListAnalysis {...props} allSources />} />
          <Route path="/gene-list-analysis" component={GeneListAnalysis} />
        </Switch>
      </Layout>
    )}
    path="/"
  ></Route>
);
