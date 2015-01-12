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
};
