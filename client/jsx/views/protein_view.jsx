/** @jsx React.DOM */
"use strict";

var React = require("react");
var ProteinViewer = require("sgd_visualization").ProteinViewer;
var _ = require("underscore");

var proteinView = {};
proteinView.render = function (rawDomainData, locusLength) {

	var rawLocusData = rawDomainData[0].locus;
	var locusData = _.extend(rawLocusData, {
		name: rawLocusData.display_name,
		href: rawDomainData.link,
		start: 1,
		end: locusLength
	});
	var domainData = _.map(rawDomainData, (d, i) => {
		d.domain.name = d.domain.display_name;
		d.source.name = d.source.display_name;
		d.domain.href = d.domain.link;
		d.domain.id = `${d.domain.id}-${i}`;
		return d;
	});

	React.render(<ProteinViewer data={domainData} locusData={locusData} />
	, document.getElementById("domain_chart"));

};

module.exports = proteinView;
