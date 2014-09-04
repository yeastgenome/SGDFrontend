/** @jsx React.DOM */
"use strict";

var BaseModel = require("./base_model.jsx");
var _ = require("underscore");

module.exports = class GoSnapshotModel extends BaseModel {

	// format data into nested format for d3 partition
	parse (response) {
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
		// var topIds = [139709];

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
		var tertiaryRelationsips = _.filter(relationships, (r) => {
			return topIds.indexOf(r[1]) < 0;
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

		// TEMP remove tertiary nodes
		// for (var i = tertiaryRelationsips.length - 1; i >= 0; i--) {
		// 	assignToChildren(tertiaryRelationsips[i], _nestedData);
		// }

		// also put data into linear format for bar chart consumption
		var _linearData = _.map(goTerms, (t) => {
			return _.map(t.children, (c) => {
					var obj = c.data;
					obj["top_level"] = t.data.format_name;
					return obj;
				})
				.sort( (a, b) => {
					return (a.annotation_count < b.annotation_count) ? 1 : -1;
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
};
