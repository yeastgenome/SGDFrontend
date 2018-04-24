
"use strict";

const React = require("react");
const SearchForm = require("../components/patmatch/search_form.jsx");

var patmatchView = {};

patmatchView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = patmatchView;
