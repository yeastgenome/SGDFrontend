/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			elements: null, // * [{ name: "Foo", value: "foo" }]
			onChange: null, // (value) =>
			defaultActiveValue: null,
			isDisabled: function (e) { return false; }
		};
	},

	getInitialState: function () {
		return {
			activeValue: this.props.defaultActiveValue || this.props.elements[0].value
		};
	},

	render: function () {
		var optionsNodes = _.map(this.props.elements, e => {
			var _disabled = this.props.isDisabled(e);
			return <option value={e.key} disabled={_disabled}>{e.name}</option>;
		});
		return <select onChange={this._handleChange} className="large-3" value={this.state.activeValue}>{optionsNodes}</select>;
	},

	_handleChange: function (e) {
		var _newValue = e.currentTarget.value;
		if (this.props.onChange) {
			this.props.onChange(_newValue);
		}
		this.setState({ activeValue: _newValue });
	}
});
