/** @jsx React.DOM */
"use strict";
var clusterfck = require("clusterfck");
var _ = require("underscore");

var STRAIN_NAMES = ["S288C", "X2180-1A", "SEY6210", "W303", "JK9-3d", "FL100", "CEN.PK", "D273-10B", "Sigma1278b", "RM11-1a", "SK1", "Y55"];

module.exports = class AlignmentClusterModel {

	clusterFeatures (data) {
		var rawScores = data.map(d => {
			return d.dna_scores;
		});
		// transpose
		var transposedScores = rawScores[0].map(function(col, i) { 
			var strainScores = rawScores.map(function(row, _i) { "X2180-1A"
				return row[i] 
			});

			return {
				name: STRAIN_NAMES[i],
				scores: strainScores
			};
		});

		var distanceFn = function (a, b) {
			var sum = 0;
			var k
			a.scores.forEach( function (j, i) {
				k = b.scores[i];
				if (typeof j === "number" && typeof k === "number") {
					sum += Math.abs(j - k);
				}
			});
			return sum;
		};
		var clusters = clusterfck.hcluster(transposedScores, distanceFn);

		return this.reformatCluster(clusters);
	}

	// put in d3 cluster layout format
	reformatCluster (obj) {
		if (!obj.left) {
			obj.isLeaf = true;
			return obj;
		} else {
			obj.isLeaf = false;
			obj.children = [this.reformatCluster(obj.left), this.reformatCluster(obj.right)];
			delete obj.left;
			delete obj.right;
			return _.clone(obj);
		}
	}

};
