/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({
	getDefaultProps: function () {
		return {
			visible: false,
			text: null,
			left: 0,
			top: 0,
			title: null,
			data: null,
			href: null
		};
	},

	render: function () {
		var props = this.props;
		var _isComplex = this._isComplex();
		var _complexWidth = 350
		var _style = {
			position: "absolute",
			display: (props.visible ? "block" : "none"),
			top: props.top,
			left: props.left,
			marginLeft: (_isComplex && this.props.orientation !== "top") ? -(_complexWidth * 4/5) : -50,
			marginTop: _isComplex ? 30 : -60,
			minHeight: _isComplex ? 100 : 35,
			padding: _isComplex ? "1em" : 0,
			width: _isComplex ? _complexWidth: "auto"
		};

		var innerContentNode = this._getInnerContentNode();
		var arrowKlass = _isComplex ? "flexible-tooltip-arrow complex" : "flexible-tooltip-arrow";
		if (this.props.orientation === "top") arrowKlass = "flexible-tooltip-arrow";
		return (
			<div className="flexible-tooltip" style={_style} >
				{innerContentNode}
				<div className={arrowKlass} style={{ position: "absolute" }}></div>
			</div>
		);
	},

	_getInnerContentNode: function () {
		if (this._isComplex()) {
			return this._getComplexContent();
		} else {
			return this._getTextNode();
		}
	},

	// false if just has text, true means has title and data object
	_isComplex: function () {
		return (this.props.title && this.props.data);
	},

	_getComplexContent: function () {
		// init the title node
		var titleNode = null;
		if (this.props.title) {
			var _innerText = this.props.href ? (<a href={this.props.href}>{this.props.title}</a>) : this.props.title;
			titleNode = <h3>{_innerText}</h3>;
		}

		var dataNode = null;
		if (this.props.data) {
			var _keys = _.keys(this.props.data);
			var _innerNodes = _.reduce(_keys, (memo, k) => {
				memo.push(<dt>{k}</dt>);
				memo.push(<dd>{this.props.data[k]}</dd>);
				return memo;
			}, []);
			dataNode = <dl className="key-value">{_innerNodes}</dl>;
		}

		return <div>{titleNode}<hr />{dataNode}</div>;
	},

	_getTextNode: function () {
		var _innerText = this.props.href ? (<a href={this.props.href}>{this.props.text}</a>) : this.props.text;
		return (<span className="flexible-tooltip-text" style={{ display: "block" }}>
			{_innerText}
		</span>);
	}
});
