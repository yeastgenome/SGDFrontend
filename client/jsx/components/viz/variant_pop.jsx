/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

// fill colors
var SYNONYMOUS_COLOR = "#4D9221";  // dark yellow-green
var NON_SYNONYMOUS_COLOR = "#C51B7D"; // dark pink
var INTRON_COLOR = "#E6F5D0"; // pale yellow-green
var UNTRANSLATEABLE_COLOR = "gray";

var VariantPop = React.createClass({
	propTypes: {
		data: React.PropTypes.object.isRequired,
		onMouseOver: React.PropTypes.func,
		scale: React.PropTypes.func,
		y: React.PropTypes.number
	},

	getDefaultProps: function () {
		return {
			scale: function () { return 0; },
			y: 0
		};
	},

	render: function () {
		var d = this.props.data;
		var _avgCoor = (d.coordinateDomain[0] + d.coordinateDomain[1]) / 2;
		var _midX = this.props.scale(_avgCoor)
		var _transform = `translate(${_midX}, ${this.props.y})`;
		if (this.props.onMouseOver) {
			var _onMouseOver = e => {
				this.props.onMouseOver(d.start, d.end);
			};
		}

		var tipNode;
		var _tipStyle = { fontFamily: "FontAwesome", textAnchor: "middle", fontSize: 16 };
		if (d.variant_type === "Insertion") {
			tipNode = <text style={_tipStyle}>&#xf077;</text>;
		} else if (d.variant_type === "Deletion") {
			tipNode = <text style={_tipStyle}>&#xf057;</text>;
		} else {
			var _fills = {
				"Synonymous": SYNONYMOUS_COLOR,
				"Nonsynonymous": NON_SYNONYMOUS_COLOR,
				"Intron": INTRON_COLOR,
				"Untranslatable": UNTRANSLATEABLE_COLOR
			};
			// default to non syn color
			var _fill = _fills[d.snp_type] || NON_SYNONYMOUS_COLOR;
			
			tipNode = <circle r="7" fill={_fill} />;
		}

		var lineNode;
		if (d.variant_type === "Deletion") {
			var _delta = Math.abs(this.props.scale(d.coordinateDomain[1]) - this.props.scale(d.coordinateDomain[0]));
			lineNode = (<g>
				<line x1={ -0.5 * _delta} x2={0.5 * _delta} y1="12" y2="12" stroke="black" strokeWidth="1px" />
				<line x1="0" x2="0" y1="0" y2="12" stroke="black" strokeWidth="2px" />
			</g>);
		} else {
			lineNode = <line x1="0" x2="0" y1="0" y2="25" stroke="black" strokeWidth="2px" />;
		}

		return (
			<g transform={_transform} onMouseOver={_onMouseOver}>
				{lineNode}
				{tipNode}
			</g>
		);
	}

});

module.exports = VariantPop;
