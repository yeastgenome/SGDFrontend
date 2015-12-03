
"use strict";

var React = require("react");

var SuggestionForm = require("../components/suggestion/suggestion_form.jsx");

var suggestionView = {};
suggestionView.render = function () {
	React.render(<SuggestionForm />, document.getElementById("j-main"));
};

module.exports = suggestionView;
