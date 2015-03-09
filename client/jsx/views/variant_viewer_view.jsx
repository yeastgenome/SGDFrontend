/** @jsx React.DOM */
"use strict";

var React = require("react");
var AsyncVariantMap = require("../components/variant_map/async_variant_map.jsx");
var LocalStorageSetup = require("../lib/local_storage_setup.jsx");

var view = {};
view.render = function () {
	React.renderComponent(<AsyncVariantMap />, document.getElementById("j-main"))
};

// validate local storage cache
var cacheBustingToken = CACHE_BUSTER || Math.random().toString();
(new LocalStorageSetup()).checkCache(cacheBustingToken);

module.exports = view;
