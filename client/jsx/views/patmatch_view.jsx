'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/patmatch/search_form.jsx');

var patmatchView = {};

patmatchView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = patmatchView;
