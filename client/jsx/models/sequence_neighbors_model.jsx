/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");
var LocusFormatHelper = require("../lib/locus_format_helper.jsx");

var MAIN_STRAIN_NAME = "S288C";

module.exports = class SequenceNeighborsModel extends BaseModel {

	constructor (options) {
		options = options || {};
		if (options.id) this.id = parseInt(options.id);
		options.url = `/backend/locus/${options.id}/neighbor_sequence_details?callback=?`;
		super(options);
	}

	parse (response) {
		var _altNames = _.filter(_.keys(response), n => { return n !== MAIN_STRAIN_NAME; });
		var _altStrains = _.map(_altNames, n => {
			return this._formatStrainName(n, response[n]);
		});
		var _mainStrain = this._formatStrainName(MAIN_STRAIN_NAME, response[MAIN_STRAIN_NAME]);

		return {
			mainStrain: _mainStrain,
			altStrains: _altStrains
		};
	}

	_formatStrainName (strainDisplayName, strainData) {
		var _contigData = LocusFormatHelper.formatContigData(strainData.neighbors[0].contig);
		var _locci = this._assignTracksToLocci(strainData.neighbors);
		var _trackDomain = LocusFormatHelper.getTrackDomain(_locci);

		var _start = _.min(_locci, (d) => { return d.start; }).start;
		var _end = _.max(_locci, (d) => { return d.end; }).end;

		var _focusLocus = _.filter(_locci, l => {
			return l.locus.id === this.id;
		})[0];
		var _focusLocusDomain = [_focusLocus.start, _focusLocus.end];

		return {
			data: { locci: _locci },
			domainBounds: [_start, _end],
			contigData: _contigData,
			focusLocusDomain: _focusLocusDomain,
			strainKey: strainDisplayName,
			trackDomain: _trackDomain
		};
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
