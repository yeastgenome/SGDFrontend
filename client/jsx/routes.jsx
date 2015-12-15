import React from 'react';
import { Route } from 'react-router';

// import handler containers
const Layout = require('./containers/layout.jsx');
const Search = require('./containers/search.jsx');

const ExampleContainer = require("./containers/example_container.jsx");
const NotFound = require("./containers/not_found.jsx");

module.exports = (
  <Route path="/" component={Layout}>
    <Route path="search" component={Search} />
    <Route path="variant-viewer" component={ExampleContainer} />
    <Route path="*" component={NotFound}/>
  </Route>
);
