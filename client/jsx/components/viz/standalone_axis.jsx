/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			gridTicks: false,
			labelText: null,
			maxValue: null, // *
			orientation: "top", // [top, right, bottom, left]
			scaleType: "linear"
		};
	},

	getInitialState: function () {
		return {
			scale: null
		};
	},

	render: function () {
		var labelNode = this.props.labelText ? <p className="axis-label">{this.props.labelText}</p> : null;

		var _height = this.props.gridTicks ? "100%" : 32;
		var _klass = `standalone-axis ${this.props.gridTicks ? "grid-ticks" : ""}`;
		return (<div className={_klass} style={{ position: "relative" }}>
			{labelNode}
			<svg preserveAspectRatio="none" style={{ width: "100%", height: _height, marginLeft: -5 }}></svg>
		</div>);
	},

	// After initial render, calculate the scale (based on width), which will then trigger update, which eventually
	// renders d3 SVG axis.
	componentDidMount: function () {
		this._calculateScale();
	},

	componentDidUpdate: function () {
		this._renderSVG();
	},

	_calculateScale: function () {
		// maxValue can't be null
		if (this.props.maxValue === null) return;

		var _baseScale = d3.scale.linear();
		var _width = this.getDOMNode().getBoundingClientRect().width - 5;
		var _scale = _baseScale.domain([0, this.props.maxValue]).range([0, _width]);

		this.setState({
			scale: _scale
		});
	},

	// render d3 axis 
	_renderSVG: function () {
		// must have scale calculated
		if (!this.state.scale) return;

		var _tickSize = this.props.gridTicks ? (-this.getDOMNode().offsetHeight) : 6;
		var axisFn = d3.svg.axis()
			.orient(this.props.orientation)
			.ticks(3)
			.tickSize(_tickSize)
			.scale(this.state.scale);

		var svg = d3.select(this.getDOMNode()).select("svg");
		
		var _translate = `translate(5, 30)`;
		var axis = svg.selectAll("g.axis").data([null]);
		axis.enter().append("g")
			.attr({
				class: "axis",
				transform: _translate
			});
		axis
			.attr({ transform: _translate })
			.call(axisFn);
	}

});
