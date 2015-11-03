/** @jsx React.DOM */
"use strict";

var React = require("react");
var ReactDOM = require("react-dom");
var $ = require("jquery");
var VariantViewer = require("../components/variant_viewer/variant_viewer.jsx");
var Drawer = require("../components/variant_viewer/drawer.jsx");

// router stuff
var { Router, Route, IndexRoute } = require("react-router");

var view = {};
view.render = function () {
	// blank react component to make no drawer
	var BlankComponent = React.createClass({ render: function () { return <span />; }});

	var RouterComponent = React.createClass({
		render: function () {
			return (
				<Router>
					<Route path="/" component={VariantViewer}>
						<IndexRoute component={BlankComponent} />
				    <Route path="/:locusId" component={Drawer} />
					</Route>
				</Router>
			);
		}
	});

	
	ReactDOM.render(<RouterComponent />, document.getElementById("j-main"));
};

module.exports = view;
