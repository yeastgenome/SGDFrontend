/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");
var LocusFormatHelper = require("../lib/locus_format_helper.jsx");

var DEFAULT_BASE_URL = "/webservice";

module.exports = class SequenceDetailsModel extends BaseModel {

	constructor (options) {
		options = options || {};

		// unless URL is in options, construct from id
		var _baseUrl = options.baseUrl || DEFAULT_BASE_URL;
		if (options.id) {
			options.url = options.url || _baseUrl + `/locus/${options.id}/sequence_details?callback=?`;
		}

		super(options);
	}

	parse (response) {
		var _response = _.filter(response.genomic_dna, (s) => {
			return s.strain.display_name === "S288C";
		})[0];

		var _locusWithTracks = this._assignTracksToLocci([_response]);
		var _trackDomain = LocusFormatHelper.getTrackDomain(_locusWithTracks[0].tags);

		_response = {
			data: { locci: _locusWithTracks },
			domainBounds: [_response.start, _response.end ],
			trackDomain: _trackDomain
		};

		return _response;
	}

	/*
		Takes an array of locci, and assigns a track number to make sure they don't overlap.
		Positive for watson, negative for crick.  Further from 0 is further from the center.
	*/
	_assignTracksToLocci (_locci) {
		return _.map(_locci, (d) => {
			var isWatson = d.strand === "+";
			d.track = isWatson ? 1 : -1;

			// assign tracks to sub features
			d.tags = _.map(d.tags, (t) => {
				t.strand = d.strand;
				t.start = t.relative_start;
				t.end = t.relative_end
				return LocusFormatHelper.assignTrackToSingleLocus(t, d.tags);
			});
			return d;
		});
	}

};
