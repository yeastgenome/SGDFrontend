
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");

var HEIGHT = 20;
var CENTROMERE_RADIUS = HEIGHT / 5;
var PADDING = 3;

/*
	A small visualization of a chromosome and inset to show smaller location within. 
*/
module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	getDefaultProps: function () {
		return {
			totalLength: null, // *
			domain: null,
			centromerePosition: null,  // *
			isChromosome: true
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 150
		};
	},

	render: function () {
		var scale = this._getScale();
		var centromereNode = null;
		var borderRadius = 0;

		// add centromere circle if needed
		if (this.props.isChromosome && this.props.centromerePosition) {
			borderRadius = HEIGHT / 2;
			var _centroStyle = {
				position: "absolute",
				top: 0,
				left: scale(this.props.centromerePosition) - HEIGHT / 2,
				borderRadius: borderRadius,
				background: "black",
				width: HEIGHT,
				height: HEIGHT
			};
			centromereNode = <div style={_centroStyle} />;			
		}
		var chromNode = <rect className="chromosome-thumb-arm" x={0} y={0} width={this.state.DOMWidth} height={HEIGHT} rx={borderRadius} />;

		var _lbX = scale(this.props.domain[0] - 1) - 1;
		var _rbX = scale(this.props.domain[1] + 1) + 1;
		var _domainStyle = { position: "absolute", top: 0, bottom: 5 };
		var _lDomainStyle = _.extend(_.clone(_domainStyle), { left: 0, width: _lbX, borderRadius: `${borderRadius}px 0 0 ${borderRadius}px` });
		var _rDomainStyle = _.extend(_.clone(_domainStyle), { left: _rbX, right: 0, borderRadius: `0 ${borderRadius}px ${borderRadius}px 0` });
		var _cDomainStyle = { position: "absolute", top: 0, height: HEIGHT, left: _lbX, width: (_rbX - _lbX)};
		var leftDomainNode = <div className="chromosome-thumb-inset" style={_lDomainStyle} />;
		var centerDomainNode = <div className="chromosome-thumb-center-inset" style={_cDomainStyle} />;
		var rightDomainNode = <div className="chromosome-thumb-inset" style={_rDomainStyle} />;

		return (<div ref="wrapper" style={{ position: "relative" }}>
			<svg className="chromosome-thumb" style={{ width: this.state.DOMWidth, height: HEIGHT }}>
				{chromNode}				
			</svg>
				{leftDomainNode}
				{centerDomainNode}
				{rightDomainNode}
				{centromereNode}
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
	},

	_getScale: function () {
		return d3.scale.linear().domain([0, this.props.totalLength]).range([0, this.state.DOMWidth]);
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width
		this.setState({ DOMWidth: _width });
	}

});
