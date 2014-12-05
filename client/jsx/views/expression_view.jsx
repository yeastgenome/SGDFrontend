/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");

var ExpressionChart = require("../components/viz/expression_chart.jsx");

var expressionView = {};
expressionView.render = function () {

	$.getJSON('/backend/locus/' + locus['id'] + '/expression_details?callback=?', (data) => {
		React.renderComponent(
			<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} />,
			document.getElementById("j-expression-chart-target")
		);
	});
};

module.exports = expressionView;
