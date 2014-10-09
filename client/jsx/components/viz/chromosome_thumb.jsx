/** @jsx React.DOM */
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
			centromerePosition: null  // *
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 150
		};
	},

	render: function () {
		// helper vars
		var scale = this._getScale();
		var centromereX = scale(this.props.centromerePosition);
		var armHeight = HEIGHT;

		// form left arm
		var _leftWidth = centromereX - (CENTROMERE_RADIUS / 2);
		var leftArmNode = <rect className="chromosome-thumb-arm" x={0} y={0} width={_leftWidth} height={armHeight} rx={HEIGHT / 2} />;

		// form right arm
		var _rightWidth = this.state.DOMWidth - centromereX - (CENTROMERE_RADIUS / 2);
		var rightArmNode = <rect className="chromosome-thumb-arm" x={centromereX + CENTROMERE_RADIUS / 2} y={0} width={_rightWidth} height={armHeight} rx={HEIGHT / 2} />;

		// centromere circle
		var centroMereNode = <circle cx={centromereX} cy={HEIGHT / 2} r={CENTROMERE_RADIUS} fill="black" shape-rendering="crispEdges" />;

		// inset box
		var domainNode = null;
		if (this.props.domain) {
			var _lbX = scale(this.props.domain[0]) - 1;
			var _width = scale(this.props.domain[1]) - _lbX;
			domainNode = <rect className="chromosome-thumb-inset" x={_lbX + 1} y={-1} width={_width} height={HEIGHT + 1} fill="none" />;
		}

		var _lbX = scale(this.props.domain[0] - 1);
		var _rbX = scale(this.props.domain[1] + 1);
		var _domainStyle = { position: "absolute", top: 0, bottom: 0 };
		var _lDomainStyle = _.extend(_.clone(_domainStyle), { left: 0, width: _lbX });
		var _rDomainStyle = _.extend(_.clone(_domainStyle), { left: _rbX, right: 0 });
		var _cDomainStyle = { position: "absolute", top: 0, height: HEIGHT, left: _lbX, width: (_rbX - _lbX)};
		var leftDomainNode = <div className="chromosome-thumb-inset" style={_lDomainStyle} />;
		var centerDomainNode = <div className="chromosome-thumb-center-inset" style={_cDomainStyle} />;
		var rightDomainNode = <div className="chromosome-thumb-inset" style={_rDomainStyle} />;

		return (<div style={{ position: "relative" }}>
			<svg className="chromosome-thumb" style={{ width: this.state.DOMWidth, height: HEIGHT }}>
				{leftArmNode}
				{rightArmNode}
				{centroMereNode}
				{leftDomainNode}
				{centerDomainNode}
				{rightDomainNode}
			</svg>
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
	},

	_getScale: function () {
		return d3.scale.linear().domain([0, this.props.totalLength]).range([0, this.state.DOMWidth]);
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width;
		this.setState({ DOMWidth: _width });
	}

});
