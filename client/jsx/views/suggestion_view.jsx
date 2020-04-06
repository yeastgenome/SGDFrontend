'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

var SuggestionForm = require('../components/suggestion/suggestion_form.jsx');

var suggestionView = {};
suggestionView.render = function () {
  ReactDOM.render(<SuggestionForm />, document.getElementById('j-main'));
};

module.exports = suggestionView;
