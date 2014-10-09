/** @jsx React.DOM */
"use strict";

var React = require("react");

var WIDTH = 400;

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			text: "",
			html: null,
			orientation: "left",
			isInfo: false, // makes an "i" if true, default is "?"
		};
	},

	getInitialState: function () {
		return {
			textIsVisible: false
		};
	},

	render: function () {
		// click handler for icon
		var _toggleTextVisible = (e) => {
			e.nativeEvent.stopImmediatePropagation();
			this.setState({ textIsVisible: !this.state.textIsVisible });
		};

		// get text (null if unless textIsVisible)
		var textNode = this._getTextNode();

		var _iconKlass = this.props.isInfo ? "info-circle" : "question-circle" ;
		var iconKlass = `fa fa-${_iconKlass}`

		return (
			<span className="context-help-icon" style={{ position: "relative" }}>
				{textNode}
				<a onClick={_toggleTextVisible}><i className={iconKlass}></i></a>
			</span>
		);
	},

	// add event listener to document to dismiss when clicking
	componentDidMount: function () {
		document.addEventListener("click", () => {
			if (this.isMounted() && this.state.textIsVisible) {
				this.setState({ textIsVisible: false });
			}
		});
	},

	_getTextNode: function () {
		var textNode = null;
		if (this.state.textIsVisible) {
			var _onClick = e => { return e.nativeEvent.stopImmediatePropagation(); };
			var _orientKlass = (this.props.orientation === "left") ? "drop-left" : "drop-right";
			var _klass = `f-dropdown content medium ${_orientKlass}`;
			var _left = (this.props.orientation === "left") ? -WIDTH : "1em";
			textNode = (
				<p className={_klass} style={{ width: WIDTH, top: -7, left: _left }} onClick={_onClick} >
					{this.props.text}
				</p>
			);
		}

		return textNode;
	}
});
