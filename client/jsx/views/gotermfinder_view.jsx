
"use strict";

const React = require("react");
const SearchForm = require("../components/gotools/gotermfinder_form.jsx");

var goTermFinderView = {};

goTermFinderView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = goTermFinderView;
