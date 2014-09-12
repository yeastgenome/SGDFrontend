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
		tableHeaders.splice(16, 0, "Nuclear Genome")
		tableHeaders.unshift("Feature Type");
		tableHeaders = [["", "Chromosome Number"], tableHeaders];

		var tableRows = _.map(chromosomeData[0].features, (f, i) => {
			// columns in each row
			var row = _.map(chromosomeData, (c) => {
				// if (c.format_name.match("micron") {
					
				// }
				return c.features[i].value;
			});

			// add up nuclear genome
			var nuclearTotal = _.reduce(row, (memo, c, i) => {
				if (i < 16) {
					memo += c;
				}
				return memo;
			}, 0);
			row.splice(16, 0, nuclearTotal);
			
			row.unshift(f.name.replace(/_/g, ' '));
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
		function termById (id) {
			var term = _.filter(allSlimTerms, (t) => {
				return t.id === id;
			})[0];
			return term;
		}

		// id's for top level
		var topIds = [139709, 137832, 140984];

		// start with array of top level GO cats
		var goTerms = _.filter(allSlimTerms, (t) => {
			return topIds.indexOf(t.id) >= 0;
		});

		goTerms = _.map(goTerms, (termData) => {
			return {
				data: termData,
				children: []
			}
		});

		// filter out repeats
		relationships = _.uniq(data.go_slim_relationships, (r) => {
			return r[0];
		});

		// define relationship elements for more specific terms
		var relationships = _.filter(relationships, (r) => {
			return !isNaN(r[0]); // not the defs
		});
		var secondaryRelationships = _.filter(relationships, (r) => {
			return (topIds.indexOf(r[0]) < 0 && topIds.indexOf(r[1]) >= 0);
		});

		// helper function to recursively try to assign to parent
		function assignToChildren (relationship, targetTerm) {
			if (relationship[1] === targetTerm.data.id) {
				var term = termById(relationship[0]);
				targetTerm.children.push({ data: term, children: []});
				return;
			} else {
				for (var i = targetTerm.children.length - 1; i >= 0; i--) {
					assignToChildren(relationship, targetTerm.children[i])
				};
				return;
			}
		}

		var _nestedData = { data: {}, children: goTerms };

		// use helper function to assign children
		for (var i = secondaryRelationships.length - 1; i >= 0; i--) {
			assignToChildren(secondaryRelationships[i], _nestedData);
		}

		// // add terms annoted to root
		// for (var i = _nestedData.children.length - 1; i >= 0; i--) {
		// 	var term = _nestedData.children[i];
		// 	term.children.push({
		// 		data: {
		// 			display_name: "annotated to root term",
		// 			format_name: "annotated_to_root_term",
		// 			link: term.data.link,
		// 			annotation_count: 0,
		// 			isRoot: true
		// 		}
		// 	});
		// }

		// also put data into linear format for bar chart consumption
		var _linearData = _.map(goTerms, (t) => {
			return _.map(t.children, (c) => {
					var obj = c.data;
					obj["top_level"] = t.data.format_name;
					return obj;
				})
				.sort( (a, b) => {
					return (a.descendant_annotation_gene_count < b.descendant_annotation_gene_count) ? 1 : -1;
				});
		});

		_linearData = _.reduce(_linearData, (prev, current) => {
			return prev.concat(current);
		}, []);

		return {
			nested: _nestedData,
			linear: _linearData
		};
	}

	// return just array of phenotype terms (no relationships)
	_parsePhenotypes (response) {
		// filter out id 176220 (overview) to just have an array of children
		var filteredId = 176220;
		var arr = _.filter(response.phenotype_slim_terms, (t) => { return t.id != filteredId });
		arr = _.sortBy(arr, (p) => { return -p.descendant_annotation_gene_count; });
		return arr;
	}};
