/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");

var ExpressionChart = React.createFactory(require("../components/viz/expression_chart.jsx"));

var expressionView = {};
expressionView.render = function () {
	$.getJSON('/backend/locus/' + locus['id'] + '/expression_details?callback=?', (data) => {
		if (data.datasets.length) {

			// use filter_table(minValue, maxValue) method from expression_details.js
			var _onClick = null;
			if (filter_table) {
				_onClick = (minValue, maxValue) => { filter_table(minValue, maxValue); };
			}

			React.render(
				<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} hasScaleToggler={true} onClick={_onClick} hasHelpIcon={true}/>,
				document.getElementById("j-expression-chart-target")
			);
		} else {
			$("#expression_overview_panel").hide();
        	$("#expression_message").show();
		}
	});
};

module.exports = expressionView;
