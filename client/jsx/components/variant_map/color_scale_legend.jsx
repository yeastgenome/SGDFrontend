/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var HelpIcon = require("../widgets/help_icon.jsx");

var NUM_BOXES = 5;
var NODE_SIZE = 17;

var ColorScaleLegend = React.createClass({

	render: function () {
		var colorScale = d3.scale.linear()
			.domain([1, 0])
			.range(["#C2E3F6", "black"]);

		var _borderStyle = "1px solid #e1e1e1";
		var boxNodes = new Array(NUM_BOXES)
			.join().split(",")
			.map( (d, i) => {
				var _score = 1 - i / (NUM_BOXES - 1);
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

		var _helpText = "Alignment Scores represent the similarity of each gene in each strain relative to the S288C reference genome. A score of 1 indicates that the sequence of that gene in that is identical to that of S288C. A score of 0 indicates no similarity. Darker colors indicate more differences than lighter colors. A white square (N/A) indicates that no sequence data are available for that gene in that strain.";
		return (<div>
			<p style={{ marginBottom: 0 }}>Alignment Score <HelpIcon text={_helpText} /></p>
			<span>1.00</span>
			<div style={{ margin: "0 1rem", display: "inline-block", position: "relative", top: 3 }}>
				{boxNodes}
			</div>
			<span>0.00</span>
			<div>
				<span>N/A</span>
				<div style={{ margin: "0 1rem", display: "inline-block", position: "relative", top: 3, left: 3, width: NODE_SIZE -2 , height: NODE_SIZE - 2, background: "white", border: _borderStyle }} />
			</div>
		</div>);
	}
});

module.exports = ColorScaleLegend;
