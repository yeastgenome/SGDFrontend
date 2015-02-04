/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");

// style static elements
var HEIGHT = 150;
var FILL_COLOR = "yellow";

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	propTypes: {
		isVisible: React.PropTypes.bool,
		x1Coordinates: React.PropTypes.array,
		x2Coordinates: React.PropTypes.array,
		data: React.PropTypes.object
	},

	getDefaultProps: function () {
		return {
			isVisible: false
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 355
		};
	},

	render: function () {
		var _x1C = this.props.x1Coordinates;
		var _x2C = this.props.x2Coordinates;
		var x1 = [_x1C[0], _x1C[1]];
		var x2 = [_x2C[0], _x2C[1]];
		var _polygonString = `${x1[0]},0 ${x1[1]},0 ${x2[1]},${HEIGHT} ${x2[0]},${HEIGHT}`;
		var polygonNode = !this.props.isVisible ? null : <polygon points={_polygonString} style={{ fill: FILL_COLOR }} />;

		return (<div className="parset" style={{ height: HEIGHT }}>
			<svg width="100%" height={HEIGHT}>
				{polygonNode}
			</svg>
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
	},

	// TEMP comment
	// maybe not needed?
	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width;
		this.setState({ DOMWidth: _width });
	}
});
