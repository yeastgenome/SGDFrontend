/** @jsx React.DOM */
"use strict";

var React = require("react");

var searchForm = require("../components/blast/search_form.jsx");

var blastSgdView = {};
blastSgdView.render = function () {
	React.render(<searchForm blastType='sgd'/>, document.getElementById("j-main"));
};

module.exports = blastSgdView;
