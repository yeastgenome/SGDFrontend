/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactDOM = require("react-dom");
var $ = require("jquery");
var VariantViewer = require("../components/variant_viewer/variant_viewer.jsx");
var Drawer = require("../components/variant_viewer/drawer.jsx");
var VariantViewerStore = require("../stores/variant_viewer_store.jsx");

// router stuff
var Router = require("react-router");
var { Route, IndexRoute } = Router;

var view = {};
view.render = function () {
	// blank react component to make no drawer
	var BlankComponent = React.createClass({ render: function () { return <span />; }});

	var routes = (
		<Router path="/" component={VariantViewer}>
			<IndexRoute
				component={BlankComponent}
	    />
	    <Route
	    	path="/:locusId" component={Drawer}
	    />
		</Router>
	);

	var Component = React.createClass({
		render: function () {
			return routes;
		}
	});

	var _store = new VariantViewerStore();
	ReactDOM.render(<Component />, document.getElementById("j-main"));
};

module.exports = view;
