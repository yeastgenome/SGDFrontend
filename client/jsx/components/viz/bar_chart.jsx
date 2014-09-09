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
			hasYAxis: true,
			labelRatio: 0.5,
			labelValue: _identity,
			maxY: null,
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
			var _onMouseOver = (e) => { this._handleMouseOver(e, d); };

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
				opacity: d.nestedValues ? 1 : props.nodeOpacity(d)
			};

			// if nestedValues is present, make some nested nodes, otherwise leave them null
			var nestedBars = null;
			if (d.nestedValues) {
				nestedBars = _.map(d.nestedValues, (nestedData, nestedIndex) => {
					var _nestedColors = ["#1f77b4", "#aec7e8", "#999"];
					var _nestedStyle = {
						background: _nestedColors[nestedIndex],
						width: state.widthScale(props.yValue(nestedData)),
						height: "100%",
						float: "left"
					};

					_onMouseOver = null;
					var _onNestedMouseOver = (e) => { this._handleMouseOver(e, nestedData); };

					return <div className="bar-node nested-bar-node data-node" key={`nestedBar${nestedIndex}`} style={_nestedStyle} onMouseOver={_onNestedMouseOver}></div>;
				})
			}

			var _innerLabelNode = d.link ? <a href={d.link}>{props.labelValue(d)}</a> : props.labelValue(d);

			return (
				<div className="bar-container" style={_containerStyle} onMouseOver={_onMouseOver} key={`bar${props.labelValue(d)}`}>
					<div className="bar-label" style={{ width: `${props.labelRatio * 100}%`, lineHeight: 1.25, textAlign: "right", paddingRight: "1em" }}>
						<span>{_innerLabelNode}</span>
					</div>
					<div className={`bar-node clearfix ${d.nestedValues ? "" : "data-node"}`} style={_barStyle}>
						{nestedBars}
					</div>
				</div>
			);
		});

		// create y axis, if hasYaxis
		var yAxis = null;
		if (props.hasYAxis) {
			var _yAxisStyle = { left: `${props.labelRatio*100}%`, width: `${(1-props.labelRatio)*100}%` };
			var yAxisLabel = props.yAxisLabel ? (<p className="axis-label" style={_yAxisStyle}>{props.yAxisLabel}</p>) : null;
			yAxis = [yAxisLabel, <svg style={{ width: "100%", height: 40, display: "block" }}></svg>];
		}

		var tooltipNode = props.hasTooltip ? (<FlexibleTooltip visible={state.tooltipVisible}
				left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText} href={state.tooltipHref}
			/>) : null;

		return (
			<div className="sgd-viz-bar-chart">
				{yAxis}
				<div className="bar-nodes-container clearfix" onMouseLeave={this._handleMouseExit} style={{ position: "relative", height: (barHeight + 1) * data.length }}>
					{tooltipNode}
					{bars}
				</div>
				{this._getFilterMessageNode()}
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
		// return if no yAxis
		if (!this.props.hasYAxis) { return; }

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
		var yAxis = svg.selectAll("g.axis").data([null]);
		yAxis.enter().append("g")
			.attr({
				class: "axis",
				transform: _translate
			});
		yAxis.transition().duration(500)
			.attr({ transform: _translate })
			.call(yAxisFn);
		
	},

	_handleMouseOver: function (e, d) {
		var target = e.currentTarget;
		var barNode = target.getElementsByClassName("bar-node")[0];
		var baseLeft = 0;

		// take care of nested mousover
		if (!barNode) {
			barNode = target;
			baseLeft = target.parentNode.offsetLeft;
		}

		d3.select(this.getDOMNode()).selectAll(".bar-node.data-node").style({ opacity: 0.6 });
		d3.select(barNode).style({ opacity: 1 })

		if (this.props.onMouseOver) {
			this.props.onMouseOver(d);
		}
		if (this.props.hasTooltip) {
			this.setState({
				tooltipVisible: true,
				tooltipText: `${this.props.labelValue(d)} - ${this.props.yValue(d).toLocaleString()}`,
				tooltipTop: target.offsetTop,
				tooltipLeft: baseLeft + barNode.offsetLeft + barNode.getBoundingClientRect().width/2,
				tooltipHref: d.link
			});
		}
	},

	_handleMouseExit: function () {
		d3.select(this.getDOMNode()).selectAll(".bar-node.data-node").style({ opacity: 0.6 });
		this.setState({
			tooltipVisible: false,
		});
	},

	// domain from data get range from DOMNode with
	_calculateWidthScale: function (props) {
		var _props = props ? props : this.props;
		var _maxY = _props.maxY || d3.max(_props.data, _props.yValue); // defaults to maxY prop, if defined
		var _width = this.getDOMNode().getBoundingClientRect().width;
		var _scale = d3.scale.linear().domain([0, _maxY]).range([0, _width * (1-_props.labelRatio)]);
		this.setState({ widthScale: _scale });
	},

	_getFilterMessageNode: function () {
		var _toggleFilter = () => {
			this.setState({
				filterIsApplied: !this.state.filterIsApplied
			});
		};

		var messageNode = null;
		if (this.props.filter) {
			messageNode = this.state.filterIsApplied ?
				 <p className="sgd-viz-filter-message">Some values have been hidden.  <a onClick={_toggleFilter}>Show All</a></p> :
				 <p className="sgd-viz-filter-message">All values are being shown.  <a onClick={_toggleFilter}>Reset Filter</a></p>;
		}

		return messageNode;
	}
});
