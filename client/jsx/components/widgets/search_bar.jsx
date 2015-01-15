/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({
	propTypes: {
		placeholderText: React.PropTypes.string,
		onSubmit: React.PropTypes.func // query =>
	},

	getDefaultProps: function () {
		return {
			placeholderText: ""
		};
	},

	render: function () {
		return (
			<div className="row collapse">
				<form onSubmit={this._onSubmit}>
					<div className="small-10 columns" style={{ paddingLeft: 0, paddingRight: 0 }}>
						<input type="text" ref="searchInput" placeholder={this.props.placeholderText} />
					</div>
					<div className="small-2 columns" style={{ paddingLeft: 0 }}>
						<input type="submit" href="#" className="button secondary postfix" value="Search" />
					</div>
				</form>
			</div>
		);
	},

	_onSubmit: function (e) {
		e.preventDefault();
		if (this.props.onSubmit) {
			this.props.onSubmit(this.refs.searchInput.getDOMNode().value);
		}
	}
});
