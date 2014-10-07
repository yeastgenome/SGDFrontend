/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");
var LocusFormatHelper = require("../lib/locus_format_helper.jsx");

var DEFAULT_BASE_URL = "/webservice";

module.exports = class SequenceNeighborsModel extends BaseModel {

	constructor (options) {
		options = options || {};

		// unless URL is in options, construct from id
		var _baseUrl = options.baseUrl || DEFAULT_BASE_URL;
		if (options.id) {
			options.url = options.url || _baseUrl + `/locus/${options.id}/neighbor_sequence_details?callback=?`;
		}

		super(options);
	}

	parse (response) {
		var strainData = response["S288C"];

		var _contigData = LocusFormatHelper.formatContigData(strainData.neighbors[0].contig);
		var _locci = this._assignTracksToLocci(strainData.neighbors);
		var _trackDomain = LocusFormatHelper.getTrackDomain(_locci);

		var _start = _.min(_locci, (d) => { return d.start; }).start;
		var _end = _.max(_locci, (d) => { return d.end; }).end;

		var _response = {
			data: { locci: _locci },
			domainBounds: [_start, _end],
			contigData: _contigData,
			trackDomain: _trackDomain
		};
		
		return _response;
	}

	/*
		Takes an array of locci, and assigns a track number to make sure they don't overlap.
		Positive for watson, negative for crick.  Further from 0 is further from the center.
	*/
	_assignTracksToLocci (locci) {
		return _.map(locci, (d) => {
			return LocusFormatHelper.assignTrackToSingleLocus(d, locci);
		});
	}
};
