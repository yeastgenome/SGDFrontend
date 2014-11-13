/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var HEIGHT = 300;

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
		var xScale = this._getXScale();
		var yScale = this._getYScale();

		var _barWidth = d3.scale.ordinal().domain(xScale.domain()).rangeRoundBands([0, this.state.DOMWidth], 0.05, 0).rangeBand();		
		var _data = this._getDataAsArray();
		var barsNodes = _.map(_data, (d, i) => {
			var _style = {
				position: "absolute",
				background: (d.key >= 0 ? "red" : "green"),
				left: Math.round(xScale(d.key)),
				bottom: 0,
				width: _barWidth,
				height: yScale(d.value)
			};
			return <div key={"histogramBar" + i} style={_style} />;
		});

		return (<div style={{ position: "relative", height: HEIGHT }}>
			{barsNodes}
		</div>);
	},

	_getXScale: function () {
		var _buckets = this._getBuckets();
		return d3.scale.ordinal()
			.domain(_buckets)
			.rangePoints([0, this.state.DOMWidth]);
	},

	_getYScale: function () {
		var _maxY = _.max(this._getDataAsArray(), d => { return d.value; }).value;
		return d3.scale.log()
			.base(10)
			.domain([1, _maxY])
			.range([0, HEIGHT]);
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
