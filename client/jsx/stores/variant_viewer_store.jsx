/** @jsx React.DOM */
"use strict";
var _ = require("underscore");
var $ = require("jquery");

var clusterStrains = require("./cluster_strains.jsx");

var ALIGNMENT_INDEX_URL = "/backend/alignments";
var LOCI_SEARCH_BASE_URL = "/search_sequence_objects";

// internal data
var isApiError = false;
var lociData = [];
var allLociData = [];
var clusteredStrainData = null;
var isProteinMode = false;
var query = "";
var strainMetaData = [];
var visibleLociData = null;
var visibleStrainIds = null;

module.exports = class VariantViewerStore {

	// *** mutators ***
	setQuery (newQuery) {
		query = newQuery;
	}

	// *** accessors ***
	getQuery () { return query; }

	getLociData () { return lociData; }

	getClusteredStrainData () { return clusteredStrainData; }

	getHeatmapData () {
		return lociData.map( d => {
			return {
				name: d.name,
				id: d.sgdid,
				data: (isProteinMode ? d.protein_scores : d.dna_scores)
			}
		});
	}

	getHeatmapStrainData() {
		return strainMetaData.map( d => {
			return {
				name: d.display_name,
				id: d.id
			};
		});
	}

	// *** fetchers, calculators ***

	// cb (err) gets called twice
	fetchInitialData (cb) {
		var firstFetchUrl = `${ALIGNMENT_INDEX_URL}?limit=50`;
		var secondFetchUrl = ALIGNMENT_INDEX_URL;
		$.getJSON(firstFetchUrl, data => {
			strainMetaData = data.strains;
			visibleStrainIds = strainMetaData.map( d => { return d.id; });
			if (typeof cb === "function") cb(null);
			$.getJSON(secondFetchUrl, data => {
				if (typeof cb === "function") cb(null);
			});
		});
	}

	// cb(err, data)
	fetchSearchResults (cb) {
		var url = `${LOCI_SEARCH_BASE_URL}?query=${query}`;
		$.getJSON(url, data => {
			var loci = data.loci;
			var total = data.total;
			lociData = loci;		
			cb(null, data);
		});
	}

	// cb (err)
	clusterStrains (cb) {
		var start = new Date().getTime();
		var _clustered = clusterStrains(this.getLociData());
		var end = new Date().getTime();
		clusteredStrainData = _clustered;
		cb(null);
	}
};
