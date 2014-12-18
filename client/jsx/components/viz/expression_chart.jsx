/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var HelpIcon = require("../widgets/help_icon.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");

var HEIGHT = 300;
var SIDE_PADDING = 100;
var TOP_PADDING = 20;
var TRANSITION_DURATION = 1000;

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	propTypes: {
		data: React.PropTypes.object.isRequired,
		hasHelpIcon: React.PropTypes.bool,
		hasScaleToggler: React.PropTypes.bool,
		minValue: React.PropTypes.number.isRequired,
		maxValue: React.PropTypes.number.isRequired
	},

	getDefaultProps: function () {
		return {
			data: null,
			hasHelpIcon: false,
			hasScaleToggler: false,
			minValue: null,
			maxValue: null,
			onClick: null // (min, max) =>
		};
	},

	getInitialState: function () {
		return {
			DOMWidth: 400,
			logAxis: true,
		};
	},

	render: function () {
		var scaleTogglerNode = this._getScaleTogglerNode();

		var _helpText = "The histogram panel contains a Y-axis toggle. The default view is in log10 space to better visualize the large amount of data, and enhance the tails at either expression extreme. Move the toggle slider to the left to view the data in linear space. Clickable histogram bars filter the dataset results presented in the table below based on increased or decreased log2 expression ratios.";
		var helpNode = this.props.hasHelpIcon ? <h3 style={{ position: "absolute", top: 0, right: 0 }}><HelpIcon text={_helpText} orientation="left"/></h3> : null;
		return (<div className="expression-histogram" style={{ position: "relative" }}>
			{helpNode}
			{scaleTogglerNode}
			<span className="histogram-axis-text y"><i>Number of Conditions</i></span>
			<svg ref="svg" style={{ width: "100%", height: HEIGHT }}></svg>
			<span className="histogram-axis-text x"><i>log2 Ratio</i></span>
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
	},

	componentDidUpdate: function () {
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
			.tickFormat(d3.format(".1f"))
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
		var _barWidth = d3.scale.ordinal().domain(xScale.domain()).rangeRoundBands([0, this.state.DOMWidth - 2 * SIDE_PADDING], 0.05, 0).rangeBand();
		var xFn = (d) => { return SIDE_PADDING + Math.round(xScale(d.key)) + 0.05 * _barWidth; };

		// enter
		bars.enter().append("rect")
			.attr({
				class: "bar",
				x: xFn,
				y: HEIGHT - TOP_PADDING,
				width: _barWidth,
				height: 0,
				fill: (d) => { return (d.key >= 0 ? "red" : "green"); }
			})
			.on("click", d => {
				if (this.props.onClick) {
					var _allKeys = _.sortBy(_.map(_.keys(this.props.data), d => { return parseFloat(d); }));
					var _keyIndex = Math.max(_allKeys.indexOf(d.key), 0);
					var _min = _keyIndex === 0 ? "*" : d.key.toFixed(1);
					var _max =  _keyIndex === _allKeys.length - 1 ? "*" :  _allKeys[_keyIndex + 1].toFixed(1);
					this.props.onClick(_min, _max);
				}
			});

		// update
		bars.transition().duration(TRANSITION_DURATION)
			.attr({
				x: xFn,
				y: (d) => { return HEIGHT - TOP_PADDING - yScale(d.value); },
				width: _barWidth,
				height: (d) => { return yScale(d.value); },
				fill: (d, i) => {
					if (i === 0) {
						return "#13E063";
					} else if (i === data.length - 1) {
						return "#D90000";
					} else {
						return (d.key >= 0 ? "#860004" : "#0E8B3F");
					}
				}
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
		var _baseScale = this.state.logAxis ? d3.scale.log().base(10) : d3.scale.linear();

		return _baseScale
			.domain([1, _maxY])
			.range([0, HEIGHT - 2 * TOP_PADDING]);
	},

	_getBuckets: function () {
		var keys = _.map(_.keys(this.props.data), d => { return parseFloat(d); });
		keys = _.sortBy(keys);
		keys[0] = this.props.minValue;
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
		data = _.sortBy(data, d => { return d.key; })
		data[0].key = this.props.minValue;
		return data;
	},

	_calculateWidth: function () {
		this.setState({ DOMWidth: this.getDOMNode().getBoundingClientRect().width });
	},

	_getScaleTogglerNode: function () {
		if (!this.props.hasScaleToggler) {
			return null;
		}

		var _elements = [ { name: "log10 Y-Axis", key: "log" }, { name: "Linear Y-Axis" , key: "linear" }];
		var _onSelect = (key) => {
			this.setState({ logAxis: key === "log" });
		}
		return (<div style={{ width: 350 }}>
			<RadioSelector elements={_elements} initialActiveElementKey="log" onSelect={_onSelect} />
		</div>);
	}
});
