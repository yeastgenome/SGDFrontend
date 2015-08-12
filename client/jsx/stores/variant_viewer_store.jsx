/** @jsx React.DOM */
"use strict";
var _ = require("underscore");
var $ = require("jquery");

var clusterStrains = require("./cluster_strains.jsx");

var LOCI_SEARCH_BASE_URL = "/search_sequence_objects";

// internal data
var isApiError = false;
var lociData = [];
var clusteredStrainData = null;
var isProteinMode = false;
var query = "";
var visibleLociData = null;
var visibleStrainIds = []; // TEMP

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
		// TEMP
		return [
			{
				name: "Foo",
				id: "foo123",
				data: [0.5, 0.1, 1, 0.75, 1]
			}
		];
	}

	getHeatmapStrainData() {
		// TEMP
		return [
			{ name: "strain1", id: 1 },
			{ name: "strain2", id: 2 },
			{ name: "strain3", id: 3 },
			{ name: "strain4", id: 4 },
			{ name: "strain5", id: 5 },
		]
	}

	// *** fetchers, calculators ***

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
		var _clustered = clusterStrains(this.getLociData());
		clusteredStrainData = _clustered;
		cb(null);
	}
};
