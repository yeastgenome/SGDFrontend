/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var Checklist = require("../widgets/checklist.jsx");
var Dendogram = require("../viz/dendogram.jsx");

module.exports = React.createClass({
	propTypes: {
		data: React.PropTypes.array.isRequired,
		onSelect: React.PropTypes.func // (activeStrainIds) =>
	},

	getInitialState: function () {
		return {
			isActive: false
		};
	},

	render: function () {
		return (<div className="strain-selector" style={{ position: "relative" }}>
			{this._getActiveNode()}
			<a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-check-square" /> Strains</a>
		</div>);
	},

	_toggleActive: function (e) {
		// e.preventDefault();
		// e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;

		// TEMP hardcode the height
		var _style = {
			position: "absolute",
			top: "3rem",
			padding: "1rem",
			background: "#efefef",
			width: 300,
			height: 390,
			zIndex: 2
		};
		var checklistNode
		return (<div style={_style}>
			<div className="row">
				<div className="columns small-6">
					<Dendogram />
				</div>
				<div className="columns small-6">
					<Checklist elements={this.props.data} />
				</div>
			</div>
		</div>);
	}
});
