import React from 'react';
import { Route } from 'react-router';

// import handler containers
import Layout from './containers/layout.jsx';
import Search from './containers/search.jsx';
import ExampleContainer from './containers/example_container.jsx';
import NotFound from './containers/not_found.jsx';

module.exports = (
  <Route path="/" component={Layout}>
    <Route path="search" component={Search} />
    <Route path="*" component={NotFound}/>
  </Route>
);
