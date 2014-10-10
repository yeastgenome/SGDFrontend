/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DownloadButton = require("../widgets/download_button.jsx");
var DropdownSelector = require("../widgets/dropdown_selector.jsx");
var LETTERS_PER_LINE = 60;

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			locusDisplayName: null, // *
			contigName: null,
			sequences: null, // * [{ name: "DNA Coding", sequence: "ACTCTAGGCT" }, ...]
			showSequence: true,
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
			var tenChunked = seq.match(/.{1,10}/g).join(" ");
			var lineArr = tenChunked.match(/.{1,66}/g);
			var maxLabelLength = ((lineArr.length * LETTERS_PER_LINE + 1).toString().length)
			lineArr = _.map(lineArr, (l, i) => {
				var lineNum = i * LETTERS_PER_LINE + 1;
				var numSpaces = maxLabelLength - lineNum.toString().length;
				var spacesStr = Array(numSpaces + 1).join(" ");
				return `${spacesStr}${lineNum} ${l}`;
			});
			var lineNodes = _.map(lineArr, l => {
				return <span>{l}<br /></span>;
			});
			node = (<pre>
				<blockquote style={{ fontFamily: "Monospace" }}>
					<span>{lineNodes}</span>
				</blockquote>
			</pre>);
		}

		return node;

	},

	_handleChangeSequence: function (value) {
		var _activeSequence =  _.findWhere(this.props.sequences, { key: value });
		this.setState({ activeSequence: _activeSequence });
	}

});
