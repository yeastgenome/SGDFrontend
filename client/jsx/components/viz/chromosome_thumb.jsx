/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");

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

		return (<div>
			<svg className="chromosome-thumb" style={{ width: this.state.DOMWidth, height: HEIGHT }}>
				{leftArmNode}
				{rightArmNode}
				{centroMereNode}
				{domainNode}
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
