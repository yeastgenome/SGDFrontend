/** @jsx React.DOM */
"use strict";

var React = require("react");

module.exports = React.createClass({
	getDefaultProps: function () {
		return {
			visible: false,
			text: "",
			left: 0,
			top: 0,
			href: null
		};
	},

	render: function () {
		var props = this.props;
		var _style = {
			position: "absolute",
			display: (props.visible ? "block" : "none"),
			top: props.top,
			left: props.left
		};

		// make the text a link if href prop is present
		var _textNode = props.href ? (<a href={props.href}>{props.text}</a>) : props.text;

		return (
			<div className="flexible-tooltip" style={_style}>
				<span className="flexible-tooltip-text" style={{ display: "block" }}>
					{_textNode}
				</span>
				<div className="flexible-tooltip-arrow" style={{ position: "absolute" }}></div>
			</div>
		);
	}
});
