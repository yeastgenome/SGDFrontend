'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/alignment/strain_alignment.jsx');

var strainAlignmentView = {};

strainAlignmentView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = strainAlignmentView;
