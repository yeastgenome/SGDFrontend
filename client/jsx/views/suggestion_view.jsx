/** @jsx React.DOM */
"use strict";

var React = require("react");

var SuggestionForm = React.createFactory(require("../components/suggestion/suggestion_form.jsx"));

var suggestionView = {};
suggestionView.render = function () {
	React.renderComponent(<SuggestionForm />, document.getElementById("j-main"));
};

module.exports = suggestionView;
