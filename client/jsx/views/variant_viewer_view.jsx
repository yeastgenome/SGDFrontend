/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");
var VariantViewer = require("../components/variant_viewer/variant_viewer.jsx");
var Drawer = require("../components/variant_viewer/drawer.jsx");
var VariantViewerStore = require("../stores/variant_viewer_store.jsx");

// router stuff
var Router = require("react-router");
var { Route, DefaultRoute } = Router;

var view = {};
view.render = function () {
	// blank react component to make no drawer
	var BlankComponent = React.createClass({ render: function () { return <span />; }});

	var routes = (
		<Route path="/" handler={VariantViewer}>
			<DefaultRoute
				name="variantViewerIndex" handler={BlankComponent}
		    />
		    <Route
		    	name="shallowDrawer" path="/:locusId" handler={Drawer}
		    />
		</Route>
	);

	var _store = new VariantViewerStore();
	Router.run(routes, (Handler) => {
		React.render(<Handler store={_store}/>, document.getElementById("j-main"));
	});
};

module.exports = view;
