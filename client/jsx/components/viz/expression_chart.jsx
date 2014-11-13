/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var HEIGHT = 300;
var SIDE_PADDING = 50;
var TOP_PADDING = 20;
var TRANSITION_DURATION = 1000;

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
			DOMWidth: 800,
			logAxis: true,
		};
	},

	render: function () {
		return (<div>
			<svg ref="svg" style={{ width: "100%", height: HEIGHT }}></svg>
		</div>);
	},

	componentDidMount: function () {
		this._renderSVG();
	},

	_renderSVG: function () {
		var svg = d3.select(this.refs.svg.getDOMNode());
		var xScale = this._getXScale();
		var yScale = this._getYScale()
		var reverseYScale = yScale.copy()
			.range([HEIGHT - 2 * TOP_PADDING, 0]);

		// x-axis
		var xAxisFn = d3.svg.axis()
			.orient("bottom")
			.tickValues(xScale.domain())
			.scale(xScale);
		var xAxis = svg.selectAll("g.x-axis").data([null]);
		var _xTransform = `translate(${SIDE_PADDING}, ${HEIGHT - TOP_PADDING})`;
		xAxis.enter().append("g")
			.attr({
				class: "x-axis axis",
				transform: _xTransform
			});
		xAxis.transition().duration(TRANSITION_DURATION)
			.attr({ transform: _xTransform })
			.call(xAxisFn);

		// y-axis
		var yAxisFn = d3.svg.axis()
			.orient("left")
			.scale(reverseYScale)
			.tickFormat(d3.format(",.0f"))
			.tickSize(-this.state.DOMWidth + 2 * SIDE_PADDING, 0)
			.tickValues((this.state.logAxis ? [10, 100, 1000, 10000, 100000, 1000000] : null));
		var yAxis = svg.selectAll("g.y-axis").data([null]);
		var _yTransform = `translate(${SIDE_PADDING}, ${TOP_PADDING})`;
		yAxis.enter().append("g")
			.attr({
				class: "y-axis axis",
				transform: _yTransform
			});
		yAxis.transition().duration(TRANSITION_DURATION)
			.attr({ transform: _yTransform })
			.call(yAxisFn);

		// bars
		var data = this._getDataAsArray();
		var bars = svg.selectAll(".bar").data(data, d => { return d.key; });

		// enter
		var _barWidth = d3.scale.ordinal().domain(xScale.domain()).rangeRoundBands([0, this.state.DOMWidth - 2 * SIDE_PADDING], 0.05, 0).rangeBand();
		bars.enter().append("rect")
			.attr({
				class: "bar",
				x: (d) => { return SIDE_PADDING + Math.round(xScale(d.key)); },
				y: HEIGHT - TOP_PADDING,
				width: _barWidth,
				height: 0,
				fill: (d) => { return (d.key >= 0 ? "red" : "green"); }
			});

		// update
		bars.transition().duration(TRANSITION_DURATION)
			.attr({
				x: (d) => { return SIDE_PADDING + Math.round(xScale(d.key)); },
				y: (d) => { return HEIGHT - TOP_PADDING - yScale(d.value); },
				height: (d) => { return yScale(d.value); },
				fill: (d) => { return (d.key >= 0 ? "red" : "green"); }
			});

		// exit
		bars.exit().remove();
	},

	_getXScale: function () {
		var _buckets = this._getBuckets();
		return d3.scale.ordinal()
			.domain(_buckets)
			.rangePoints([0, this.state.DOMWidth - 2 * SIDE_PADDING]);
	},

	_getYScale: function () {
		var _maxY = _.max(this._getDataAsArray(), d => { return d.value; }).value;
		return d3.scale.log()
			.base(10)
			.domain([1, _maxY])
			.range([0, HEIGHT - 2 * TOP_PADDING]);
	},

	_getBuckets: function () {
		var keys = _.map(_.keys(this.props.data), d => { return parseFloat(d); });
		keys = _.sortBy(keys);
		keys.push(this.props.maxValue);
		return keys;
	},

	_getDataAsArray: function () {
		var data = _.map(_.keys(this.props.data), d => {
			return {
				key: parseFloat(d),
				value: this.props.data[d]
			};
		});
		return _.sortBy(data, d => { return d.key; });
	}
});
