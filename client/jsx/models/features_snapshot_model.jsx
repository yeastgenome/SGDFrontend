/** @jsx React.DOM */
"use strict";

var BaseModel = require("./base_model.jsx");
var _ = require("underscore");

module.exports = class GenomeSnapshotModel extends BaseModel {

	// helper function which takes a list of features and nests the characterization status
	// returns features array filtered and nexted in "nestedValues" of ORF
	_nestOrfCharacterizationStatuses (features) {
		var charaStatuses = ["Verified", "Uncharacterized", "Dubious"];

		// boolean helper function
		var isORFChara = (f) => {
			return charaStatuses.indexOf(f.name) >= 0;
		};

		// get the statuses, separate them from the rest of features
		var characFeatures = _.sortBy(_.filter(features, isORFChara), (f) => { return charaStatuses.indexOf(f.name); });
		features = _.filter(features, (f) => { return !isORFChara(f); })
		
		// finally, assign them to orf element
		var orfElement = _.findWhere(features, { name: "ORF"} );
		orfElement.nestedValues = characFeatures;

		return features
	}

	// put data in table format
	_formatDataForTable (response, chromosomeData) {
		var tableHeaders = response.rows;
		tableHeaders.unshift("Chromosome");
		var tableRows = _.map(chromosomeData, (c) => {
			var row = _.map(c.features, (f) => {
				return f.value;
			});
			row.unshift(c.display_name.split(" ")[1])
			return row;
		});

		return {
			headers: tableHeaders,
			rows: tableRows
		};
	}

	parse (response) {

		// get the contigs for S288C
		var chroms = _.filter(response.columns, (d) => {
			return d.format_name.match("S288C");
		});

		// assign feature data
		chroms = _.map(chroms, (c) => {
			var chromIndex = response.columns.indexOf(c);
			c.features = _.reduce(response.data, (prev, featuresByType, featureIndex) => {
				prev.push({
					name: response.rows[featureIndex],
					value: featuresByType[chromIndex]
				});
				return prev;
			}, []);
			return c;
		});

		// combine the chromosomes for whole genome data
		var headers = _.map(response.rows, (c) => {
			return {
				name: c,
				value: 0
			};
		});
		var combined = _.reduce(chroms, (prev, c) => {
			for (var i = 0; i < c.features.length; i++) {
				prev[i].value += c.features[i].value;
			};
			return prev;
		}, headers);

		// nest the ORF characterization status data in "nestedValues" of ORF
		combined = this._nestOrfCharacterizationStatuses(combined);
		chroms = _.map(chroms, (c) => {
			c.features = this._nestOrfCharacterizationStatuses(c.features);
			return c;
		});

		// format data for table
		var _tableData = this._formatDataForTable(response, chroms);

		return {
			tableData: _tableData,
			graphData: {
				chromosomes: chroms,
				combined: combined
			}
		};
	}
};
