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
	}

	setOnReceiveLociDataCb (_newCb) {
		onReceiveLociDataCb = _newCb;
	}

	// *** accessors ***
	getQuery () { return query; }

	getLociData () { return lociData; }

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

	// *** fetchers ***

	// cb(err, data)
	fetchSearchResults (cb) {
		var url = `${LOCI_SEARCH_BASE_URL}?query=${query}`;
		$.getJSON(url, data => {
			var loci = data.loci;
			var total = data.total;
			lociData = loci;

			// TODO, clusters
			
			cb(null, data);
		});
	}
};
