'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/seqtools/search_form.jsx');

var seqToolsView = {};

seqToolsView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = seqToolsView;
