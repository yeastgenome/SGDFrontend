/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");

var FlexibleTooltip = require("../flexible_tooltip.jsx");

/*
	A react component that uses d3 to draw a circlular partition with nested data.
	This component has been adapted using the example at http://bl.ocks.org/mbostock/4348373.
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			yValue: function (d) { return d }
		};
	},

	getInitialState: function () {
		return {
			tooltipVisible: false,
			tooltipText: "",
			tooltipLeft: 0,
			tooltipTop: 0,
			tooltipHref: null
		};
	},

	componentDidMount: function () {
		this._renderSVG();
	},

	render: function () {
		var state = this.state;
		return (
			<div style={{ position: "relative" }} onMouseLeave={ () => { this._clearTooltip(true); } }>
				<FlexibleTooltip visible={state.tooltipVisible}
				left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText} href={state.tooltipHref} />
			</div>
		);
	},

	// use d3 to render an svg visualization
	_renderSVG: function () {
		var width = this.getDOMNode().offsetWidth,
		    height = this.getDOMNode().offsetWidth,
		    radius = Math.min(width, height) / 2;

		var x = d3.scale.linear()
		    .range([0, 2 * Math.PI]);

		var y = d3.scale.sqrt()
		    .range([0, radius]);

		var svg = d3.select(this.getDOMNode()).selectAll("svg").data([null]).enter().append("svg")
			.attr({
				width: width,
				height: height + 20,
				class: "zoomable-sunburst"
			})
			.append("g")
				.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")")

		// recursive helper function to get top level color
		function getTopParent (node) {
			if (node.depth > 1) {
				return getTopParent(node.parent);
			} else {
				return node;
			}
		}		

		// interpolate scales for radial transition
		function arcTween(d) {
		  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		      yd = d3.interpolate(y.domain(), [d.y, 1]),
		      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		  return function(d, i) {
		    return i
		        ? function(t) { return arc(d); }
		        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
		  };
		}

		// track the zoom depth, change when zooming
		var currentZoomDepth = 0;

		var click = (d) => {
			currentZoomDepth = d.depth;
			if (this.props.onZoom) {
				this.props.onZoom(d, getTopParent(d));
			}
			this._clearTooltip(true)
			path.transition()
				.duration(500)
				.style({
					cursor: (d) => { return d.depth < currentZoomDepth ? "zoom-out": "pointer"; },
					"fill": (d, i) => {
						if (currentZoomDepth || d.depth) {
							return this.props.colorScale(getTopParent(d).data.format_name);
						} else {
							return "none";
						}					
					}
				})
				.attrTween("d", arcTween(d));
		}

		// TEMP commenting
		var partition = d3.layout.partition()
			// .children( (d) => {
			// 	var children = d.children;
			// 	// if there are children, add dummy node to make things add up
			// 	if (d.depth && d.children && d.children.length) {
			// 		var delta = this.props.yValue(d.data) - d3.sum(children, (d) => { return this.props.yValue(d.data); });
			// 		// the children < node value
			// 		if (delta > 0) {
			// 			children.push({ dummy: true, forceValue: delta });
			// 		}
			// 	}
			// 	return children;
			// })
			.value((d) => { return 1; })
			// .value( (d) => { return d.forceValue ? d.forceValue: this.props.yValue(d.data); });


		var arc = d3.svg.arc()
		    .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
		    .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
		    .innerRadius(function (d) { return Math.max(0, y(d.y)); })
		    .outerRadius(function (d) { return Math.max(0, y(d.y + d.dy)); });
		// expose arc for use outside of function
		this.arc = arc;

		var _this = this;
		var path = svg.selectAll("path")
			.data(partition.nodes(this.props.data))
			
		path.enter().append("path")
			.attr("d", arc)
			.style({
				"fill": (d, i) => {
					if (currentZoomDepth || d.depth) {
						return this.props.colorScale(getTopParent(d).data.format_name);
					} else {
						return "none";
					}					
				},
				"fill-rule": "evenodd",
				"stroke": "#fff",
				opacity: 0.6,
				display: (d) => { return d.dummy ? "none": "auto"; },
				cursor: "pointer"
			})
			.on("click", click)
			.on("mouseenter", function (d) {
				svg.selectAll("path").style({ opacity: 0.6 });
				d3.select(this)
					.style({ opacity: 1 });
				_this._updateTooltip(d);
			});
	},

	_clearTooltip: function (lowerAllOpacity) {
		this.setState({ tooltipVisible: false });
		if (lowerAllOpacity) {
			d3.select(this.getDOMNode()).selectAll("path").style({ opacity: 0.6 });
		}
	},

	// respond to mouseover events from d3, update state for tooltip data
	_updateTooltip: function (d) {
		if (!d.data.annotation_count) {
			this._clearTooltip();
			return;
		}

		// use trig to calculate center of segment
		var angle = (this.arc.startAngle()(d) + this.arc.endAngle()(d))/2  - Math.PI/2;
		var radius = (this.arc.innerRadius()(d) + this.arc.outerRadius()(d)) / 2 ;
		var _left = this.getDOMNode().offsetWidth / 2 + radius * Math.cos(angle);
		var _top = (this.getDOMNode().offsetHeight-20) / 2 + radius * Math.sin(angle);

		this.setState({
			tooltipVisible: true,
			tooltipText: d.data.display_name + " - " + d.data.annotation_count.toLocaleString(),
			tooltipTop: _top,
			tooltipLeft: _left,
			tooltipHref: d.data.link
		});
	}
});
