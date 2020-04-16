'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

var SearchForm = require('../components/blast/search_form.jsx');

var blastSgdView = {};
blastSgdView.render = function () {
  ReactDOM.render(
    <SearchForm blastType="sgd" />,
    document.getElementById('j-main')
  );
};

module.exports = blastSgdView;
