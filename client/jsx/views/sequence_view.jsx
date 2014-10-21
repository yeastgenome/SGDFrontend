/** @jsx React.DOM */
"use strict";

var React = require("react");

var NavBar = require("../components/navbar.jsx");
var AsyncSequenceView = require("../components/sequence/async_sequence_view.jsx");

var sequenceView = {};
sequenceView.render = function () {

	// set current tab
	document.getElementById("sequence_tab").id = "current";

	// define render nav bar function
	var renderNavBar = function (hasAltStrains, hasOtherStrains) {
		var altElement = hasAltStrains ? { name: "Alternative Reference Strains", target: "alternative" } : null;
		var otherElement = hasOtherStrains ? { name: "Other Strains", target: "other" } : null;

		var navTitle = { href: bootstrappedData.locusLink, name: ( bootstrappedData.formatName === bootstrappedData.displayName ? bootstrappedData.displayName : `${bootstrappedData.displayName} / ${bootstrappedData.formatName}`) };
		var navElements = [
			{ name: "Sequence Overview", target: "overview" },
			{ name: "Reference Strain: S288C", target: "reference" },
			altElement,
			otherElement,
			{ name: "History", target: "history" },
			{ name: "Resources", target: "resources" }
		];
		React.renderComponent(
			<NavBar title={navTitle} elements={navElements} />,
			document.getElementsByClassName("navbar-container")[0]
		);
	};

	// render navbar with alt & other strain info
	var _detailsCallback = (err, detailsModel) => {
		renderNavBar(detailsModel.attributes.altStrains.length, detailsModel.attributes.otherStrains.length);
	};

	// async sequence view, fetches data, renders main strain, alt strains, and other strains (if present)
	// once data is fetched, update the navbar
	React.renderComponent(
		<AsyncSequenceView
			locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
			locusFormatName={bootstrappedData.formatName} locusHistoryData={bootstrappedData.locusHistory}
			detailsCallback={_detailsCallback}
		/>,
		document.getElementById("sequence-viz")
	);
};

module.exports = sequenceView;
