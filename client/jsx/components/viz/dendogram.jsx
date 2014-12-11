/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	render: function () {
		// TEMP just static image
		var _style = {
			width: 120,
			height: 355
		}
		return <img style={_style} src="/static/img/temp_fake_dendogram.gif" />;
	}
});
