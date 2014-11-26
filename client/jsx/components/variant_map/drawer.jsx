/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DidClickOutside = require("../mixins/did_click_outside.jsx");

var HEIGHT_WITH_SEQUENCE = 580;
var HEIGHT_WITHOUT_SEQUENCE = 390;

module.exports = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		locusId: React.PropTypes.number.isRequired,
		onExit: React.PropTypes.func.isRequired
	},

	getInitialState: function () {
		return {
			showSequence: false
		};
	},

	render: function () {
		var _height = this.state.showSequence ? HEIGHT_WITH_SEQUENCE : HEIGHT_WITHOUT_SEQUENCE;
		var _style = {
			position: "fixed",
			bottom: 0,
			left: 0,
			right: 0,
			height: _height,
			background: "#efefef",
			zIndex: 1
		};
		var _exitStyle = {
			position: "absolute",
			top: 0,
			right: "1rem",
			color: "black"
		};

		var showSequenceButtonNode = this.state.showSequence ? null : <a className="button secondary small" onClick={this._showSequence}>Show Sequence</a>;
		return (<div style={_style}>
			<h1>
				<a onClick={this.props.onExit} style={_exitStyle}><i className="fa fa-times"></i></a>
			</h1>
			{showSequenceButtonNode}
		</div>);
	},

	didClickOutside: function () {
		this.props.onExit();
	},

	_showSequence: function (e) {
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ showSequence: true });
	}
});
