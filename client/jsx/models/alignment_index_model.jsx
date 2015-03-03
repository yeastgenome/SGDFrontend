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

	// cache from local storage, otherwise normal fetch
	// fetch (callback) {
	// 	var storageKey = "/backend/alignments";
	// 	var maybeCachedResponse = JSON.parse(localStorage.getItem(storageKey));

	// 	// cached data available, use
	// 	if (maybeCachedResponse) {
	// 		this.attributes = maybeCachedResponse;
	// 		callback(null, maybeCachedResponse);
	// 	// not in cache, fetch and set for next time
	// 	} else {
	// 		super( (err, resp) => {
	// 			callback(err, resp);
	// 			localStorage.setItem(storageKey, JSON.stringify(resp));
	// 		})
	// 	}
	// }

	// assume type "ORF"
	parse (response) {
		response.loci = response.loci.map( d => {
			d.locus_type = "ORF";
			return d;
		});
		return response;
	}

	// strainIds is optional
	getAllLoci (strainIds) {
		if (strainIds) {
			return this._filterLociVariantData(this.attributes.loci, strainIds);
		}
		return this.attributes.loci;
	}

	// strainIds is optional
	searchLoci (query, strainIds) {
		var results;

		// multi search
		if ((/[\s,]/).test(query)) {
			var queries = query.split(/[\s,]/);
			queries = _.filter(queries, d => { return (d !== ""); });
			results = _.filter(this.attributes.loci, d => {
				var _isMatch = false;
				queries.forEach( _d => {
					if (!_isMatch) _isMatch = this._matchSearchQuery(_d, d);
				});
				return _isMatch;
			});
		// simple, single query
		} else {
			results = _.filter(this.attributes.loci, d => {
				return this._matchSearchQuery(query, d);
			});
		}

		if (strainIds) {
			return this._filterLociVariantData(results, strainIds);
		}
		return results;
	}

	_matchSearchQuery (query, locusData) {
		if (locusData.display_name.indexOf(query) > -1) {
			return true;
		} else if (locusData.format_name.indexOf(query) > -1) {
			return true;
		}
		return false;
	}

	// takes an array of loci data and chops all the variant data corresponding to strainIds (required)
	_filterLociVariantData (lociData, strainIds) {
		var strainIndexes = _.map(strainIds, d => {
			var _strainData = _.findWhere(this.attributes.strains, { id: d });
			return this.attributes.strains.indexOf(_strainData);
		});
		var _dna, _protein;
		return _.map(lociData, (d, i) => {
			var data = _.clone(d);
			_dna = _.filter(data.dna_scores, (_d, _i) => {
				return strainIndexes.indexOf(_i) > -1;
			});
			_protein = _.filter(data.protein_scores, (_d, _i) => {
				return strainIndexes.indexOf(_i) > -1;
			});

			data.dna_scores = _dna;
			data.protein_scores = _protein;
			return data;
		});
	}
};
