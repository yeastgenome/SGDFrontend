/** @jsx React.DOM */
"use strict";

var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var DownloadButton = require("../widgets/download_button.jsx");
var DropdownSelector = require("../widgets/dropdown_selector.jsx");
var Legend = require("../viz/legend.jsx");
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
		var _activeSequence = _.filter(this.props.sequences, s => { return s.sequence; })[0];
		return {
			activeSequence: _activeSequence
		};
	},

	render: function () {
		var textNode = null;
		if (this.props.text) {
			textNode = <h3>{this.props.text}</h3>;
		}

		var _downloadParams = {
			"display_name": this.props.locusDisplayName,
			sequence: this.state.activeSequence.sequence,
			contig_name: this.state.activeSequence.contigFormatName || this.props.contigName
		};

		var dropdownNode = this._getDropdownNode();
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
			var seq = this.state.activeSequence.sequence;

			var sequenceNode;
			var legendNode = null;
			if (this._canColorSubFeatures()) {
				sequenceNode = this._getComplexSequenceNode(seq);
				var _colors = [{ text: "CDS", color: "blue" }, { text: "Intron" , color: "red" }];
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
		var _activeSequence =  _.findWhere(this.props.sequences, { key: value });
		this.setState({ activeSequence: _activeSequence });
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
		console.log(maxLabelLength)
		var chunked = sequence.split("")
		var colors = {
			"CDS": "blue",
			"INTRON": "red"
		};

		
		
		return _.map(chunked, (c, i) => {
			i++;
			var sp = (i % LETTERS_PER_CHUNK === 0 && !(i % LETTERS_PER_LINE === 0)) ? " " : "";
			var cr = (i % LETTERS_PER_LINE === 0) && (i > 1) ? "\n" : "";
			var str = c + sp + cr;
			var _classType = this._getSubFeatureTypeFromIndex(i);

			var labelNode = (i - 1) % LETTERS_PER_LINE === 0 ? <span style={{ color: "black" }}>{`${i}${Array(maxLabelLength - i.toString().length).join(" ")} `}</span> : null;

			return <span key={`sequence-car${i}`} style={{ color: colors[_classType] }}>{labelNode}{str}</span>;
		});
	},

	_canColorSubFeatures: function () {
		var allSubFeatures = _.uniq(_.map(this.props.subFeatureData, f => { return f.class_type; }));
		if (allSubFeatures.length === 2 && this.state.activeSequence.key === "genomic_dna") {
			return true;
		}

		return false;
	}

});
