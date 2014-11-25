/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DidClickOutside = require("../mixins/did_click_outside.jsx");

module.exports = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		onExit: React.PropTypes.func.isRequired
	},

	render: function () {
		var _style = {
			position: "fixed",
			bottom: 0,
			left: 0,
			right: 0,
			height: 300,
			background: "#efefef"
		};
		var _exitStyle = {
			position: "absolute",
			top: 0,
			right: "3rem"
		};
		return (<div style={_style}>
			<a onClick={this.props.onExit} style={_exitStyle}><i className="fa fa-times"></i></a>
		</div>);
	},

	didClickOutside: function () {
		this.props.onExit();
	}
});
