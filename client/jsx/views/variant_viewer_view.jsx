/** @jsx React.DOM */
"use strict";

var React = require("react");
var AsyncVariantMap = require("../components/variant_map/async_variant_map.jsx");

var view = {};
view.render = function () {
	React.renderComponent(<AsyncVariantMap />, document.getElementById("j-main"))
};

module.exports = view;
