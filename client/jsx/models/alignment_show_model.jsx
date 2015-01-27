/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");

module.exports = class AlignmentShowModel extends BaseModel {

	constructor (options) {
		// TEMP use dev endpoint always
		options.url = options.url || "http://sgd-dev.stanford.edu/webservice/alignments/" + options.id + "?callback=?";
		super(options);
	}

	getLocusDiagramData () {
		var attr = this.attributes;
		var _start = Math.min(attr.coordinates.start, attr.coordinates.end);
		var _end = Math.max(attr.coordinates.start, attr.coordinates.end);

		var _domainBounds = [_start, _end];
		var _loci = [
			{
				start: _start,
				end: _end,
				track: (attr.strand === "+") ? 1 : -1,
				locus: {
					display_name: attr.display_name,
					link: attr.link
				}
			}
		];
		var _contigData = attr.contig;

		return {
			data: { locci: _loci} ,
			domainBounds: _domainBounds,
			contigData: _contigData
		};
	}

	formatSegments (isProtein) {
		var variants = isProtein ? this.attributes.variant_data_protein : this.attributes.variant_data_dna;
		// make sure they're sorted
		variants = _.sortBy(variants, d => {
			return d.start;
		});

		// handle redundant variant segments
		var repeatSegments = [];
		// add segment which is known to be redundant
		var mergeSegments = segment => {
			// TODO
			console.log("merge: ", segment)
		};
		var isOverlap = (segA, segB) => {
			var _isBefore = (segA.end >= segB.start && segA.start <= segB.end);
			var _isAfter = (segA.start <= segB.end && segA.end >= segB.start);
			return (_isBefore || _isAfter);
		};

		// loop through segments
		var _outer, _inner;
		for (var i = variants.length - 1; i >= 0; i--) {
			_outer = variants[i];
			// look at others to check for overlap
			for (var _i = variants.length - 1; _i >= 0; _i--) {
				_inner = variants[_i];
				// merge if inside
				if (i ==! _i && isOverlap(_inner, _outer)) {
					console.log(_inner.start, _inner.end, _outer.start, _outer.end)
					mergeSegments(_inner);
					break;
				}
			}
		}
			

		var segments = _.reduce(variants, (memo, next, i) => {
			// handle start if visible segment not at beginning
			if (next.start > 1 && i === 0) {
				memo.push({
					domain: [1, next.start - 1],
					visible: false
				});
			// if not consecutive, put in a summarized segment
			} else if (i !== 0 && memo[i-1].domain[1] + 1 !== next.start) {
				memo.push({
					domain: [memo[i-1].domain[1] + 1, next.start - 1],
					visible: false
				});
			}

			memo.push({
				domain: [next.start, next.end],
				visible: true
			});
			// put in the visible segment
			return memo;
		}, []);

		return segments;
	}
};
