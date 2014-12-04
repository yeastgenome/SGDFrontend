/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({
	propTypes: {
		pixelDomain: React.PropTypes.array,
		coordinateDomain: React.PropTypes.array
	},

	render: function () {
		return <img style={{ marginLeft: 550 }} src="/static/img/temp_blue_line.png" />;
	}
});
