/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var DownloadButton = require("../widgets/download_button.jsx");
var DropdownSelector = require("../widgets/dropdown_selector.jsx");
var Legend = require("../viz/legend.jsx");
var subFeatureColorScale = require("../../lib/locus_format_helper.jsx").subFeatureColorScale();
var LETTERS_PER_CHUNK = 10;
var LETTERS_PER_LINE = 60;

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			locusDisplayName: null, // *
			contigName: null,
			sequences: null, // * [{ name: "DNA Coding", sequence: "ACTCTAGGCT" }, ...]
			showSequence: true,
			subFeatureData: null,
			text: null
		};
	},

	getInitialState: function () {
		return {
			activeSequenceType: this.props.sequences[0].key
		};
	},

	render: function () {
		var textNode = null;
		if (this.props.text) {
			textNode = <h3>{this.props.text}</h3>;
		}

		var _activeSequence = this._getActiveSequence();
		var _downloadParams = {
			"display_name": this.props.locusDisplayName,
			sequence: _activeSequence.sequence,
			contig_name: _activeSequence.contigFormatName || this.props.contigName
		};

		var dropdownNode = this._getDropdownNode();
		this._getActiveSequence()
		var sequenceTextNode = this._formatActiveSequenceTextNode();

		return (<div>
			{textNode}
			{dropdownNode}
			{sequenceTextNode}
			<DownloadButton text="Download Sequence" url="/download_sequence" extension=".fsa" params={_downloadParams}/>
		</div>);
	},

	_getDropdownNode: function () {
		var _isDisabled = (s) => { return !s.sequence; };
		var _elements = _.map(this.props.sequences, s => {
			s.value = s.key;
			return s;
		});
		return <DropdownSelector elements={_elements} isDisabled={_isDisabled} onChange={this._handleChangeSequence} />;
	},

	_formatActiveSequenceTextNode: function () {
		var node = null;
		if (this.props.showSequence) {
			var seq = this._getActiveSequence().sequence;

			var sequenceNode;
			var legendNode = null;
			if (this._canColorSubFeatures()) {
				sequenceNode = this._getComplexSequenceNode(seq);
				var _featureTypes = _.uniq(_.map(this.props.subFeatureData, f => { return f.class_type; }));
				var _colors = _.map(_featureTypes, f => {
					return { text: f, color: subFeatureColorScale(f) };
				});
				legendNode = <Legend elements={_colors} />;
			} else {
				sequenceNode = this._getSimpleSequenceNode(seq);
			}

			node = (<div>
				{legendNode}
				<pre>
					<blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}>
						{sequenceNode}
					</blockquote>
				</pre>
			</div>);
		}

		return node;

	},

	_handleChangeSequence: function (value) {
		this.setState({ activeSequenceType: value });
	},

	_getSubFeatureTypeFromIndex: function (index) {
		for (var i = this.props.subFeatureData.length - 1; i >= 0; i--) {
			var f = this.props.subFeatureData[i];
			if (index >= f.relative_start && index <= f.relative_end) {
				return f.class_type;
			}
		}

		return null;
	},

	_getSimpleSequenceNode: function (sequence) {
		var tenChunked = sequence.match(/.{1,10}/g).join(" ");
		var lineArr = tenChunked.match(/.{1,66}/g);
		var maxLabelLength = ((lineArr.length * LETTERS_PER_LINE + 1).toString().length)
		lineArr = _.map(lineArr, (l, i) => {
			var lineNum = i * LETTERS_PER_LINE + 1;
			var numSpaces = maxLabelLength - lineNum.toString().length;
			var spacesStr = Array(numSpaces + 1).join(" ");
			return `${spacesStr}${lineNum} ${l}`;
		});
		return _.map(lineArr, l => {
			return <span>{l}<br /></span>;
		});
	},

	_getComplexSequenceNode: function (sequence) {
		var maxLabelLength = sequence.length.toString().length + 1;
		var chunked = sequence.split("")
		var colors = {
			"CDS": "blue",
			"INTRON": "red"
		};

		var colorScale = d3.scale.category10();
				
		return _.map(chunked, (c, i) => {
			i++;
			var sp = (i % LETTERS_PER_CHUNK === 0 && !(i % LETTERS_PER_LINE === 0)) ? " " : "";
			var cr = (i % LETTERS_PER_LINE === 0) && (i > 1) ? "\n" : "";
			var str = c + sp + cr;
			var _classType = this._getSubFeatureTypeFromIndex(i);

			var labelNode = (i - 1) % LETTERS_PER_LINE === 0 ? <span style={{ color: "#6f6f6f" }}>{`${Array(maxLabelLength - i.toString().length).join(" ")}${i} `}</span> : null;

			return <span key={`sequence-car${i}`} style={{ color: colorScale(_classType) }}>{labelNode}{str}</span>;
		});
	},

	_canColorSubFeatures: function () {
		// must have sub-features and be on genomic DNA
		if (!this.props.subFeatureData.length || this.state.activeSequenceType !== "genomic_dna") {
			return false;
		}

		// no overlaps
		var _allTracks = _.uniq(_.map(this.props.subFeatureData, f => { return f.track; }));
		if (_allTracks.length > 1) return false;

		return true;
	},

	_getActiveSequence: function () {
		return _.findWhere(this.props.sequences, { key: this.state.activeSequenceType });
	}

});
