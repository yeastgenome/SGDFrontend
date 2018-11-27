
"use strict";

const React = require("react");
const SearchForm = require("../components/patmatch/restrictionmapper.jsx");

var restMapperView = {};

restMapperView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = restMapperView;
