
"use strict";

const React = require("react");
const SearchForm = require("../components/alignment/strain_alignment.jsx");

var strainAlignmentView = {};

strainAlignmentView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = strainAlignmentView;
