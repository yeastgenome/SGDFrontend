/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var FlexibleTooltip = require("../flexible_tooltip.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var BAR_HEIGHT = 15;

/*
	Uses react to render bars, with d3 doing some calculations.

	NOTE: Only supports left orientation and values >= 0
*/
module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	getDefaultProps: function () {
		var _identity = (d) => { return d; };
		
		return {
			data: null, // *
			colorValue: function (d) { return d; },
			colorScale: function (d) { return "#DF8B93" },
			hasTooltip: false,
			hasYAxis: true,
			labelRatio: 0.5,
			labelValue: _identity,
			maxY: null,
			nodeOpacity: function (d) { return "auto"; },
			filter: null,
			scaleType: "linear",
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

		// require widthScale to continue
		if (!state.widthScale) return <div></div>;

		var bars = this._getBarNodes();

		// create y axis, if hasYaxis
		var data = this._getData();
		var yAxis = null;
		if (props.hasYAxis) {
			var _maxY = props.maxY || d3.max(data, props.yValue);
			yAxis = <StandaloneAxis scaleType={this.props.scaleType} domain={[0, _maxY]} labelText="Gene Products Annotated" leftRatio={props.labelRatio} transitionDuration={500} />;
		}

		var tooltipNode = props.hasTooltip ? (<FlexibleTooltip visible={state.tooltipVisible}
				left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText} href={state.tooltipHref}
			/>) : null;

		// get height for all the bars
		var _height = (BAR_HEIGHT + 1) * data.length;

		return (
			<div className="sgd-viz-bar-chart">
				{yAxis}
				<div className="bar-nodes-container clearfix" onMouseLeave={this._handleMouseExit} style={{ position: "relative", height: _height }}>
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

	componentWillReceiveProps: function (nextProps) {
		this._calculateWidthScale(nextProps);
	},

	// called by mixin
	_calculateWidth: function () {
		this._calculateWidthScale();
	},

	// helper function to get the bar nodes
	_getBarNodes: function () {
		var props = this.props;
		var state = this.state;

		// get data from helper
		var data = this._getData();

		// render bar nodes
		var bars = _.map(data, (d, i) => {
			var _onMouseOver = (e) => { this._handleMouseOver(e, d); };

			var _containerStyle = {
				width: "100%",
				height: BAR_HEIGHT,
				position: "absolute",
				top: (i*BAR_HEIGHT + i)
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

		return bars;
	},

	_getData: function () {
		var hasFilter = this.props.filter && this.state.filterIsApplied;
		var data = this.props.data;
		if (hasFilter) {
			data = _.filter(data, this.props.filter);
		}

		return data;
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
		var scaleTypes = {
			linear: d3.scale.linear(),
			sqrt: d3.scale.sqrt()
		};
		var _baseScale = scaleTypes[this.props.scaleType];
		
		var _props = props ? props : this.props;
		var _maxY = _props.maxY || d3.max(_props.data, _props.yValue); // defaults to maxY prop, if defined
		var _width = this.getDOMNode().getBoundingClientRect().width;
		var _scale = _baseScale.domain([0, _maxY]).range([0, _width * (1-_props.labelRatio)]);
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
