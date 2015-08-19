/** @jsx React.DOM */
"use strict";
var _ = require("underscore");
var $ = require("jquery");

var clusterStrains = require("./cluster_strains.jsx");
var staticStrainMetadata = require("./strain_metadata");

var LOCI_SEARCH_BASE_URL = "/search_sequence_objects";

// internal data
var isApiError = false;
var allLociData = [];
var allLociTotal = 0;
var totalLoci = 0;
var filteredlociData = [];
var clusteredStrainData = null;
var strainClusterIndexes = null;
var isProteinMode = false;
var query = "";
var strainMetaData = [];
var visibleLocusData = null;
var visibleStrainIds = null;
var heatmapZoom = 16; // px per node

module.exports = class VariantViewerStore {

	// *** mutators ***
	setQuery (newQuery) {
		query = newQuery;
	}

	zoomHeatmap (isIn) {
		heatmapZoom += isIn;
	}

	// *** accessors ***
	getQuery () { return query; }

	getLociData () { return query === "" ? allLociData : filteredlociData; }

	getLocusData () { return visibleLocusData; }

	getClusteredStrainData () { return clusteredStrainData; }

	getHeatmapData () {
		// first, create array of indexes for cluster sorted data
		var strainObj;
		var indexArr = strainClusterIndexes.map( _id => {
			strainObj = _.findWhere(strainMetaData, { id: _id } );
			return strainMetaData.indexOf(strainObj);
		});

		var unsorted, sorted;
		return this.getLociData().map( d => {
			// sort heatmap nodes to match the dendrogram cluster
			unsorted = (isProteinMode ? d.protein_scores : d.dna_scores);
			sorted = indexArr.map( _d => {
				return unsorted[_d];
			});
			return {
				name: d.name,
				id: d.sgdid,
				data: sorted
			}
		});
	}

	getHeatmapStrainData () {
		return strainMetaData.map( d => {
			return {
				name: d.display_name,
				id: d.id
			};
		});
	}

	getHeatmapZoom () { return heatmapZoom; }

	getAllLociTotal () { return allLociTotal; }

	getTotal () { return totalLoci; }

	getNumVisibleLoci () {
		return Math.min(totalLoci, Math.round(SCROLL_CONTAINER_HEIGHT / heatmapZoom));
	}

	// *** fetchers, calculators ***

	// cb (err) gets called twice
	fetchInitialData (cb) {
		strainMetaData = staticStrainMetadata.strains;
		clusteredStrainData = staticStrainMetadata.clusterData;
		strainClusterIndexes = this.getStrainIndexes(clusteredStrainData);
		visibleStrainIds = strainMetaData.map( d => { return d.id; });
		var quickUrl = `${LOCI_SEARCH_BASE_URL}?limit=200`;
		var longUrl = `${LOCI_SEARCH_BASE_URL}?limit=6500`;
		$.getJSON(quickUrl, data => {
			totalLoci = data.total;
			allLociTotal = data.total;
			allLociData = data.loci;
			if (typeof cb === "function") cb(null);
			$.getJSON(longUrl, data => {
				allLociData = data.loci;
				if (typeof cb === "function") return cb(null);
				return;
			});
		});
	}

	// cb(err, data)
	fetchSearchResults (cb) {
		// if blank query, just exec callback
		if (query === "") {
			if (typeof cb === "function") return cb(null, allLociData);
			return;
		}
		var url = `${LOCI_SEARCH_BASE_URL}?query=${query}`;
		$.getJSON(url, data => {
			totalLoci = data.total;
			filteredlociData = data.loci;		
			if (typeof cb === "function") return cb(null, data);
			return;
		});
	}

	// cb (err)
	clusterStrains (cb) {
		if (query === "") {
			clusteredStrainData = staticStrainMetadata.clusterData;
		} else {
			var _clustered = clusterStrains(this.getLociData(), strainMetaData);
			clusteredStrainData = _clustered;
		}
		strainClusterIndexes = this.getStrainIndexes(clusteredStrainData);
		cb(null);
	}

	// save the order of the strains in the dendro cluster object so that heatmap can 
	getStrainIndexes (clustered, indexes) {
		if (typeof indexes === "undefined") indexes = [];

		// found a leaf, put in indexes and return
		if (!clustered.children) {
			indexes.push(clustered.value.id);
			return indexes;
		// non-leaf children
		} else {
			clustered.children.forEach( d => {
				var childIndexes = this.getStrainIndexes(d, indexes);
				indexes.concat(childIndexes);
			});
			return indexes;
		}
	}
};

var SCROLL_CONTAINER_HEIGHT = 800;
