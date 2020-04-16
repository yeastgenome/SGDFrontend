'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

var SearchForm = require('../components/blast/search_form.jsx');

var blastFungalView = {};
blastFungalView.render = function () {
  ReactDOM.render(
    <SearchForm blastType="fungal" />,
    document.getElementById('j-main')
  );
};

module.exports = blastFungalView;
