/** @jsx React.DOM */
"use strict";

var React = require("react");

var searchForm = require("../components/blast/search_form.jsx");

var blastFungalView = {};
blastFungalView.render = function () {
	React.renderComponent(<searchForm blastType='fungal'/>, document.getElementById("j-main"));
};

module.exports = blastFungalView;
