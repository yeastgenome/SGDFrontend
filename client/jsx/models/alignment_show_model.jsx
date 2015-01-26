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
