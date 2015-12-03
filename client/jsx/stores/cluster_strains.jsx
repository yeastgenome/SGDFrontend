
"use strict";
var clusterfck = require("clusterfck");
var _ = require("underscore");


var STRAIN_NAMES = ["S288C", "X2180-1A", "SEY6210", "W303", "JK9-3d", "FL100", "CEN.PK", "D273-10B", "Sigma1278b", "RM11-1a", "SK1", "Y55"];

// configObject { lociData, strainData }
var ClusterStrains = function (configObject) {
	var data = configObject.lociData;
	var strainMetaData = configObject.strainData;
	var rawSnpSeqs = data.map(d => {
		return d.snp_seqs;
	});

	// transpose to get array of strains with snp_sequence
	var strainsSnpSequences = strainMetaData.map(function(strain, i) { 
		var strainSnps = rawSnpSeqs.map(function(row, _i) {
			return row[i] 
		});

		// for each gene, find the strains snp sequence and add
		var strainGeneObj;
		var snpSeq = rawSnpSeqs.reduce(function(memo, gene) {
			strainGeneObj = gene[i];
			if (!strainGeneObj) return memo;
			memo += strainGeneObj.snp_sequence;
			return memo;
		}, "");
		return {
			name: strain.name,
			snpSequence: snpSeq,
			id: strain.id
		};
	});

	// get distance between two objects with key snpSequence
	var distanceFn = function (a, b) {
		var sum = 0;
		var k;
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

	return _reformatCluster(clusters);
}

// recursively put in d3 cluster layout format
var _reformatCluster = function (obj) {
	if (!obj.left) {
		obj.isLeaf = true;
		obj.value.snpSequence = null;
		return obj;
	} else {
		obj.isLeaf = false;
		obj.children = [_reformatCluster(obj.left), _reformatCluster(obj.right)];
		delete obj.left;
		delete obj.right;
		return _.clone(obj);
	}
};

// wrap as web worker
module.exports = function (self) {
	self.addEventListener('message', function (ev) {
		var configObject = JSON.parse(ev.data);
		var clusteredData = ClusterStrains(configObject);
		var clusteredDataStr = JSON.stringify(clusteredData);
		self.postMessage(clusteredDataStr);
	});
};
