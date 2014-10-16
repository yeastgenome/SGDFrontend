/** @jsx React.DOM */
"use strict";

var React = require("react");

var NavBar = require("../components/navbar.jsx");
var AsyncSequenceView = require("../components/sequence/async_sequence_view.jsx");

var sequenceView = {};
sequenceView.render = function () {

	// set current tab
	document.getElementById('sequence_tab').id = 'current';

	// render nav bar
	var navTitle = { href: bootstrappedData.locusLink, name: ( bootstrappedData.formatName === bootstrappedData.displayName ? bootstrappedData.displayName : `${bootstrappedData.displayName} / ${bootstrappedData.formatName}`) };
	var navElements = [
		{ name: "Sequence Overview", target: "overview" },
		{ name: "Reference Strain: S288C", target: "reference" },
		{ name: "Other Strains", target: "other" },
		{ name: "History", target: "history" },
		{ name: "Resources", target: "resources" }
	];
	React.renderComponent(
		<NavBar title={navTitle} elements={navElements} />,
		document.getElementsByClassName("navbar-container")[0]
	);

	// render locus neighbor diagram
	React.renderComponent(
		<AsyncSequenceView
			locusId={bootstrappedData.locusId} locusDisplayName={bootstrappedData.displayName}
			locusFormatName={bootstrappedData.formatName} locusHistoryData={bootstrappedData.locusHistory}
		/>,
		document.getElementById("sequence-viz")
	);
};

module.exports = sequenceView;
