/** @jsx React.DOM */
"use strict";
var _ = require("underscore");
var $ = require("jquery");

var ClusterStrainsWorker = require("./cluster_strains.jsx");
var staticStrainMetadata = require("./strain_metadata");
var work = require("webworkify");

var LOCI_SEARCH_BASE_URL = "/search_sequence_objects";
var LOCUS_SHOW_BASE_URL = "/get_sequence_object";
var REFERENCE_STRAIN_ID = 1;

// internal data, initial state
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
var sortBy = "position"; // or "entropy"

module.exports = class VariantViewerStore {

	// *** mutators ***
	setQuery (newQuery) {
		query = newQuery;
		return;
	}

	// cb(err)
	setVisibleStrainIds (_visibleStrainIds, cb) {
		// must contain reference
		if (_visibleStrainIds.indexOf(REFERENCE_STRAIN_ID) < 0) _visibleStrainIds.push(REFERENCE_STRAIN_ID);
		_visibleStrainIds = _.sortBy(_visibleStrainIds, d => { return d.id });
		visibleStrainIds = _visibleStrainIds;
		if (typeof cb === "function") return this.clusterStrains(cb);
		return;
	}

	setIsProteinMode (_isProteinMode) { isProteinMode = _isProteinMode; return; }

	setSortBy (_sortBy) {
		sortBy = _sortBy;
		this.sortLoci();
		return;
	}

	sortLoci () {
		var sortFn;
		// reference genetic position
		if (sortBy === "position") {
			sortFn = d => {
				return d.absolute_genetic_start;
			};
		// entropy
		} else {
			sortFn = (d, _i) => {
				var n;
				var sigma = 0;
				for (var i = d.dna_scores.length - 1; i >= 0; i--) {
					n = d.dna_scores[i];
					if(typeof n === "number") sigma += n * (Math.log(n) / Math.log(2));
				};
				return sigma;
			};
		}
		allLociData = _.sortBy(allLociData, sortFn);
		filteredlociData = _.sortBy(filteredlociData, sortFn);
		return;
	}

	zoomHeatmap (isIn) {
		heatmapZoom += isIn;
		heatmapZoom = Math.max(1, heatmapZoom);
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
				data: sorted,
				href: d.href
			}
		});
	}

	getHeatmapStrainData () {
		var strainMeta;
		return visibleStrainIds
			.map( d => {
				strainMeta = _.findWhere(strainMetaData, { id: d });
				return {
					name: strainMeta.display_name,
					id: strainMeta.id
				};
			});
	}

	getHeatmapZoom () { return heatmapZoom; }

	getVisibleStrainIds () { return visibleStrainIds; }

	getSortBy () { return sortBy; }

	getStrainMetaData () { return staticStrainMetadata.strains; }

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
		this.setVisibleStrainIds(strainMetaData.map( d => { return d.id; }));
		var quickUrl = `${LOCI_SEARCH_BASE_URL}?limit=200`;
		var longUrl = `${LOCI_SEARCH_BASE_URL}?limit=6500`;
		$.getJSON(quickUrl, data => {
			totalLoci = data.total;
			allLociTotal = data.total;
			allLociData = data.loci;
			if (typeof cb === "function") cb(null);
			$.getJSON(longUrl, data => {
				allLociData = data.loci;
				this.sortLoci();
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
			this.sortLoci();
			if (typeof cb === "function") return cb(null, data);
			return;
		});
	}

	// cb(err, data)
	fetchLocusData (id, cb) {
		var url = `${LOCUS_SHOW_BASE_URL}/${id}`;
		$.getJSON(url, data => {
			return cb(null, data);
		});
	}

	// cb (err)
	clusterStrains (cb) {
		// initial state, use precalculated cluster
		if (query === "" && visibleStrainIds.length === staticStrainMetadata.strains.length) {
			clusteredStrainData = staticStrainMetadata.clusterData;
		} else {
			var visibleStrainMetaData = visibleStrainIds
				.map( d => {
					return _.findWhere(strainMetaData, { id: d });
			});

			// web worker setup
			var clusterWorker = work(ClusterStrainsWorker);
			// attach results to cb
			clusterWorker.addEventListener("message", ev => {
				var _clusteredStrainData = JSON.parse(ev.data);
				clusteredStrainData = _clusteredStrainData;
				strainClusterIndexes = this.getStrainIndexes(clusteredStrainData);
				cb(null);
			});
			// config and run
			var configObj = {
				lociData: this.getLociData(),
				strainData: visibleStrainMetaData
			};
			var configObjStr = JSON.stringify(configObj);
			clusterWorker.postMessage(configObjStr);
		}
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
