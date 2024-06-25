'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/alignment/all_strain_alignment.jsx');

var allStrainAlignmentView = {};

allStrainAlignmentView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = allStrainAlignmentView;
