/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			elements: [],			
			leftRatio: null
		};
	},

	render: function () {

		var strandLabel = "Fwd: >>  Rev: <<";  
		var labelText = <span className="legend-entry-container" style={{marginLeft: `${this.props.leftRatio * 200}%`, marginRight: `${this.props.leftRatio * 25}%`, position: "relative"}}>{strandLabel}</span>

		var elementNodes = _.map(this.props.elements, (entry, i) => {
			var expLabel = "";
			if (i == 0) {
			     expLabel = "Neg P Exponent: ";
			}
			return (<div className="legend-entry-container" key={`legend${i}`} style={{ display: "inline-block" }}>
			                {expLabel}
                                        <div className="legend-color" style={{ opacity: 0.5, background: entry.color }}></div>
                                        {entry.text}
                        </div>);
		});

		var today = new Date();
		var day = today.getDate();
		var month = today.getMonth()+1; // January is 0!
		var year = today.getFullYear();
		if (day < 10) {
		    day = '0' + day;
		}
		if (month < 10) {
		    month = '0' + month;
		}
		today = year + "-" + month + "-" + day;
		var dateString = "SGD " + today;
		var dateText = <span className="legend-entry-container" style={{marginLeft: `${this.props.leftRatio * 25}%`, marginRight: `${this.props.leftRatio * 200}%`, position: "relative"}}>{dateString}</span>

		return (
			<div className="viz-legend">
				{labelText}
				{elementNodes}
				{dateText}
			</div>
		);
	}

});
