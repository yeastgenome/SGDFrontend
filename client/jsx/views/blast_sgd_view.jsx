
"use strict";

var React = require("react");

var SearchForm = require("../components/blast/search_form.jsx");

var blastSgdView = {};
blastSgdView.render = function () {
	React.render(<SearchForm blastType='sgd'/>, document.getElementById("j-main"));
};

module.exports = blastSgdView;
