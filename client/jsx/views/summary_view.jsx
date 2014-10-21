/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var google = require("google");
var React = require("react");

var AsyncSequenceView = require("../components/sequence/async_sequence_view.jsx");
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

	// async sequence view, fetches data, renders main strain, alt strains, and other strains (if present)
	// once data is fetched, update the navbar
	React.renderComponent(
		<AsyncSequenceView
			locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
			locusFormatName={bootstrappedData.formatName} locusHistoryData={bootstrappedData.locusHistory}
			showAltStrains={false} showOtherStrains={false} showHistory={false}
		/>,
		document.getElementById("sequence-viz")
	);
};

module.exports = summaryView;
