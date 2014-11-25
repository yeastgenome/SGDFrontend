/** @jsx React.DOM */
"use strict";

var React = require("react");
var AsyncVariantMap = require("../components/variant_map/async_variant_map.jsx");

var variantMapView = {};
variantMapView.render = function () {
	React.renderComponent(<AsyncVariantMap />, document.getElementById("j-main"))
};

module.exports = variantMapView;
