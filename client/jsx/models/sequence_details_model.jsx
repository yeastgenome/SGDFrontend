
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");
var LocusFormatHelper = require("../lib/locus_format_helper.jsx");

var MAIN_STRAIN_NAME = "S288C";

module.exports = class SequenceDetailsModel extends BaseModel {

	constructor (options) {
		options = options || {};
		options.url = `/backend/locus/${options.id}/sequence_details`;
		// TEMP
		super(options);
		this.baseAttributes = options;
		
	}

	parse (response) {
		// alt strain data
		var _altStrainTemp = _.filter(response.genomic_dna, s => {
			return (s.strain.status === "Alternative Reference");
		});
		var _altStrainsRaw = _.map(_altStrainTemp, s => {
			var strainData = s.strain;
			// this is where they key is configured
			strainData.key = strainData.format_name + "_" + s.contig.format_name;
			return strainData;
		});
		var _altStrains = _.map(_altStrainsRaw, s => {
			return this._formatStrainData(s.display_name, response, s.key);
		});
		// alt strain meta data
		var _altMeta = _.map(_altStrainsRaw, s => {
			return this._formatAltStrainMetaData(s.display_name, response, s.key);
		});
		// 288C data
		var _mainStrain = this._formatStrainData(MAIN_STRAIN_NAME, response, MAIN_STRAIN_NAME);
		// other strains
		var _otherTemp = _.filter(response.genomic_dna, s => {
			return (s.strain.status === "Other");
		});
		var _otherStrains = _.map(_otherTemp, s => {
			var strainKey = s.strain.format_name + "_" + s.contig.format_name;
			return this._formatOtherStrainData(s.strain.format_name, response, strainKey);
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
		_response = _.filter(_response.genomic_dna, s => {
			if (strainKey === MAIN_STRAIN_NAME) return (s.strain.format_name === MAIN_STRAIN_NAME)
			return (s.strain.format_name + "_" + s.contig.format_name === strainKey);
		})[0];

		// format sequences
		var sequenceNames = {
			"genomic_dna": "Genomic DNA",
			"1kb": "Genomic DNA +/- 1kb",
			"coding_dna": "Coding DNA",
			"protein": "Protein"
		};

		var _sequences = _.map(_.keys(sequenceNames), key => {
			var header, filename;
			var _sequenceArr = _.filter(response[key], s => {
				if (s.header) header = s.header;
				if (s.filename) filename = s.filename;
				return s.strain.display_name === strainDisplayName;
			});

			// format default filenames and headers if needed
			if (!header) header = this._formatDefaultHeader(key, _response.contig.display_name.substr(11), _response.start, _response.end);
			if (!filename) filename = this._formatDefaultFilename(key, _response.strain.display_name);

			var _sequence = _sequenceArr.length ? _sequenceArr[0].residues : null;

			return {
				filename: filename,
				header: header,
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
				// handle upstream
				if (tag.relative_start < 0) {
					if (tag.track > 0)
						_domainMin -= Math.abs(tag.relative_start); // watson
					else {
						_domainMax += Math.abs(tag.relative_start); // crick
					}
				}

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

	_formatDefaultFilename (key, strainDisplayName) {
		var attr = this.baseAttributes;
		var _possibleSuffixes = {
			genomic_dna: "genomic.fsa",
			coding_dna: "coding.fsa",
			"1kb": "flanking.fsa",
			protein: "protein.fsa"
		};
		var suffix = _possibleSuffixes[key];
		return `${strainDisplayName}_${attr.locusFormatName}_${attr.locusDiplayName}_${suffix}`;
	}

	_formatDefaultHeader (key, contigDisplayName, start, end) {
		var attr = this.baseAttributes;
		var _possibleSuffixes = {
			genomic_dna: `, chr${contigDisplayName}:${start}..${end}`,
			coding_dna: "",
			"1kb": `, chr${contigDisplayName}:${start}..${end}+/- 1kb`,
			protein: ""
		};
		var suffix = _possibleSuffixes[key];
		return `${attr.locusDiplayName} ${attr.locusFormatName} SGDID:${attr.locusSGDID}${suffix}`;
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
			var _coordNode = { html: `<span><a href=${contigData.href}>${contigString}</a>${d.chromosomal_start}..${d.chromosomal_end}</span>` };
			return [d.format_name, _relativeCoord, _coordNode, d.coord_version, d.seq_version];
		});

		var tableData = {
			headers: [_headers],
			rows: _rows
		};

		return tableData;
	}

	_formatAltStrainMetaData(strainDisplayName, response, strainKey) {
		var _strainMeta = _.filter(response.genomic_dna, s => {
			return (s.strain.format_name + "_" + s.contig.format_name === strainKey);
		})[0];

		// var _strainMeta = _.filter(response.genomic_dna, s => { return s.strain.display_name === strainDisplayName; })[0];
		var _strain = _strainMeta.strain;
		return {
			key: _strain.key,
			name: _strain.display_name,
			description: _strain.description,
			href: _strain.link,
			id: _strain.id,
			status: _strain.status
		};
	}

	_formatOtherStrainData(strainFormatName, response, strainKey) {
		var strainData = _.filter(response.genomic_dna, s => {
			return (s.strain.format_name + "_" + s.contig.format_name) === strainKey;
		})[0];

		var attr = this.baseAttributes;
		var header = strainData.header;
		var filename = strainData.filename;

		// get default download stuff if not defined
		if (!header) header = this._formatDefaultHeader("genomic_dna", strainData.contig.display_name.substr(11), strainData.start, strainData.end);
		if (!filename) filename = this._formatDefaultFilename("genomic_dna", strainData.strain.display_name);

		return {
			contigFormatName: strainData.contig.format_name,
			key: strainKey,
			name: strainData.strain.display_name,
			value: strainData.strain.format_name,
			description: strainData.strain.description,
			href: strainData.strain.link,
			id: strainData.strain.id,
			status: strainData.strain.status,
			sequence: strainData.residues,
			header: header,
			filename: filename
		};
	}

	_formatDownloadData(strainDisplayName, response) {
		var _strain = _.filter(response.genomic_dna, s => { return s.strain.display_name === strainDisplayName; })[0];
		var _headers = ["Evidence ID", "Analyze ID", "Feature", "Feature Systematic Name", "Feature Type", "Relative Coordinates", "Coordinates", "Strand", "Coord. Version", "Seq. Version"];
		var _contigSeg = _strain.contig.format_name.split('_')[1];
		if (_contigSeg === 'Mito') _contigSeg = 'mt';
		var _data = _.map(_strain.tags, t => {
			var _relativeCoordinates = `${t.relative_start}..${t.relative_end}`;
			var _coordinates = `chr${_contigSeg}:${t.chromosomal_start}..${t.chromosomal_end}`;
			return [t.evidence_id, _strain.locus.id, _strain.locus.display_name, _strain.locus.format_name, t.class_type, _relativeCoordinates, _coordinates, _strain.strand, t.coord_version, t.seq_version];
		});
		return {
			headers: JSON.stringify(_headers),
			data: JSON.stringify(_data)
		};
	}
};
