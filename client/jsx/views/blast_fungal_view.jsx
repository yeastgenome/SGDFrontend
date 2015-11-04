
"use strict";

var React = require("react");

var SearchForm = require("../components/blast/search_form.jsx");

var blastFungalView = {};
blastFungalView.render = function () {
	React.render(<SearchForm blastType='fungal'/>, document.getElementById("j-main"));
};

module.exports = blastFungalView;
