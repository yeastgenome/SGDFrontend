/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var LETTERS_PER_LINE = 60;

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			text: null,
			sequences: null // * [{ name: "DNA Coding", sequence: "ACTCTAGGCT" }, ...]
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

		var dropdownNode = this._getDropdownNode();
		var sequenceTextNode = this._formatActiveSequenceTextNode();

		return (<div>
			{textNode}
			{dropdownNode}
			<pre>
				<blockquote style={{ fontFamily: "Monospace" }}>
					{sequenceTextNode}
				</blockquote>
			</pre>

		</div>);
	},

	_getDropdownNode: function () {
		var optionsNodes = _.map(this.props.sequences, s => {
			return <option value={s.key} disabled={!s.sequence}>{s.name}</option>;
		});
		return <select onChange={this._handleChangeSequence} className="large-3" value={this.state.activeSequence.key}>{optionsNodes}</select>;
	},

	_formatActiveSequenceTextNode: function () {
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
		return <span>{lineNodes}</span>;
	},

	_handleChangeSequence: function (e) {
		var _newKey = e.currentTarget.value;
		var _activeSequence =  _.findWhere(this.props.sequences, { key: _newKey });
		this.setState({ activeSequence: _activeSequence });
	}

});
