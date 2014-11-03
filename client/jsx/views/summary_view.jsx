/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var _ = require("underscore");
var google = require("google");
var React = require("react");

var AsyncSequenceView = require("../components/sequence/async_sequence_view.jsx");
var ExpressionChart = require("../components/viz/expression_chart.jsx");
var HistoryTable = require("../components/sequence/history_table.jsx");
var NavBar = require("../components/widgets/navbar.jsx");
var ReferenceList = require("../components/literature/reference_list.jsx");
var TabsModel = require("../models/tabs_model.jsx");


var summaryView = {};
summaryView.render = function () {
	var locusData = bootstrappedData.locusData;
	var hasHistory = _.where(locusData.history, { history_type: "LSP" }).length;

	document.getElementById("summary_tab").className += " active";

	// navbar
	var _tabModel = new TabsModel({
		hasHistory: hasHistory,
		hasParagraph: locusData.paragraph,
		hasPathways: locusData.pathways.length,
		hasResources: true,
		rawTabsData: bootstrappedData.tabs,
		tabType: "summary"
	});
	var _navTitleText = _tabModel.getNavTitle(bootstrappedData.displayName, bootstrappedData.formatName);
	var _navTitle = { name: _navTitleText, href: bootstrappedData.locusLink };
	React.renderComponent(
		<NavBar title={_navTitle} elements={_tabModel.getTabElements()} />,
		document.getElementById("navbar-container")
	);

	var fetchAndRenderHistory = () => {
	// TEMP experiment with expression data
		$.getJSON('/backend/locus/' + bootstrappedData.locusId + '/expression_details?callback=?', function(data) {
			if (data.datasets.length) {
				React.renderComponent(
					<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} />,
					document.getElementById("two_channel_expression_chart")
				);
			}
	  	});
	};

	// async sequence (if needed)
	if (bootstrappedData.tabs && bootstrappedData.tabs.sequence_tab) {
		var _geneticPosition = locusData.genetic_position ? (locusData.genetic_position + " cM") : null;
		React.renderComponent(
			<AsyncSequenceView
				locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
				locusFormatName={bootstrappedData.formatName} locusHistoryData={locusData.history}
				showAltStrains={false} showOtherStrains={false} showHistory={false} isSimplified={true}
				detailsCallback={fetchAndRenderHistory} geneticPosition={_geneticPosition}
			/>,
			document.getElementById("sequence-viz")
		);
	}

  	// summary paragraph
  	if(locusData.paragraph) {
        document.getElementById("summary_paragraph").innerHTML = locusData.paragraph.text;
    }

    // history (if needed)
    if (hasHistory) {
    	React.renderComponent(
    		<HistoryTable data={locusData.history} dataType="LSP" />,
    		document.getElementById("history_target")
    	);
    }

    // reference list
    React.renderComponent(
    	<ReferenceList data={locusData.references}/>,
    	document.getElementById("reference")
    );
};

module.exports = summaryView;
