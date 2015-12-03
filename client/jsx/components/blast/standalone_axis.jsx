
"use strict";

var d3 = require("d3");
var React = require("react");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	getDefaultProps: function () {
		return {
			gridTicks: false,
			labelText: null,
			leftRatio: 0,
			left: 50,
			domain: null, // *
			orientation: "top", // [top, right, bottom, left]
			scaleType: "linear",
			ticks: 3,
			tickFormat: null,
			transitionDuration: 0
		};
	},

	getInitialState: function () {
		return {
			scale: null
		};
	},

	render: function () {

		// display the label in the middle
		// var labelNode = this.props.labelText ?
		// 	<p className="axis-label" style={{ marginLeft: `${this.props.leftRatio * 100}%`, marginRight: `${this.props.leftRatio * 100}%`, position: "relative" }}>{this.props.labelText}</p> :
		//	null;

		// display label on the left
		var labelNode = this.props.labelText ?
		     <p className="axis-label" style={{ marginLeft: this.props.left, position: "relative" }}>{this.props.labelText}</p> : null;

		var _height = this.props.height || (this.props.gridTicks ? "95%" : 32);
		var _klass = `standalone-axis ${this.props.gridTicks ? "grid-ticks" : ""}`;
		return (<div className={_klass} style={{ position: "relative" }}>
                        {labelNode}
			<svg ref="svg" style={{ width: "100%", height: _height }}></svg>
		</div>);
	},

	// After initial render, calculate the scale (based on width), which will then trigger update, which eventually
	// renders d3 SVG axis.
	componentDidMount: function () {
		this._calculateScale();
	},

	componentWillReceiveProps: function (nextProps) {
		this._calculateScale(nextProps);
	},

	componentDidUpdate: function () {
		this._renderSVG();
	},

	// called by mixin
	_calculateWidth: function () {
		this._calculateScale();
	},

	_calculateScale: function (nextProps) {
		var props = nextProps || this.props;
		
		// maxValue can't be null
		if (props.maxValue === null) return;

		var scaleTypes = {
			linear: d3.scale.linear(),
			sqrt: d3.scale.sqrt()
		};
		var _baseScale = scaleTypes[this.props.scaleType];
		
		var _width = this.getDOMNode().getBoundingClientRect().width - 1;
		var _xOffset = _width * props.leftRatio;
		var _scale = _baseScale.domain(props.domain).range([0, _width - _xOffset]);

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
			.ticks(this.props.ticks)
			.tickFormat(this.props.tickFormat)
			.tickSize(_tickSize)
			.scale(this.state.scale);

		var svg = d3.select(this.refs["svg"].getDOMNode());
		
		// var _xTranslate = (this.getDOMNode().getBoundingClientRect().width * this.props.leftRatio)
		
		var _xTranslate = this.props.left;

		var _yTranslate = (this.props.orientation === "top") ? 30 : 0;
		if (this.props.gridTicks && this.props.orientation === "bottom") {
			_yTranslate += this.getDOMNode().getBoundingClientRect().height - 30;
		}
		var _translate = `translate(${_xTranslate}, ${_yTranslate})`;
		var axis = svg.selectAll("g.axis").data([null]);
		axis.enter().append("g")
			.attr({
				class: "axis",
				transform: _translate
			});
		axis.transition().duration(this.props.transitionDuration)
			.attr({ transform: _translate })
			.call(axisFn);
	}

});
