/** @jsx React.DOM */
"use strict";

var React = require("react");
var ProteinViewer = require("sgd_visualization").ProteinViewer;
var _ = require("underscore");

var proteinView = {};
proteinView.render = function (rawDomainData) {

	var rawLocusData = rawDomainData[0].locus;
	var locusData = _.extend(rawLocusData, {
		name: rawLocusData.display_name,
		href: rawDomainData.link,
		start: 1,
		end: 375
	});
	var domainData = _.map(rawDomainData, d => {
		d.domain.name = d.domain.display_name;
		d.source.name = d.source.display_name;
		return d;
	});

	React.render(<ProteinViewer data={domainData} locusData={locusData} />
	, document.getElementById("domain_chart"));

};

module.exports = proteinView;
