/** @jsx React.DOM */
"use strict";

var React = require("react");
var AsyncVariantMap = React.createFactory(require("../components/variant_map/async_variant_map.jsx"));
var LocalStorageSetup = require("../lib/local_storage_setup.jsx");

var view = {};
view.render = function () {
	// validate local storage cache
	var cacheBustingToken = CACHE_BUSTER || Math.random().toString();
	(new LocalStorageSetup()).checkCache(cacheBustingToken);
	React.render(<AsyncVariantMap />, document.getElementById("j-main"))
};



module.exports = view;
