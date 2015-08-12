/** @jsx React.DOM */
"use strict";
var _ = require("underscore");
var $ = require("jquery");

var LOCI_SEARCH_BASE_URL = "/search_sequence_objects";

// internal data
var isApiError = false;
var lociData = [];
var clusteredStrainData = null;
var isProteinMode = false;
var query = "";
var visibleLociData = null;
var visibleStrainIds = []; // TEMP

// action callbacks
var onSetQueryCb = function (_query) { return null };
var onReceiveLociDataCb = function (_loci) { return null };

module.exports = class VariantViewerStore {

	// *** mutators ***
	setQuery (newQuery) {
		query = newQuery;
		onSetQueryCb(query);
		this.searchLoci();
	}

	setOnReceiveLociDataCb (_newCb) {
		onReceiveLociDataCb = _newCb;
	}

	// *** accessors ***
	getQuery () { return query; }

	getLociData () { return lociData; }

	// *** fetchers ***
	searchLoci () {
		var url = `${LOCI_SEARCH_BASE_URL}?query=${query}`;
		$.getJSON(url, data => {
			var loci = data.loci;
			var total = data.total;
			lociData = loci;

			// TODO, clusters
			onReceiveLociDataCb(loci);
		});
	}
};
