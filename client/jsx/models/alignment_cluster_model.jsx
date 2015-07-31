/** @jsx React.DOM */
"use strict";
var clusterfck = require("clusterfck");
var _ = require("underscore");

module.exports = class AlignmentClusterModel {

	clusterFeatures (data) {
		var rawScores = data.map(d => {
			return d.dna_scores;
		});
		// transpose
		var transposedScores = rawScores[0].map(function(col, i) { 
			var strainScores = rawScores.map(function(row, _i) { 
				return row[i] 
			});

			return {
				name: "Strain " + i,
				scores: strainScores
			};
		});
		var clusters = clusterfck.hcluster(transposedScores);

		return this.reformatCluster(clusters);
	}

	// put in d3 cluster layout format
	reformatCluster (obj) {
		if (!obj.left) {
			obj.isLeaf = true;
			return obj;
		} else {
			obj.isLeaf = false;
			obj.children = [this.reformatCluster(obj.left), this.reformatCluster(obj.left)];
			delete obj.left;
			delete obj.right;
			return _.clone(obj);
		}
	}

};
