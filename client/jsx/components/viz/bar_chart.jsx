/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var FlexibleTooltip = require("../flexible_tooltip.jsx");

/*
	Uses react to render bars, with d3 doing some calculations.

	NOTE: Only supports left orientation and values >= 0
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		var _identity = (d) => { return d; };
		
		return {
			data: null, // *
			colorValue: function (d) { return d; },
			colorScale: d3.scale.category20(),
			hasTooltip: false,
			labelRatio: 0.5,
			labelValue: _identity,
			nodeOpacity: function (d) { return "auto"; },
			filter: null,
			yValue: _identity
		};
	},

	getInitialState: function () {
		return {
			widthScale: null,
			tooltipVisible: false,
			tooltipText: "",
			tooltipLeft: 0,
			tooltipTop: 0,
			tooltipHref: null,
			filterIsApplied: true,
		};
	},

	render: function () {
		var state = this.state;
		var props = this.props;

		var barHeight = 15;
		// require widthScale to continue
		if (!state.widthScale) { return <div></div>; }

		// if a filter is defined (and filterIsApplied), then filter data with it.
		var hasFilter = props.filter && state.filterIsApplied;
		var data = props.data;
		if (hasFilter) {
			data = _.filter(data, props.filter);
		}

		// render bar nodes
		var bars = _.map(data, (d, i) => {

			var _containerStyle = {
				width: "100%",
				height: barHeight,
				position: "absolute",
				top: (i*barHeight + i)
			};

			var _barStyle = {
				position: "absolute",
				top: 0,
				left: `${props.labelRatio * 100}%`,
				width: state.widthScale(props.yValue(d)),
				height: "100%",
				background: d.nestedValues ? "none": props.colorScale(props.colorValue(d)),
				opacity: props.nodeOpacity(d)
			};

			// if nestedValues is present, make some nested nodes, otherwise leave them null
			var nestedBars = null;
			if (d.nestedValues) {
				nestedBars = _.map(d.nestedValues, function (nestedData, nestedIndex) {
					var _nestedStyle = {
						background: d3.scale.category10().range()[nestedIndex],
						width: state.widthScale(props.yValue(nestedData)),
						height: "100%",
						float: "left"
					};

					return <div className="nested-bar-node" key={`nestedBar${nestedIndex}`} style={_nestedStyle}></div>;
				})
			}

			var _onMouseOver = (e) => { this._handleMouseOver(e, d); }
			var _innerLabelNode = d.link ? <a href={d.link}>{props.labelValue(d)}</a> : props.labelValue(d);

			return (
				<div className="bar-container" style={_containerStyle} onMouseOver={_onMouseOver} key={`bar${props.labelValue(d)}`}>
					<div className="bar-label" style={{ width: `${props.labelRatio * 100}%`, lineHeight: 1.25, textAlign: "right", paddingRight: "1em" }}>
						<span>{_innerLabelNode}</span>
					</div>
					<div className="bar-node clearfix" style={_barStyle}>
						{nestedBars}
					</div>
				</div>
			);
		});

		// add unfiltering message if the filter was used
		var filterMessageNode = hasFilter ? <p className="sgd-viz-filter-message">Some values have been hidden.  <a onClick={this._clearFilter}>Show All</a></p> : null;

		var _yAxisStyle = { left: `${props.labelRatio*100}%`, width: `${(1-props.labelRatio)*100}%` };
		var yAxisLabel = props.yAxisLabel ? (<p className="y-axis-label" style={_yAxisStyle}>{props.yAxisLabel}</p>) : null;
		var tooltipNode = props.hasTooltip ? (<FlexibleTooltip visible={state.tooltipVisible}
				left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText} href={state.tooltipHref}
			/>) : null;

		return (
			<div className="sgd-viz-bar-chart">
				{yAxisLabel}
				<svg style={{ width: "100%", height: 40, display: "block" }}></svg>
				<div className="bar-nodes-container clearfix" onMouseLeave={this._handleMouseExit} style={{ position: "relative", height: (barHeight + 1) * data.length }}>
					{tooltipNode}
					{bars}
				</div>
				{filterMessageNode}
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidthScale();
	},

	componentDidUpdate: function () {
		this._renderSVGScale();
	},

	componentWillReceiveProps: function (nextProps) {
		this._calculateWidthScale(nextProps);
	},

	_renderSVGScale: function () {
		var state = this.state;

		// require widthScale to continue
		if (!state.widthScale) { return; }

		var yAxisFn = d3.svg.axis()
			.orient("top")
			.ticks(3)
			.tickSize(6)
			.scale(state.widthScale);

		var svg = d3.select(this.getDOMNode()).select("svg");
		
		var _translate = `translate(${this.getDOMNode().getBoundingClientRect().width * this.props.labelRatio - 1}, 30)`;
		var yAxis = svg.selectAll("g.y-axis").data([null]);
		yAxis.enter().append("g")
			.attr({
				class: "y-axis",
				transform: _translate
			});
		yAxis.transition().duration(500)
			.attr({ transform: _translate })
			.call(yAxisFn);
		
	},

	_handleMouseOver: function (e, d) {
		var target = e.currentTarget;
		var barNode = target.getElementsByClassName("bar-node")[0];

		d3.select(this.getDOMNode()).selectAll(".bar-node").style({ opacity: 0.6 });
		d3.select(barNode).style({ opacity: 1 })

		if (this.props.onMouseOver) {
			this.props.onMouseOver(d);
		}
		if (this.props.hasTooltip) {
			this.setState({
				tooltipVisible: true,
				tooltipText: `${this.props.labelValue(d)} - ${this.props.yValue(d).toLocaleString()}`,
				tooltipTop: target.offsetTop,
				tooltipLeft: barNode.offsetLeft + barNode.getBoundingClientRect().width/2,
				tooltipHref: d.link
			});
		}
	},

	_handleMouseExit: function () {
		d3.select(this.getDOMNode()).selectAll(".bar-node").style({ opacity: 0.6 });
		this.setState({
			tooltipVisible: false,
		});
	},

	// domain from data get range from DOMNode with
	_calculateWidthScale: function (props) {
		var _props = props ? props : this.props;
		var _maxY = d3.max(_props.data, _props.yValue);
		var _width = this.getDOMNode().getBoundingClientRect().width;
		var _scale = d3.scale.linear().domain([0, _maxY]).range([0, _width * (1-_props.labelRatio)]);
		this.setState({ widthScale: _scale });
	},

	_clearFilter: function () {
		this.setState({ filterIsApplied: false });
	}
});
