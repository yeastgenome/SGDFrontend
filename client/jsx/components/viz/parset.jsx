/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");

var HEIGHT = 150;

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	propTypes: {
		x1Coordinates: React.PropTypes.array,
		x2Coordinates: React.PropTypes.array,
		data: React.PropTypes.object
	},

	getInitialState: function () {
		return {
			DOMWidth: 355
		};
	},

	render: function () {
		// TEMP
		var x1 = [200, 220];
		var x2 = [10, 500];
		var _polygonString = `${x1[0]},0 ${x1[1]},0 ${x2[1]},${HEIGHT} ${x2[0]},${HEIGHT}`;

		return (<div className="parset">
			<svg width="100%" height={HEIGHT}>
				<polygon points={_polygonString} style={{ fill: "blue"}} />
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
