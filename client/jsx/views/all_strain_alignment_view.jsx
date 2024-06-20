'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/alignment/all_strain_alignment.jsx');

var AllStrainAlignmentView = {};

AllStrainAlignmentView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = AllStrainAlignmentView;
