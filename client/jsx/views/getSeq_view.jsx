"use strict";

const React = require("react");
const SearchForm = require("../components/seqtools/seq_display.jsx");

var getSeqView = {};

getSeqView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = getSeqView;
