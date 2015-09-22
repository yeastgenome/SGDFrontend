/** @jsx React.DOM */
"use strict";
var Radium = require("radium");
var React = require("react");
var _ = require("underscore");

var DidClickOutside = require("../mixins/did_click_outside.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");

var WIDTH = 200;

var SettingsDropdown = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		store: React.PropTypes.object,
		onUpdate: React.PropTypes.func // onUpdate()
	},

	getInitialState: function () {
		return {
			isActive: false,
		};
	},

	render: function () {
		return (
			<div style={[style.wrapper]}>
				{this._renderActiveWrapperNode()}
				{this._renderButtonNode()}
			</div>
		);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_renderButtonNode: function () {
		return <a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-cog" /> Settings</a>;
	},

	_renderActiveWrapperNode: function () {
		if (!this.state.isActive) return null;
		var _stopClick = e => {
			e.nativeEvent.stopImmediatePropagation();
		};
		return (
			<div onClick={_stopClick} style={[style.activeWrapper]}>
				{this._renderActiveNode()}
			</div>
		);
	},

	_renderActiveNode: function () {
		var _elements = [
			{
				name: "Genetic Position",
				key: "position"
			},
			{
				name: "Variation",
				key: "entropy"
			}
		];
		return (
			<div>
				<h3>Sort By</h3>
				<RadioSelector
					elements={_elements} orientation="vertical"
					initialActiveElementKey="position"
				/>
			</div>
		);
	}
});

var style = {
	wrapper: {
		position: "relative",
		height: "2.4rem"
	},
	activeWrapper: {
		position: "absolute",
		top: "3rem",
		right: 0,
		padding: "1rem",
		background: "#efefef",
		width: WIDTH,
		zIndex: 2
	}
};

module.exports = Radium(SettingsDropdown);
