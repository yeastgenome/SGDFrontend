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
		_contigData.centromerePosition = (_contigData.centromere_start + _contigData.centromere_end) / 2;

		return {
			data: { locci: _loci} ,
			domainBounds: _domainBounds,
			contigData: _contigData
		};
	}

	// pure function that returns true or false if two segments overlap
	_isOverlap (segA, segB) {
		_isBefore = (segA.end >= segB.start && segA.start <= segB.end);
		_isAfter = (segA.start <= segB.end && segA.end >= segB.start);
		_isSame = (segA === segB);
		return ((_isBefore || _isAfter) && (!_isSame));
	}

	// returns true if segA inside of segB
	// _isInside (segA, segB) {
	// 	return (segA.start >= segB.start && segA.end <= segB.end);
	// }

	// from raw variant data, produce segments as expected by multi_alignment_viewer
	formatSegments (isProtein) {
		var variants = isProtein ? this.attributes.variant_data_protein : this.attributes.variant_data_dna;
		// make sure they're sorted by start
		variants = _.sortBy(variants, d => {
			return d.start;
		});

		// first, merge all redundant visible segments to produce mutually exclusive visible segments
		var mergedSegments = [];
		variants.forEach( (d, i) => {
			// if completely within another segment, do nothing
			mergedSegments.forEach( (_d, _i) => {

			});
			// if overlapping, extend existing
			if (this._isOverlap(d, _d)) {
				mergedSegments[_i].start = Math.min(d.start, _d.start);
				mergedSegments[_i].end = Math.min(d.end, _d.end);
			}
			// otherwise, create new segment with this data
			mergedSegments.push(d);
		});

		// add in needed summarized segments
		// first one
		if (mergedSegments[0].start > 1) {
			mergedSegments.push({
				visible: false,
				start: 1,
				end: mergedSegments[0].start - 1
			});
		}
		// loop through and connect
		mergedSegments.forEach( (d, i) => {
			// must not be last or visible
			if (d.visible && i < mergedSegments.length) {
				mergedSegments.push({
					visible: false,
					start: d.end + 1,
					end: mergedSegments[i + 1].start
				});
			}
		});
		// add last
		mergedSegments.push({
			start: mergedSegments[mergedSegments.length - 1].end,
			end: this.attributes.end
		});

		// change starts and ends to domains
		mergedSegments = _.map(mergedSegments, d => {
			d.domain = [d.start, d.end];
			return d;
		});
		// sort
		mergedSegments = _.sortBy(mergedSegments, d => {
			return d.start;
		});

		return mergedSegments;

		// var mergedSegments = _.reduce(variants, (memo, next, i) => {

			// compare all original segments to this one
			// variants.forEach( d => {
			// 	// if completely within another segment, do nothing
			// 	// if overlapping on one side, extend existing
			// 	// otherwise, create new segment with this data

			// });



			// ### Everything below is old and wrong !!! ###

			// add needed visible segment(s)
			// handle start if visible segment not at beginning
			// if (next.start > 1 && i === 0) {
			// 	memo.push({
			// 		domain: [1, next.start - 1],
			// 		visible: false
			// 	});
			// // if not consecutive, put in a summarized segment
			// } else if (i !== 0 && memo[i-1].domain[1] + 1 !== next.start) {
			// 	memo.push({
			// 		domain: [memo[i-1].domain[1] + 1, next.start - 1],
			// 		visible: false
			// 	});
			// }
			// or needed at end
			// TODO

			// put in the visible segment
			// if already has an intersecting segment, just extend that one
			// var _isMerged = false;
			// var _other, _isBefore, _isAfter, _isSame;
			// for (var _i = memo.length - 1; _i >= 0; _i--) {
			// 	_other = memo[_i];
			// 	// check for intersect
			// 	_isBefore = (next.end >= _other.domain[0] && next.start <= _other.domain[1]);
			// 	_isAfter = (next.start <= _other.domain[1] && next.end >= _other.domain[0]);
			// 	_isSame = (i === _i);
			// 	if ((_isBefore || _isAfter) && (!_isSame)) {
			// 		_other.domain[0] = Math.min(_other.domain[0], next.start)
			// 		_other.domain[1] = Math.max(_other.domain[1], next.end);
			// 		_isMerged = true;
			// 		break;
			// 	}
			// }
			// // else, just add
			// if (!_isMerged) {
			// 	memo.push({
			// 		domain: [next.start, next.end],
			// 		visible: true
			// 	});
			// }
			
		// 	return memo;
		// }, []);

		// TODO
		// add needed summarized segments
		
		// segments.forEach( d => {
		// 	console.log(d.domain[0], d.domain[1])
		// })
		// return mergedSegments;
	}
};
