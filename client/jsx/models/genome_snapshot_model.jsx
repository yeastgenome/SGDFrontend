/** @jsx React.DOM */
"use strict";

var BaseModel = require("./base_model.jsx");
var _ = require("underscore");

module.exports = class GenomeSnapshotModel extends BaseModel {

	// format data into chromosome feature map data, and table version
	parse (response) {
		var data = response;
		var _chromosomeData = data.columns.slice(0, 18);
		var featuresDefs = _.map(data.rows, (name) => {
			return { name: name };
		});

		// map feature data to chromosomes
		_chromosomeData = _.map(_chromosomeData, (_c, i) => {
			_c.features = []
			for (var f = 0; f < data.rows.length; f++) {
				_c.features.push({
					name: data.rows[f],
					value: data.data[f][i]
				});
			}
			return _c;
		});

		// make simple headers and rows to go in table
		var _headers = _.map(featuresDefs, (f) => { return f.name.replace(/_/g, " "); });
		_headers.unshift("Chromosome");
		var _rows = _.map(_chromosomeData, (_c) => {
			var featureList = _.map(_c.features, (_f) => {
				return _f.value;
			});
			featureList.unshift({ value: _c.display_name.split(" ")[1], href: _c.link });
			return featureList;
		});
		var _tableData = {
			headers: _headers,
			rows: _rows
		};

		var _initCombinedFeatures = _.map(featuresDefs, (f) => {
			f.value = 0; return f;
		});

		var _combinedFeatures = _.reduce(_chromosomeData, (prev, c) => {
			for (var i = c.features.length - 1; i >= 0; i--) {
				prev[i].value += c.features[i].value;
			}
			return prev;
		}, _initCombinedFeatures);

		return {
			featureData: {
				chromosomes: _chromosomeData,
				combined: _combinedFeatures
			},
			tableData: _tableData
		};
	}
};
