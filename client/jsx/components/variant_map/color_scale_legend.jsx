/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({


	render: function () {
		var colorScale = d3.scale.linear()
			.domain([0, 1])
			.range(["blue", "white"]);

		return <div></div>;
	}
});
