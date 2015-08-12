/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");

var Dendrogram = React.createClass({
	propTypes: {
		width: React.PropTypes.number,
		height: React.PropTypes.number,
		data:  React.PropTypes.object
	},

	getDefaultProps: function () {
		return {
			width: 200,
			height: 200
		};
	},

	render: function () {
		var data = this.props.data;
		if (!data) return null;

		var width = this.props.width;
		var height = this.props.height;
		var labelHeight = 70;
		var dendoFn = d3.layout.cluster()
			.separation( function (a,b) {
				return 1;
			})
			.size([width, height]);

		var nodes = dendoFn.nodes(data);
		var links = dendoFn.links(nodes);
		var diagonal = d3.svg.diagonal()
		    .projection(function(d) { return [d.x, d.y]; });

		var _transform, _fill;
		var nodesNodes = nodes.map( (d, i) => {
			_transform = `translate(${d.x}, ${d.y})`;
			var textNode = d.isLeaf ? <text transform="rotate(90)">{d.value.name}</text> : null;
			return (<g key={"dendoNode" + i} transform={_transform}>
				{textNode}
			</g>)
		});

		var pathString;
		var linkNodes = links.map( (d, i) => {
			pathString = `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
			return <path key={"pNode" + i} d={pathString} fill="none" stroke="black" />;
		});
		
		return (
			<svg width={width} height={height + labelHeight}>
				{nodesNodes}
				{linkNodes}
			</svg>
		);
	}
});

module.exports = Dendrogram;
