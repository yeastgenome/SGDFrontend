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
		var _altStrainTemp = _.filter(response.genomic_dna, s => {
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
		// other strains
		var _otherTemp = _.filter(response.genomic_dna, s => {
			return (s.strain.status === "Other");
		});
		var _otherStrains = _.map(_otherTemp, s => {
			return this._formatOtherStrainData(s.strain.format_name, response);
		});
		// sub-feature download data
		var _downloadData = this._formatDownloadData(MAIN_STRAIN_NAME, response);

		return {
			mainStrain: _mainStrain,
			altStrains: _altStrains,
			altStrainMetaData: _altMeta,
			subFeatureDownloadData: _downloadData,
			otherStrains: _otherStrains
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
		var _locusWithTracks = this._assignTracksToLoci([_response]);
		var _trackDomain = LocusFormatHelper.getTrackDomain(_locusWithTracks[0].tags);
		var _tableData = this._formatTableData(_response.tags, _contigData);

		// find a domain based on sub-features (may go beyond locus domain)
		var _domainMin = _response.start;
		var _domainMax = _response.end;
		if (_locusWithTracks[0].tags.length) {
			for (var i = _locusWithTracks[0].tags.length - 1; i >= 0; i--) {
				var tag = _locusWithTracks[0].tags[i];
				if (tag.relative_start < 0) _domainMin -= Math.abs(tag.relative_start);
				var length = _locusWithTracks[0].end - _locusWithTracks[0].start;
				if (tag.relative_end > length) {
					_domainMax += (tag.relative_end - length);
				}
			}
		}

		_response = {
			contigData: _contigData,
			data: { locci: _locusWithTracks },
			domainBounds: [_domainMin, _domainMax],
			sequences: _sequences,
			strainKey: strainKey,
			trackDomain: _trackDomain,
			tableData: _tableData
		};

		return _response;
	}

	/*
		Takes an array of loci, and assigns a track number to make sure they don't overlap.
		Positive for watson, negative for crick.  Further from 0 is further from the center.
	*/
	_assignTracksToLoci (_loci) {
		var loci = _.map(_loci, (d) => {
			d.tags = _.sortBy(d.tags, t => {
				return t.class_type === "ORF"; // separate ORFs
			});
			// assign tracks to sub features
			d.tags = _.map(d.tags, t => {
				t.strand = d.strand;
				t.start = t.relative_start;
				t.end = t.relative_end;
				return LocusFormatHelper.assignTrackToSingleLocus(t, d.tags);
			});
			return d;
		});

		// if no subfeatures, assign track to locus
		if (!loci[0].tags.length) {
			loci[0] = LocusFormatHelper.assignTrackToSingleLocus(loci[0], loci);
		}

		return loci;
	}

	_formatTableData (subFeatures, contigData) {
		var contigString = "";
		if (contigData.isChromosome) {
			var num = contigData.formatName.match(/Mito/) ? "mt" :contigData.formatName.split("_")[1];
			contigString = `chr${num}:`;
		}

		var _headers = [
			"Feature",
			"Relative Coordinates",
			"Coordinates",
			"Coord. Version",
			"Seq. Version"
		];

		var _rows = _.map(subFeatures, d => {
			
			var _relativeCoord = `${d.relative_start}..${d.relative_end}`;
			var _coord = `${contigString}${d.chromosomal_start}..${d.chromosomal_end}`;
			_coord = "<a href='http://google.com'>" + _coord + "</a>"
			return [d.format_name, _relativeCoord, _coord, d.coord_version, d.seq_version];
		});

		var tableData = {
			headers: [_headers],
			rows: _rows
		};

		return tableData;
	}

	_formatAltStrainMetaData(strainDisplayName, response) {
		var _strain = _.filter(response.genomic_dna, s => { return s.strain.display_name === strainDisplayName; })[0].strain;
		return {
			key: _strain.format_name,
			name: _strain.display_name,
			description: _strain.description,
			href: _strain.link,
			id: _strain.id,
			status: _strain.status
		};
	}

	_formatOtherStrainData(strainFormatName, response) {
		var strainData = _.filter(response.genomic_dna, s => { return s.strain.format_name === strainFormatName; })[0];

		return {
			contigFormatName: strainData.contig.format_name,
			key: strainData.strain.format_name,
			name: strainData.strain.display_name,
			value: strainData.strain.format_name,
			description: strainData.strain.description,
			href: strainData.strain.link,
			id: strainData.strain.id,
			status: strainData.strain.status,
			sequence: strainData.residues
		};
	}

	_formatDownloadData(strainDisplayName, response) {
		var _strain = _.filter(response.genomic_dna, s => { return s.strain.display_name === strainDisplayName; })[0];
		var _headers = ["Evidence ID", "Analyze ID", "Feature", "Feature Systematic Name", "Feature Type", "Relative Coordinates", "Coordinates", "Strand", "Coord. Version", "Seq. Version"];
		var _data = _.map(_strain.tags, t => {
			var _relativeCoordinates = `${t.relative_start}..${t.relative_end}`;
			var _coordinates = `${t.chromosomal_start}..${t.chromosomal_end}`;
			return [t.evidence_id, _strain.locus.id, _strain.locus.display_name, _strain.locus.format_name, t.class_type, _relativeCoordinates, _coordinates, _strain.strand, t.coord_version, t.seq_version];
		});
		return {
			headers: JSON.stringify(_headers),
			data: JSON.stringify(_data)
		};
	}
};
