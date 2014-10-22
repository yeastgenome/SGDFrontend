/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			isButton: true, // false makes a simpler anchor
			url: null, // *
			extension: ".txt",
			params: {},
			text: "Download"
		};
	},

	render: function () {
		var _paramKeys = _.keys(this.props.params);
		var inputNodes = _.map(_paramKeys, k => {
			return <input type="hidden" name={k} value={this.props.params[k]} />;
		});

		return (
			<form method="POST" action={this.props.url}>
				{inputNodes}
				<button className="button small secondary">
					<i className="fa fa-download" /> {this.props.text} ({this.props.extension})
				</button>
			</form>
		);
	}
});
