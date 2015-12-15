import React from 'react';
import { Route } from 'react-router';

// import handler containers
const Layout = require('./containers/layout.jsx');
const Search = require('./containers/search.jsx');

module.exports = (
  <Route path="/" component={Layout}>
    <Route path="search" component={Search} />
  </Route>
)

