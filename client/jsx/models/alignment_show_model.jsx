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

	// cache from local storage, otherwise normal fetch
	fetch (callback) {
		var storageKey = this.url;
		var maybeCachedResponse = JSON.parse(localStorage.getItem(storageKey));

		// cached data available, use
		if (maybeCachedResponse) {
			this.attributes = maybeCachedResponse;
			callback(null, maybeCachedResponse);
		// not in cache, fetch and set for next time
		} else {
			super( (err, resp) => {
				callback(err, resp);
				localStorage.setItem(storageKey, JSON.stringify(resp));
			})
		}
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

		var segments = _.reduce(variants, (memo, next, i) => {
			// add needed visible segment(s)
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
			// or needed at end
			// TODO

			// put in the visible segment
			// if already has an intersecting segment, just extend that one
			var _isMerged = false;
			var _other, _isBefore, _isAfter, _isSame;
			for (var _i = memo.length - 1; _i >= 0; _i--) {
				_other = memo[_i];
				// check for intersect
				_isBefore = (next.end >= _other.domain[0] && next.start <= _other.domain[1]);
				_isAfter = (next.start <= _other.domain[1] && next.end >= _other.domain[0]);
				_isSame = (i === _i);
				if ((_isBefore || _isAfter) && (!_isSame)) {
					_other.domain[0] = Math.min(_other.domain[0], next.start)
					_other.domain[1] = Math.max(_other.domain[1], next.end);
					_isMerged = true;
					break;
				}
			}
			// else, just add
			if (!_isMerged) {
				memo.push({
					domain: [next.start, next.end],
					visible: true
				});
			}
			
			return memo;
		}, []);
		
		// segments.forEach( d => {
		// 	console.log(d.domain[0], d.domain[1])
		// })
		return segments;
	}
};
