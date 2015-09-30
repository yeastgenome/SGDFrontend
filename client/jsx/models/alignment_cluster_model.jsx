/** @jsx React.DOM */
"use strict";
var clusterfck = require("clusterfck");
var _ = require("underscore");

var STRAIN_NAMES = ["S288C", "X2180-1A", "SEY6210", "W303", "JK9-3d", "FL100", "CEN.PK", "D273-10B", "Sigma1278b", "RM11-1a", "SK1", "Y55"];

module.exports = class AlignmentClusterModel {

	clusterFeatures (data) {

		var rawSnpSeqs = data.map(d => {
			return d.snp_seqs;
		});

		// transpose to get array of strains with snp_sequence
		var strainsSnpSequences = rawSnpSeqs[0].map(function(col, i) { 
			var strainSnps = rawSnpSeqs.map(function(row, _i) {
				return row[i] 
			});

			// for each gene, find the strains snp sequence and add
			var strainGeneObj;
			var snpSeq = rawSnpSeqs.reduce(function(memo, gene) {
				strainGeneObj = gene[i];
				memo += strainGeneObj.snp_sequence
				return memo;
			}, "");

			return {
				name: STRAIN_NAMES[i],
				snpSequence: snpSeq
			};
		});

		// get distance between two objects with key snpSequence
		var distanceFn = function (a, b) {
			var sum = 0;
			var k
			var seqA = a.snpSequence;
			var seqB = b.snpSequence;
			var aChars = seqA.split("");
			var bChars = seqB.split("");
			aChars.forEach( function (j, i) {
				k = bChars[i];
				if (j !== k) {
					sum += 1 / seqA.length;
				}
			});
			return sum;
		};
		var clusters = clusterfck.hcluster(strainsSnpSequences, distanceFn);

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
