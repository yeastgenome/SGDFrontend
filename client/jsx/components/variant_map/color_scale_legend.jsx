/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var HelpIcon = require("../widgets/help_icon.jsx");

var NUM_BOXES = 5;
var NODE_SIZE = 17;

module.exports = React.createClass({


	render: function () {
		var colorScale = d3.scale.linear()
			.domain([0, 1])
			.range(["blue", "white"]);

		var _borderStyle = "1px solid #e1e1e1";
		var boxNodes = new Array(NUM_BOXES)
			.join().split(",")
			.map( (d, i) => {
				var _score = i / (NUM_BOXES - 1);
				var _style = {
					background: colorScale(_score),
					display: "inline-block",
					width: NODE_SIZE,
					height: NODE_SIZE,
					border: _borderStyle,
					borderLeft: (i === 0) ? _borderStyle : "none"
				};
				return <div key={"legendNode" + i} style={_style} />;
			});

		var _helpText = "The alignment score is computed by finding percentage of nucleotides in a sequence that differ relative to the same feature in S288C.";
		return (<div>
			<p style={{ marginBottom: 0 }}>Alignment Score <HelpIcon text={_helpText} /></p>
			<span>1.00</span>
			<div style={{ margin: "0 1rem", display: "inline-block", position: "relative", top: 3 }}>
				{boxNodes}
			</div>
			<span>0.00</span>
		</div>);
	}
});
