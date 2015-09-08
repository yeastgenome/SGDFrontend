/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AsyncVariantViewer = React.createClass({
	propTypes: {
		sgdid: React.PropTypes.string.isRequired,
		store: React.PropTypes.object.isRequired
	},

	getInitialState: function () {
		return { isPending: true };
	},

	render: function () {
		if (this.state.isPending) return <div className="sgd-loader-container"><div className="sgd-loader" /></div>;
		return (
			<div>
				<h1>Async Var Viewer</h1>
				<h3>{this.props.sgdid}</h3>
			</div>
		);
	}
});

module.exports = AsyncVariantViewer;
