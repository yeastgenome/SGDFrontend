import React from "react";
import ReactDOM from "react-dom";

import NavBar from "../components/widgets/navbar.jsx";
import AsyncSequenceView from "../components/sequence/async_sequence_view.jsx";
import TabsModel from "../models/tabs_model.jsx";

var sequenceView = {};
sequenceView.render = function () {

  // set current tab
  document.getElementById("sequence_tab").className += " active";

  // define render nav bar function
  var renderNavBar = function (hasAltStrains, hasOtherStrains) {
    var _tabModel = new TabsModel({
      tabType: "sequence",
      hasAltStrains: hasAltStrains,
      hasOtherStrains: hasOtherStrains,
    });
    var _navTitleText = _tabModel.getNavTitle(bootstrappedData.displayName, bootstrappedData.formatName);
    ReactDOM.render(
      <NavBar title={_navTitleText} elements={_tabModel.getTabElements()} />,
      document.getElementById("navbar-container")
    );
  };

  // render navbar with alt & other strain info
  var _detailsCallback = (err, detailsModel) => {
    renderNavBar(detailsModel.attributes.altStrains.length, detailsModel.attributes.otherStrains.length);
  };

  // async sequence view, fetches data, renders main strain, alt strains, and other strains (if present)
  // once data is fetched, update the navbar
  var _showVariants = bootstrappedData.featureType === 'ORF';
  ReactDOM.render(
    <AsyncSequenceView
      locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
      locusFormatName={bootstrappedData.formatName} locusHistoryData={bootstrappedData.locusHistory}
      detailsCallback={_detailsCallback} locusSGDID={bootstrappedData.sgdid} showVariants={_showVariants}
    />,
    document.getElementById("sequence-viz")
  );
};

export default sequenceView;
