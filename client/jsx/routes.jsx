import React from 'react';
import { Route } from 'react-router';

// import handler containers
import Layout from './containers/layout.jsx';
import ColleaguesShow from './components/colleagues/colleagues_show.jsx';
import Search from './containers/search.jsx';
import StyleGuide from './components/style_guide/style_guide.jsx';
import Primer3 from './components/primer3/primer3.jsx';
import Primer3Seq from './components/primer3seq/primer3seq.jsx';
import ExampleContainer from './containers/example_container.jsx';

module.exports = (
  <Route path="/" component={Layout}>
  	<Route path='colleague/:formatName' component={ColleaguesShow} />
    <Route path="search" component={Search} />
    <Route path="style-guide" component={StyleGuide} />
    <Route path="primer3" component={Primer3} />
    <Route path="primer3seq" component={Primer3Seq} />
  </Route>
);
