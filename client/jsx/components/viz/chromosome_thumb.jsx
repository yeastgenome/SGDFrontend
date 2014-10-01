/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");

var HEIGHT = 30;
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
			innerDomain: null,
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
		var leftArmNode = <rect x={0} y={0} width={_leftWidth} height={armHeight} rx={HEIGHT / 2} fill="#e7e7e7" />;

		// form right arm
		var _rightWidth = this.state.DOMWidth - centromereX - (CENTROMERE_RADIUS / 2);
		var rightArmNode = <rect x={centromereX + CENTROMERE_RADIUS / 2} y={0} width={_rightWidth} height={armHeight} rx={HEIGHT / 2} fill="#e7e7e7" />;

		// centromere circle
		var centroMereNode = <circle cx={centromereX} cy={HEIGHT / 2} r={CENTROMERE_RADIUS} fill="black" />;

		// inset box
		var _lbX = scale(this.props.innerDomain[0]);
		var _domainWidth = scale(this.props.innerDomain[1]) - _lbX;
		var innerDomainNode = <rect className="chromosome-thumb-inset" x={_lbX + 1} y={1} width={_domainWidth} height={HEIGHT - 2} fill="none" />;

		return (<div>
			<svg className="chromosome-thumb" style={{ width: this.state.DOMWidth, height: HEIGHT }}>
				{leftArmNode}
				{rightArmNode}
				{centroMereNode}
				{innerDomainNode}
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
