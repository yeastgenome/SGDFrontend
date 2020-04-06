'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const SearchForm = require('../components/gotools/goslimmapper_form.jsx');

var goSlimMapperView = {};

goSlimMapperView.render = function () {
  ReactDOM.render(<SearchForm />, document.getElementById('j-main'));
};

module.exports = goSlimMapperView;
