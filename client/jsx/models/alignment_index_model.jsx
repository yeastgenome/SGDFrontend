/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");

module.exports = class AlignmentIndexModel extends BaseModel {

	constructor (options) {
		var options = options || {};
		options.url = options.url || "/backend/alignments?callback=?";
		super(options);
	}

	// strainIds is optional
	getAllLoci (strainIds) {
		if (strainIds) {
			return this._filterLociVariantData(this.attributes.loci, strainIds);
		}
		return this.attributes.loci;
	}

	searchLoci (query, strainIds) {
		var results;

		// multi search
		if ((/[\s,]/).test(query)) {
			var queries = query.split(/[\s,]/);
			queries = _.filter(queries, d => { return (d !== ""); });
			results = _.filter(this.attributes.loci, d => {
				var _isMatch = false;
				queries.forEach( _d => {
					if (d.display_name.indexOf(_d) > -1) {
						_isMatch = true;
					}
				});
				return _isMatch;
			});
		// simple, single query
		} else {
			results = _.filter(this.attributes.loci, d => {
				return (d.display_name.indexOf(query) > -1);
			});
		}

		if (strainIds) {
			return this._filterLociVariantData(results, strainIds);
		}
		return results;
	}

	// takes an array of loci data and chops all the variant data corresponding to strainIds (required)
	_filterLociVariantData (lociData, strainIds) {
		// TEMP
		return lociData;
	}
};
