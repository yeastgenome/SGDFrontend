/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var Dendogram = require("../viz/dendogram.jsx");

module.exports = React.createClass({
	// TODO declare propTypes
	// strainData
	// onSelect

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
		if (!this.state.isActive) {
			return null;
		}

		var _style = {
			position: "absolute",
			top: "3rem",
			background: "#efefef",
			width: 300,
			height: 300
		};
		return (<div style={_style}>
			<Dendogram />
		</div>);
	}
});
