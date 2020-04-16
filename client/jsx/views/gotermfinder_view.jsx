'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/gotools/gotermfinder_form.jsx');

var goTermFinderView = {};

goTermFinderView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = goTermFinderView;
