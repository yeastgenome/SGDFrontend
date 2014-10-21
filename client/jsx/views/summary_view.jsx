/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var google = require("google");
var React = require("react");

var ExpressionChart = require("../components/viz/expression_chart.jsx");

var summaryView = {};
summaryView.render = function () {
	document.getElementById("summary_tab").id = "current";

	// TEMP experiment with expression data
	$.getJSON('/backend/locus/' + locus['id'] + '/expression_details?callback=?', function(data) {
		React.renderComponent(
			<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} />
			, document.getElementById("two_channel_expression_chart")
		);
  	});
};

module.exports = summaryView;
