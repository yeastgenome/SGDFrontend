
"use strict";

var React = require("react");
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var FlexibleDropdown = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		labelText: React.PropTypes.string.isRequired,
		innerNode: React.PropTypes.object.isRequired, // react component
		orientation: React.PropTypes.string // "left", "right"
	},

	getDefaultProps: function () {
		return {
			orientation: "left"
		};
	},

	getInitialState: function () {
		return {
			isActive: false
		};
	},

	render: function () {
		return (
			<div style={{ position: "relative", display: "inline-block" }}>
				{this._getActiveNode()}
				<a className="button dropdown small secondary" onClick={this._toggleActive}>{this.props.labelText}</a>
			</div>
		);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;

		var _style = {
			position: "absolute",
			top: "3rem",
			padding: "1rem",
			background: "#b9b9b9",
			zIndex: 2
		};
		if (this.props.orientation === "right") _style.right = 0;

		return (
			<div style={_style}>
				{this.props.innerNode}
			</div>
		);
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},
});

module.exports = FlexibleDropdown;
