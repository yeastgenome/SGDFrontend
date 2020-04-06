'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/patmatch/restrictionmapper.jsx');

var restMapperView = {};

restMapperView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = restMapperView;
