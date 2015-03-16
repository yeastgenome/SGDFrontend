/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var _ = require("underscore");
var React = require("react");

var AsyncSequenceView = React.createFactory(require("../components/sequence/async_sequence_view.jsx"));
var ExpressionChart = React.createFactory(require("../components/viz/expression_chart.jsx"));
var HistoryTable = React.createFactory(require("../components/sequence/history_table.jsx"));
var NavBar = React.createFactory(require("../components/widgets/navbar.jsx"));
var ReferenceList = React.createFactory(require("../components/literature/reference_list.jsx"));
var TabsModel = require("../models/tabs_model.jsx");

var summaryView = {};
summaryView.render = function () {
	var locusData = bootstrappedData.locusData;
	var hasHistory = _.where(locusData.history, { history_type: "LSP" }).length;
	var hasResources = _.where(locusData.urls, { category: "LOCUS_LSP" }).length;
	var hasReferences = locusData.references.length;

	document.getElementById("summary_tab").className += " active";

	// navbar
	var _tabModel = new TabsModel({
		hasHistory: hasHistory,
		hasParagraph: locusData.paragraph,
		hasPathways: locusData.pathways.length,
		hasResources: hasResources,
		hasReferences: hasReferences,
		rawTabsData: bootstrappedData.tabs,
		tabType: "summary"
	});
	var _navTitleText = _tabModel.getNavTitle(bootstrappedData.displayName, bootstrappedData.formatName);
	var _navTitle = { name: _navTitleText, href: bootstrappedData.locusLink };
	React.render(
		<NavBar title={_navTitle} elements={_tabModel.getTabElements()} />,
		document.getElementById("navbar-container")
	);

	var fetchAndRenderHistory = () => {
		$.getJSON('/backend/locus/' + bootstrappedData.locusId + '/expression_details?callback=?', function(data) {
			if (data.datasets.length) {
				var _onExpressionClick = () => {
					window.location.href = "/locus/" + bootstrappedData.locusId + "/expression";
				};
				React.render(
					<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} onClick={_onExpressionClick} />,
					document.getElementById("two_channel_expression_chart")
				);
			}
	  	});
	};

	// async sequence (if needed)
	if (bootstrappedData.tabs && bootstrappedData.tabs.sequence_section) {
		var _geneticPosition = locusData.genetic_position ? (locusData.genetic_position + " cM") : null;
		React.render(
			<AsyncSequenceView
				locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
				locusFormatName={bootstrappedData.formatName} locusHistoryData={locusData.history}
				showAltStrains={false} showOtherStrains={false} showHistory={false} isSimplified={true}
				detailsCallback={fetchAndRenderHistory} geneticPosition={_geneticPosition} locusSGDID={bootstrappedData.locusData.sgdid}
			/>,
			document.getElementById("sequence-viz")
		);
	} else if (bootstrappedData.tabs.expression_tab) {
		fetchAndRenderHistory();
	}

  	// summary paragraph
  	if(locusData.paragraph) {
        document.getElementById("summary_paragraph").innerHTML = locusData.paragraph.text;
    }

    // history (if needed)
    if (hasHistory) {
    	React.render(
    		<HistoryTable data={locusData.history} dataType="LSP" />,
    		document.getElementById("history_target")
    	);
    }

    // reference list
    if (hasReferences) {
    	React.render(
	    	<ReferenceList data={locusData.references}/>,
	    	document.getElementById("reference")
	    );
    }
};

module.exports = summaryView;
