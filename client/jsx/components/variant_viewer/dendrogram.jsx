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
		var alpha = 0.5;
		var data = this.props.data;
		if (!data) return null;

		var width = this.props.width;
		var height = this.props.height;
		
		// d3-fu
		var dendoFn = d3.layout.cluster()
			.separation( function (a,b) {
				return 1;
			})
			.size([width, height]);
		var nodes = dendoFn.nodes(data);
		var links = dendoFn.links(nodes);
		var diagonal = d3.svg.diagonal()
		    .projection(function(d) { return [d.x, d.y]; });

		var pathString;
		var linkNodes = links.map( (d, i) => {
			pathString = `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
			return <path key={"pNode" + i} d={pathString} fill="none" stroke="black" />;
		});
		
		return (
			<svg width={width} height={height + LABEL_HEIGHT} ref="svg">
				{linkNodes}
			</svg>
		);
	},

	componentDidMount: function () { this._drawSvg },
	componentDidUpdate: function (prevProps, prevState) { if (prevProps !== this.props) this._drawSvg(); },

	_drawSvg: function () {
		var data = this.props.data;
		var width = this.props.width;
		var height = this.props.height;

		var dendoFn = d3.layout.cluster()
			.separation( function (a,b) {
				return 1;
			})
			.size([width, height]);
		var nodesData = dendoFn.nodes(data);
		var linksData = dendoFn.links(nodesData);
		var diagonal = d3.svg.diagonal()
		    .projection(function(d) { return [d.x, d.y]; });

		// traditional d3 rendering
		var sel = d3.select(this.refs.svg.getDOMNode());

		var labelsData = _.where(nodesData, { isLeaf: true });
		var labels = sel.selectAll(".dendro-label").data(labelsData, function (d) { return d.value.name; });
		labels.enter().append("text")
			.attr({
				class: "dendro-label",
				transform: this._transform
			})
			.text( function (d) {
				return d.value.name;
			});
		labels.transition().duration(1000)
			.attr({
				transform: this._transform
			})
		labels.exit().remove();
		// var links = sel.selectAll(".sgd-dendro-link").data(linksData);
		// links.enter().append("path").attr({
		// 	class: "sgd-dendro-link",

		// })

	},

	_transform: function (d) {
		return `translate(${d.x - 5}, ${d.y})rotate(90)`;
	}
});

var LABEL_HEIGHT = 70;

module.exports = Dendrogram;
