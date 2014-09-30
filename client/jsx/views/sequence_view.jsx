/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");

var NavBar = require("../components/navbar.jsx");
var AsyncLocusDiagram = require("../components/async/async_locus_diagram.jsx");

var sequenceView = {};
sequenceView.render = function () {

	// set current tab
	document.getElementById('sequence_tab').id = 'current';

	// render nav bar
	var navTitle = { href: locus_link, name: ( format_name === display_name ? display_name : `${display_name} / ${format_name}`) };
	var navElements = [
		{ name: "Sequence Overview", target: "overview" },
		{ name: "Reference Strain: S288C", target: "reference" },
		{ name: "Other Strains", target: "other" },
		{ name: "Resources", target: "resources" }
	];
	React.renderComponent(
		<NavBar title={navTitle} elements={navElements} />,
		document.getElementsByClassName("navbar-container")[0]
	);

	// render locus neighbot diagram
	React.renderComponent(
		<AsyncLocusDiagram
			baseUrl="http://sgd-qa.stanford.edu/webservice" showSubFeatures={false}
			locusId={locus_id} focusLocusDisplayName={display_name}
		/>,
		document.getElementsByClassName("locus-neighbor-viz")[0]
	);

	React.renderComponent(
		<AsyncLocusDiagram
			baseUrl="http://sgd-qa.stanford.edu/webservice" showSubFeatures={true}
			locusId={locus_id} focusLocusDisplayName={display_name}
		/>,
		document.getElementsByClassName(" locus-subfeatures-viz")[0]
	);

};

module.exports = sequenceView;
