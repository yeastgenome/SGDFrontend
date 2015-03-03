/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

// style static elements
var HEIGHT = 100;
var LINE_HEIGHT = 6;

module.exports = React.createClass({
	propTypes: {
		isVisible: React.PropTypes.bool,
		x1Coordinates: React.PropTypes.array,
		x2Coordinates: React.PropTypes.array,
		text: React.PropTypes.string,
		contigHref: React.PropTypes.string,
		contigDisplayName: React.PropTypes.string
	},

	getDefaultProps: function () {
		return {
			isVisible: false,
			text: ""
		};
	},

	render: function () {
		var _x1C = this.props.x1Coordinates;
		var _x2C = this.props.x2Coordinates;
		var x1 = [_x1C[0], _x1C[1]];
		var x2 = [_x2C[0], _x2C[1]];
		var _polygonString = `${x1[0]},${LINE_HEIGHT} ${x1[1]},${LINE_HEIGHT} ${x2[1]},${HEIGHT - LINE_HEIGHT} ${x2[0]},${HEIGHT - LINE_HEIGHT}`;

		var labelNode = this._getLabelNode();
		var polygonNode = !this.props.isVisible ? null : <polygon points={_polygonString} fill="#DEC113" opacity={0.5} />;
		var x1LineNode = this._getX1LineNode();
		var x2LineNode = this._getX2LineNode();

		return (<div className="parset" style={{ height: HEIGHT, position: "relative" }}>
			{labelNode}
			<svg width="100%" height={HEIGHT}>
				{x1LineNode}
				{polygonNode}
				{x2LineNode}
			</svg>
		</div>);
	},

	_getLabelNode: function () {
		if (!this.props.isVisible) return null;

		var _x1C = this.props.x1Coordinates;
		var _left = (_x1C[0] + _x1C[1]) / 2;
		var anchorNode = null;
		if (this.props.contigDisplayName && this.props.contigHref) {
			anchorNode = <a href={this.props.contigHref}>{this.props.contigDisplayName}</a>;
		}
		return <h3 style={{ position: "absolute", left: _left - 150, top: LINE_HEIGHT * 2 }}>S288C Coordinates: {anchorNode} {this.props.text}</h3>;
	},

	_getX1LineNode: function () {
		if (!this.props.isVisible) return null;

		var _x1C = this.props.x1Coordinates;
		return (<g>
			<line x1={_x1C[0]} x2={_x1C[0]} y1={0} y2={LINE_HEIGHT} stroke="black" />
			<line x1={_x1C[0]} x2={_x1C[1]} y1={LINE_HEIGHT} y2={LINE_HEIGHT} stroke="black" />
			<line x1={_x1C[1]} x2={_x1C[1]} y1={0} y2={LINE_HEIGHT} stroke="black" />
		</g>);
	},

	_getX2LineNode: function () {
		if (!this.props.isVisible) return null;

		var _x2C = this.props.x2Coordinates;
		return (<g>
			<line x1={_x2C[0]} x2={_x2C[0]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT} stroke="black" />
			<line x1={_x2C[0]} x2={_x2C[1]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT - LINE_HEIGHT} stroke="black" />
			<line x1={_x2C[1]} x2={_x2C[1]} y1={HEIGHT - LINE_HEIGHT} y2={HEIGHT} stroke="black" />
		</g>);
	}
});
