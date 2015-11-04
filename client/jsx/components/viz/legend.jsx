
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	// i.e. elements [{ text: "Audi", color: "#ccc" }]
	getDefaultProps: function () {
		return {
			labelText: null,
			elements: []
		};
	},

	render: function () {

		var labelText = this.props.labelText ? <span className="legend-entry-container">{this.props.labelText}</span> : null;
		var elementNodes = _.map(this.props.elements, (entry, i) => {
			var textNode = entry.href ? <a href={entry.href}>{entry.text}</a> : entry.text;
			return (
				<div className="legend-entry-container" key={`legend${i}`} style={{ display: "inline-block" }}>
					<div className="legend-color" style={{ background: entry.color }}></div>
					{textNode}
				</div>
			);
		});

		return (
			<div className="viz-legend">
				{labelText}
				{elementNodes}
			</div>
		);
	}

});
