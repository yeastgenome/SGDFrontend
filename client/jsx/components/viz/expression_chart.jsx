/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			data: null,
			minValue: null,
			maxValue: null
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 800
		};
	},

	render: function () {
		var barsNode = this._getBarsNode();
		return (<div>
			{barsNode}
			<svg ref="svg" style={{ width: "100%" }}></svg>
		</div>);
	},

	componentDidMount: function () {
		this._renderSVG();
	},

	_renderSVG: function () {
		var _xScale = this._getXScale();
		var axisFn = d3.svg.axis()
			.orient("bottom")
			.ticks(_xScale.domain())
			.scale(_xScale);

		var svg = d3.select(this.refs.svg.getDOMNode());
		var axis = svg.selectAll("g.axis").data([null]);

		var _transform = `translate(0, 50)`;
		axis.enter().append("g")
			.attr({
				class: "axis",
				transform: _transform
			});
		axis
			.attr({ transform: _transform })
			.call(axisFn);
	},

	_getBarsNode: function () {
		// TEMP
		// var barsNode = _.map(this.props.data)
		return null;
	},

	_getXScale: function () {
		var _buckets = _.sortBy(_.map(_.keys(this.props.data), d => { return parseFloat(d); }));
		var scale = d3.scale.ordinal()
			.domain(_buckets)
			.rangePoints([0, this.state.DOMWidth]);
		return scale;
	}
});
