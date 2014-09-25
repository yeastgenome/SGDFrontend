/** @jsx React.DOM */
"use strict";

var BaseModel = require("./base_model.jsx");
var _ = require("underscore");

module.exports = class GenomeSnapshotModel extends BaseModel {

	// Takes a large response, and uses separate parse functions and ultimately returns
	// a nested object, with each value in the format expected by the corresponding component.
	parse (response) {

		// separate the response into objects which will be separately parsed
		var _rawFeatures = _.pick(response, ["rows", "data", "columns"]);
		var _rawGo = _.pick(response, ["go_slim_terms", "go_slim_relationships"]);
		var _rawPhenotypes = _.pick(response, ["phenotype_slim_terms", "phenotype_slim_relationships"]);

		// return the parsed versions, using helper parse methods
		return {
			featuresData: this._parseFeatures(_rawFeatures),
			goData: this._parseGo(_rawGo),
			phenotypeData: this._parsePhenotypes(_rawPhenotypes)
		};
	}

	// *** Helper Parse Methods ***

	// helper function which takes a list of features and nests the characterization status
	// returns features array filtered and nested in "nestedValues" of ORF
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
	_formatDataForTable (chromosomeData) {
		var tableHeaders = _.map(chromosomeData, (c) => {
			return {
				value: c.display_name.split(" ")[1],
				href: c.link
			};
		});
		tableHeaders.unshift("Feature Type");
		tableHeaders = [["", "Chromosome Number"], tableHeaders];

		var tableRows = _.map(chromosomeData[0].features, (f, i) => {
			// columns in each row
			var row = _.map(chromosomeData, (c) => {
				// if (c.format_name.match("micron") {
					
				// }
				return c.features[i].value;
			});

			// // add up nuclear genome
			// var nuclearTotal = _.reduce(row, (memo, c, i) => {
			// 	if (i < 16) {
			// 		memo += c;
			// 	}
			// 	return memo;
			// }, 0);
			// row.splice(16, 0, nuclearTotal);
			
			row.unshift(f.name.replace(/_/g, ' '));
			return row;
		});

		// add row for length (bp)
		var lengthRow = _.map(chromosomeData, (c) => {
			return c.length;
		});
		lengthRow.unshift("Chromosome Length (bp)");
		tableRows.push(lengthRow);

		// add nuclear totals
		tableHeaders[1].splice(17, 0, "Nuclear Genome");
		tableRows = _.map(tableRows, (row) => {
			var nuclearTotal = _.reduce(row, (memo, c, i) => {
				if (i < 1) return memo;
				if (i < 17) {
					memo += c;
				}
				return memo;
			}, 0);
			row.splice(17, 0, nuclearTotal);
			return row;
		});

		// make numbers strings
		tableRows = _.map(tableRows, (row) => {
			row = _.map(row, (c) => {
				return c.toLocaleString();
			});
			return row;
		});


		return {
			headers: tableHeaders,
			rows: tableRows
		};
	}

	_parseFeatures (response) {
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
				name: c.replace(/_/g, ' '),
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
		var _tableData = this._formatDataForTable(chroms);

		// combine "other" (non-ORF) features
		chroms = _.map(chroms, (c) => {
			var combinedFeatures = [c.features[0]];
			combinedFeatures.push(_.reduce(c.features, (prev, f, i) => {
				if (i > 0) {
					prev.value += f.value;
				}
				return prev;
			}, { name: "Other", value: 0 }));
			c.features = combinedFeatures;
			return c;
		});

		return {
			tableData: _tableData,
			graphData: {
				chromosomes: chroms,
				combined: combined
			}
		};
	}

	// format GO data into nested format for d3 partition
	_parseGo (response) {
		var data = response;
		var allSlimTerms = _.uniq(data.go_slim_terms, (t) => { return t.id });

		// helper function to get terms from their ID
		var termById = function (_id) {
			return _.findWhere(allSlimTerms, { id: _id });
		};

		// id's for top level
		var topIds = [139709, 137832, 140984];

		// define relationship elements for more specific terms
		var relationships = _.uniq(data.go_slim_relationships, (r) => {
			return r[0];
		});
		relationships = _.filter(relationships, (r) => {
			return topIds.indexOf(r[1]) >= 0;
		});

		// get child terms
		var childTerms = _.filter(allSlimTerms, (t) => {
			return topIds.indexOf(t.id) < 0;
		});

		// start with array of top level GO cats
		var goTerms = _.filter(allSlimTerms, (t) => {
			return topIds.indexOf(t.id) >= 0;
		});

		// format data, mapping children to parents
		goTerms = _.map(goTerms, (termData) => {
			var _childRelationships = _.filter(relationships, (r) => {
				return r[1] === termData.id;
			});

			// format child terms
			var _childTerms = _.map(_childRelationships, (r) => {
				return termById(r[0]);
			});
			// add an entry for annotated to root (unknown)
			// Note: * always use direct annotation for this entry.
			_childTerms.push({
				descendant_annotation_gene_count: termData.direct_annotation_gene_count, // *
				direct_annotation_gene_count: termData.direct_annotation_gene_count,
				link: null,
				display_name: "annotated to unknown",
				isRoot: true,
				format_name: "annotated_to_unknown"
			});
			// sort desc
			_childTerms = _.sortBy(_childTerms, (d) => {
				return -d.descendant_annotation_gene_count;
			});

			return {
				id: termData.id,
				key: termData.format_name,
				name: termData.display_name,
				data: _childTerms
			};
		});

		return _.sortBy(goTerms, (t) => { return t.key === "biological_process" ? -1 : 1; });
	}

	// return just array of phenotype terms (no relationships)
	_parsePhenotypes (response) {
		// filter out id 176220 (overview) to just have an array of children
		var filteredId = 176220;
		var arr = _.filter(response.phenotype_slim_terms, (t) => { return t.id != filteredId });
		arr = _.sortBy(arr, (p) => { return -p.descendant_annotation_gene_count; });
		return arr;
	}};
