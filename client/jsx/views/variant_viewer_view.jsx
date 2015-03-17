/** @jsx React.DOM */
"use strict";

var React = require("react");
var AsyncVariantMap = React.createFactory(require("../components/variant_map/async_variant_map.jsx"));
var Drawer = React.createFactory(require("../components/variant_map/drawer.jsx"));
var LocalStorageSetup = require("../lib/local_storage_setup.jsx");

// router stuff
var Router = require("react-router");
var { Route, DefaultRoute } = Router;

var view = {};
view.render = function () {
	// validate local storage cache
	var cacheBustingToken = CACHE_BUSTER || Math.random().toString();
	(new LocalStorageSetup()).checkCache(cacheBustingToken);

	var BlankComponent = React.createClass({ render: function () { return <span />; }});

	var routes = (
		<Route path="/" handler={AsyncVariantMap}>
			<DefaultRoute
				name="variantViewerIndex" handler={BlankComponent}
		    />
		    <Route
		    	name="shallowDrawer" path="/:locusId" handler={Drawer}
		    />
		</Route>
	);

	// React.render(<AsyncVariantMap />, document.getElementById("j-main"))
	Router.run(routes, (Handler) => {
		React.render(<Handler />, document.getElementById("j-main"))
	});
};



module.exports = view;
