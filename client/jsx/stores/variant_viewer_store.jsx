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
var strainClusterIndexes = null;
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
		// first, create array of indexes for cluster sorted data
		var strainObj;
		var indexArr = strainClusterIndexes.map( _id => {
			strainObj = _.findWhere(strainMetaData, { id: _id } );
			return strainMetaData.indexOf(strainObj);
		});

		var unsorted, sorted;
		return lociData.map( d => {
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
			strainMetaData = data.strains.map( d => {
				return {
					name: d.display_name,
					id: d.id,
					href: d.link
				};
			});
			visibleStrainIds = strainMetaData.map( d => { return d.id; });
			var url = `${LOCI_SEARCH_BASE_URL}`;
			$.getJSON(url, data => {
				lociData = data.loci;
				this.clusterStrains( err => {
					if (typeof cb === "function") cb(null);
				})
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
		var _clustered = clusterStrains(this.getLociData(), strainMetaData);
		var end = new Date().getTime();
		clusteredStrainData = _clustered;
		strainClusterIndexes = this.getStrainIndexes(clusteredStrainData);
		cb(null);
	}

	// save the order of the strains in the dendro cluster object so that heatmap can 
	getStrainIndexes (clustered, indexes) {
		if (typeof indexes === "undefined") indexes = [];

		// found a leaf, put in indexes and return
		if (!clustered.children) {
			indexes.push(clustered.value.id);
			return indexes
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
