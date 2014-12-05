/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");

var ExpressionChart = require("../components/viz/expression_chart.jsx");

var expressionView = {};
expressionView.render = function () {

	$.getJSON('/backend/locus/' + locus['id'] + '/expression_details?callback=?', (data) => {
		if (data.datasets.length) {
			React.renderComponent(
				<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} hasScaleToggler={true} />,
				document.getElementById("j-expression-chart-target")
			);
		} else {
			$("#expression_overview_panel").hide();
        	$("#expression_message").show();
		}
	});
};

module.exports = expressionView;
