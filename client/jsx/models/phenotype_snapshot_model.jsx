/** @jsx React.DOM */
"use strict";

var BaseModel = require("./base_model.jsx");
var _ = require("underscore");

module.exports = class PhenotypeSnapshotModel extends BaseModel {

	// return just array of terms (no relationships)
	parse (response) {

		// filter out id 176220 (overview) to just have an array of children
		var filteredId = 176220;
		var arr = _.filter(response.phenotype_slim_terms, (t) => { return t.id != filteredId });
		arr = _.sortBy(arr, (p) => { return -p.annotation_count; });
		return arr;
	}
};
