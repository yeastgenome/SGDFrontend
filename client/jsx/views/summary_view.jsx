import $ from "jquery";
import _ from "underscore";
import React from "react";
import ReactDOM from "react-dom";

import AsyncSequenceView from "../components/sequence/async_sequence_view.jsx";
import ExpressionChart from "../components/viz/expression_chart.jsx";
import HistoryTable from "../components/sequence/history_table.jsx";
import NavBar from "../components/widgets/navbar.jsx";
import ReferenceList from "../components/literature/reference_list.jsx";
import TabsModel from "../models/tabs_model.jsx";

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
    hasComplexes: locusData.complexes.length,
    hasResources: hasResources,
    hasReferences: hasReferences,
    rawTabsData: bootstrappedData.tabs,
    tabType: "summary"
  });
  var _navTitleText = _tabModel.getNavTitle(bootstrappedData.displayName, bootstrappedData.formatName);
  ReactDOM.render(
    <NavBar title={_navTitleText} elements={_tabModel.getTabElements()} />,
    document.getElementById("navbar-container")
  );

	var fetchAndRenderHistory = () => {
    let sgdid = bootstrappedData.locusData.sgdid;
    let expUrl = `https://s3-us-west-2.amazonaws.com/sgd-prod-expression-details/${sgdid}.json`;
		$.getJSON(expUrl, function(data) {
			if (data.datasets.length) {
				var _onExpressionClick = () => {
					window.location.href = "/locus/" + bootstrappedData.locusId + "/expression";
				};
				ReactDOM.render(
					<ExpressionChart data={data.overview} minValue={data.min_value} maxValue={data.max_value} onClick={_onExpressionClick} />,
					document.getElementById("two_channel_expression_chart")
				);
			}
	  	});
	};

  // async sequence (if needed)
  if (bootstrappedData.tabs && bootstrappedData.tabs.sequence_section) {
    var _geneticPosition = locusData.genetic_position ? (locusData.genetic_position + " cM") : null;
    ReactDOM.render(
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
      ReactDOM.render(
        <HistoryTable data={locusData.history} dataType="LSP" />,
        document.getElementById("history_target")
      );
    }

    // reference list
    if (hasReferences) {
      ReactDOM.render(
        <ReferenceList data={locusData.references}/>,
        document.getElementById("reference")
      );
    }
};

export default summaryView;
