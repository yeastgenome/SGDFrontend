/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var Dendrogram = React.createClass({
	propTypes: {
		width: React.PropTypes.number,
		height: React.PropTypes.number,
		data:  React.PropTypes.object,
		orientation: React.PropTypes.string // "top" or "left"
	},

	getDefaultProps: function () {
		return {
			width: 200,
			height: 200,
			orientation: "top"
		};
	},

	render: function () {
		return (
			<svg width={this.props.width} height={this.props.height} ref="svg">
			</svg>
		);
	},

	componentDidMount: function () { this._drawSvg() },
	componentDidUpdate: function (prevProps, prevState) { if (prevProps.data !== this.props.data) this._drawSvg(); },

	_drawSvg: function () {
		var data = this.props.data;
		var width = this.props.width;
		var height = this.props.height - LABEL_HEIGHT;

		// d3 fu
		var dendoFn = d3.layout.cluster()
			.separation( function (a,b) {
				return 1;
			})
			.size([width - FONT_SIZE / 2, height]);
		var nodesData = dendoFn.nodes(data);
		var linksData = dendoFn.links(nodesData);

		// traditional d3 rendering
		var sel = d3.select(this.refs.svg.getDOMNode());
		
		var labelsData = _.where(nodesData, { isLeaf: true });
		var labels = sel.selectAll(".dendro-label").data(labelsData, function (d) { return d.value.name; });
		labels.enter().append("text")
			.attr({
				class: "dendro-label",
				transform: this._transform,
				"text-anchor": "end",
				"font-size": FONT_SIZE
			})
			.text( function (d) {
				return d.value.name;
			});
		labels.transition().duration(TRANSITION_DURATION)
			.attr({
				transform: this._transform
			});
		labels.exit().remove();

		sel.selectAll(".dendro-link").remove();
		var links = sel.selectAll(".dendro-link").data(linksData);
		links.enter().append("path").attr({
			class: "dendro-link",
			fill: "none",
			stroke: "black",
			d: function (d) {
				return `M ${d.source.x} ${d.source.y + 1} L ${d.target.x} ${d.source.y + 1} L ${d.target.x} ${d.target.y + 1}`;
			},
			"stroke-dasharray": "0, 1000",
			"shape-rendering": "crispedges"
		});
		links.transition().duration(TRANSITION_DURATION)
			.attr({
				"stroke-dasharray": "1000, 0"
			});
		links.exit().remove();

	},

	_transform: function (d) {
		return `translate(${d.x - 5}, ${d.y + LABEL_HEIGHT})rotate(90)`;
	}
});

var LABEL_HEIGHT = 80;
var TRANSITION_DURATION = 1000;
var FONT_SIZE = 14;

module.exports = Dendrogram;
