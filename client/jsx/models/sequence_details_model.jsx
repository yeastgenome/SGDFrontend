/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");
var LocusFormatHelper = require("../lib/locus_format_helper.jsx");

var MAIN_STRAIN_NAME = "S288C";

module.exports = class SequenceDetailsModel extends BaseModel {

	constructor (options) {
		options = options || {};
		options.url = `/backend/locus/${options.id}/sequence_details?callback=?`;
		super(options);
	}

	parse (response) {
		// alt strain data
		var _altStrainTemp = _.filter(response.coding_dna, s => {
			return (s.strain.status === "Alternative Reference");
		});
		var _altStrainsRaw = _.map(_altStrainTemp, s => {
			return s.strain;
		});
		var _altStrains = _.map(_altStrainsRaw, s => {
			return this._formatStrainData(s.display_name, response, s.format_name);
		});
		// alt strain meta data
		var _altMeta = _.map(_altStrainsRaw, s => {
			return this._formatAltStrainMetaData(s.display_name, response, s.format_name);
		});
		// 288C data
		var _mainStrain = this._formatStrainData(MAIN_STRAIN_NAME, response, MAIN_STRAIN_NAME);

		return {
			mainStrain: _mainStrain,
			altStrains: _altStrains,
			altStrainMetaData: _altMeta
		};
	}

	_formatStrainData (strainDisplayName, response, strainKey) {
		var _response = _.clone(response);
		_response = _.filter(_response.genomic_dna, (s) => {
			return s.strain.display_name === strainDisplayName;
		})[0];

		// format sequences
		var sequenceNames = {
			"genomic_dna": "Genomic DNA",
			"1kb": "Genomic DNA +/- 1kb",
			"coding_dna": "Coding DNA",
			"protein": "Protein"
		};
		var _sequences = _.map(_.keys(sequenceNames), key => {
			var _sequenceArr = _.filter(response[key], s => {
				return s.strain.display_name === strainDisplayName;
			});
			var _sequence = _sequenceArr.length ? _sequenceArr[0].residues : null;

			return {
				key: key,
				name: sequenceNames[key],
				sequence: _sequence
			};
		});

		var _contigData = LocusFormatHelper.formatContigData(_response.contig);
		var _locusWithTracks = this._assignTracksToLocci([_response]);
		var _trackDomain = LocusFormatHelper.getTrackDomain(_locusWithTracks[0].tags);
		var _tableData = this._formatTableData(_response.tags);

		_response = {
			contigData: _contigData,
			data: { locci: _locusWithTracks },
			domainBounds: [_response.start, _response.end ],
			sequences: _sequences,
			strainKey: strainKey,
			trackDomain: _trackDomain,
			tableData: _tableData
		};

		return _response;
	}

	/*
		Takes an array of locci, and assigns a track number to make sure they don't overlap.
		Positive for watson, negative for crick.  Further from 0 is further from the center.
	*/
	_assignTracksToLocci (_locci) {
		return _.map(_locci, (d) => {
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

	_formatTableData (subFeatures) {
		var _headers = [
			"Feature",
			"Relative Coordinates",
			"Coordinates",
			"Coord. Version"
		];

		var _rows = _.map(subFeatures, d => {
			var _relativeCoord = `${d.relative_start.toLocaleString()} - ${d.relative_end.toLocaleString()}`;
			var _coord = `${d.chromosomal_start.toLocaleString()} - ${d.chromosomal_end.toLocaleString()}`;
			return [d.format_name, _relativeCoord, _coord, d.coord_version];
		});

		var tableData = {
			headers: [_headers],
			rows: _rows
		};

		return tableData;
	}

	_formatAltStrainMetaData(strainDisplayName, response) {
		var _strain = _.filter(response.coding_dna, s => { return s.strain.display_name === strainDisplayName; })[0].strain;
		return {
			key: _strain.format_name,
			name: _strain.display_name,
			description: _strain.description,
			href: _strain.link,
			id: _strain.id,
			status: _strain.status
		};
	}
};
