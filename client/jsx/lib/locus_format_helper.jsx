/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var WATSON_TRACKS = [1 ,2 , 3, 4, 5];
var CRICK_TRACKS = [-1, -2, -3, -4, -5];

module.exports = {

	// For the given locus, assign a track higher than overlaps. return locus, with track assigned
	assignTrackToSingleLocus: function (locus, locci) {
		var isWatsonFn = (strand) => {  return strand === "+"; };
		var isWatson = isWatsonFn(locus.strand);
		var availableTracks = isWatson ? WATSON_TRACKS : CRICK_TRACKS;

		var defaultTrackNum = isWatson ? 1 : -1;

		// get the overlaps
		var overlaps = _.filter(locci, (d) => {
			if (isWatsonFn(d.strand) !== isWatsonFn(locus.strand)) return false;
			if (d.start >= locus.end || d.end <= locus.start) return false;
			return true;
		});

		// find the current max overlap, if it exists
		var maxOverlap;
		var minOverlap;
		if (isWatson) {
			maxOverlap = _.max(overlaps, (d) => { return d.track }).track;
			minOverlap = _.min(overlaps, (d) => { return d.track }).track;
		} else {
			maxOverlap = _.min(overlaps, (d) => { return d.track }).track;
			minOverlap = _.max(overlaps, (d) => { return d.track }).track;
		}

		// see which tracks are not being used by overlaps
		var _temp = _.filter(_.map(overlaps, (d) => { return d.track }), (e) => { return e; });
		var _overlapTracks = _.uniq(_temp);
		availableTracks = (_.difference(availableTracks, _overlapTracks));

		// get the min or max available track
		var track;
		if (isWatson) {
			track = _.min(availableTracks);
		} else {
			track = _.max(availableTracks);
		}
		// or default
		track = track || defaultTrackNum;

		locus.track = track;
		return locus;
	}

};
