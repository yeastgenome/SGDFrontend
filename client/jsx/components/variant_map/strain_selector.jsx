/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var Checklist = require("../widgets/checklist.jsx");
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var WIDTH = 200;

module.exports = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		data: React.PropTypes.array.isRequired,
		initialActiveStrainIds: React.PropTypes.array,
		onSelect: React.PropTypes.func // (activeStrainIds) =>
	},

	getDefaultProps: function () {
		return {
			initialActiveStrainIds: []
		};
	},

	getInitialState: function () {
		return {
			isActive: false,
			activeStrainIds: this.props.initialActiveStrainIds
		};
	},

	render: function () {
		return (<div className="strain-selector" style={{ position: "relative" }}>
			{this._getActiveNode()}
			<a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-check-square" /> Strains</a>
		</div>);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;

		var _style = {
			position: "absolute",
			top: "3rem",
			padding: "1rem",
			background: "#efefef",
			width: WIDTH,
			zIndex: 2
		};

		var _stopClick = e => {
			e.nativeEvent.stopImmediatePropagation();
		};
		var _onSelect = keys => {
			if (this.props.onSelect) {
				this.props.onSelect(keys);
			}
			this.setState({ activeStrainIds: keys });
		};
		return (<div onClick={_stopClick} style={_style}>
				<span style={{ fontSize: "0.875rem" }}>S288C (reference)</span>
				<Checklist elements={this.props.data} initialActiveElementKeys={this.state.activeStrainIds} onSelect={_onSelect} />
		</div>);
	}
});
