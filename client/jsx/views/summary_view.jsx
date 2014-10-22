/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var _ = require("underscore");
var google = require("google");
var React = require("react");

var AsyncSequenceView = require("../components/sequence/async_sequence_view.jsx");
var ExpressionChart = require("../components/viz/expression_chart.jsx");
var HistoryTable = require("../components/sequence/history_table.jsx");
var ReferenceList = require("../components/literature/reference_list.jsx");

var summaryView = {};
summaryView.render = function () {
	document.getElementById("summary_tab").id = "current";

	// async sequence view, fetches data, renders main strain, alt strains, and other strains (if present)
	// once data is fetched, update the navbar
	React.renderComponent(
		<AsyncSequenceView
			locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
			locusFormatName={bootstrappedData.formatName} locusHistoryData={bootstrappedData.locusHistory}
			showAltStrains={false} showOtherStrains={false} showHistory={false} isSimplified={true}
		/>,
		document.getElementById("sequence-viz")
	);

	// TEMP experiment with expression data
	$.getJSON('/backend/locus/' + bootstrappedData.locusId + '/expression_details?callback=?', function(data) {
		if (data.datasets.length) {
			React.renderComponent(
				<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} />,
				document.getElementById("two_channel_expression_chart")
			);
		}
  	});

  	// summary paragraph
  	if(bootstrappedData.summaryParagraph) {
        document.getElementById("summary_paragraph").innerHTML = bootstrappedData.summaryParagraph;
    }

    // history (if needed)
    if (_.where(bootstrappedData.history, { history_type: "LSP" }).length) {
    	React.renderComponent(
    		<HistoryTable data={bootstrappedData.history} dataType="LSP" />,
    		document.getElementById("history_target")
    	);
    }

    // reference list
    React.renderComponent(
    	<ReferenceList data={bootstrappedData.references}/>,
    	document.getElementById("reference_list_target")
    );
};

module.exports = summaryView;
