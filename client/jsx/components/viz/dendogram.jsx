/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	render: function () {
		// TEMP just static image
		var _style = {
			width: 244,
			height: 50,
			marginLeft: 100
		}
		return <img style={_style} src="/static/img/temp_fake_dendogram.gif" />;
	}
});
