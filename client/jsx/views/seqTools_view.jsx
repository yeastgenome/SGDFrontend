
"use strict";

const React = require("react");
const SearchForm = require("../components/seqTools/search_form.jsx");

var seqToolsView = {};

seqToolsView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = seqToolsView;
