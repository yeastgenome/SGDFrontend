/** @jsx React.DOM */

var setup = require("./lib/setup.jsx");

/*
	Assign views as the values in a views object, which gets assigned to the global views object.
	To execute view logic, use views.example.render()
*/

var views = {
	expression: require("./views/expression_view.jsx"),
	sequence: require("./views/sequence_view.jsx"),
	snapshot: require("./views/snapshot_view.jsx"),
	summary: require("./views/summary_view.jsx")
};

// call setup script
setup();

// assign to global view object
window.views = views;
module.exports = views;
