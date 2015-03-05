/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var LABEL_WIDTH = 180;
var PX_PER_CHAR = 8.41;
var SUMMARIZED_SIZE = 30;

// give an array of segment objects, get a d3 scale
module.exports = function (segments) {
	// sort segments by domain
	var _segs = _.sortBy(segments, s => {
		return s.domain[0];
	});
	// make domain from "ticky" points in segment
	var _domain = _.reduce(segments, (memo, s) => {
		memo.push(s.domain[1] - 1);
		return memo;
	}, [0]);
	// make range
	var _range = _.reduce(segments, (memo, s) => {
		var _last = memo[memo.length - 1];
		// add fixed px for invible, else calc based on sequence
		var scaleSize = ((s.domain[1] - s.domain[0]) * PX_PER_CHAR);
		var _delta = !s.visible ? Math.min(SUMMARIZED_SIZE, scaleSize) : scaleSize;
		memo.push(_last += _delta);
		return memo;
	}, [LABEL_WIDTH]);

	return d3.scale.linear()
		.domain(_domain)
		.range(_range);
};
