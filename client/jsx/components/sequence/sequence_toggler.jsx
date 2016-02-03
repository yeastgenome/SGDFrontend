import d3 from 'd3';
import React from 'react';
import _ from 'underscore';

const DownloadButton = require('../widgets/download_button.jsx');
const DropdownSelector = require('../widgets/dropdown_selector.jsx');
const Legend = require('../viz/legend.jsx');
const subFeatureColorScale = require('../../lib/locus_format_helper.jsx').subFeatureColorScale();
const LETTERS_PER_CHUNK = 10;
const LETTERS_PER_LINE = 60;

const SequenceToggler = React.createClass({
  getDefaultProps: function () {
    return {
      buttonId: null,
      locusDisplayName: null, // *
      locusFormatName: null,
      contigName: null,
      sequences: null, // * [{ name: "DNA Coding", sequence: "ACTCTAGGCT" key: }, ...]
      showCustomRetrieval: false,
      showSequence: true,
      subFeatureData: [],
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
      header: _activeSequence.header,
      sequence: _activeSequence.sequence,
      filename: _activeSequence.filename
    };

    var dropdownNode = this._getDropdownNode();
    var sequenceTextNode = this._formatActiveSequenceTextNode();

    var customRetrievalNode = null;
    if (this.props.showCustomRetrieval) {
      customRetrievalNode = (<ul className="button-group radius">
        <a className="button small secondary" href={"http://yeastgenome.org/cgi-bin/seqTools?back=1&seqname=" + this.props.locusFormatName}>Custom Sequence Retrieval</a>
      </ul>);
    }

    return (<div>
      {textNode}
      {dropdownNode}
      {sequenceTextNode}
      <div className="button-bar">
        <ul className="button-group radius">
          <li><DownloadButton buttonId={this.props.buttonId} text="Download Sequence" url="/download_sequence" extension=".fsa" params={_downloadParams}/></li>
        </ul>
        {customRetrievalNode}
      </div>

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
    return _.map(lineArr, (l, i) => {
      return <span key={'seq' + i}>{l}<br /></span>;
    });
  },

  _getComplexSequenceNode: function (sequence) {
    var maxLabelLength = sequence.length.toString().length + 1;
    var chunked = sequence.split("");
    var offset = this.state.activeSequenceType === '1kb' ? 1000 : 0;
        
    return _.map(chunked, (c, i) => {
      i++;
      var sp = (i % LETTERS_PER_CHUNK === 0 && !(i % LETTERS_PER_LINE === 0)) ? " " : "";
      var cr = (i % LETTERS_PER_LINE === 0) && (i > 1) ? "\n" : "";
      var str = c + sp + cr;
      var _classType = this._getSubFeatureTypeFromIndex(i - offset);

      var labelNode = (i - 1) % LETTERS_PER_LINE === 0 ? <span style={{ color: "#6f6f6f" }}>{`${Array(maxLabelLength - i.toString().length).join(" ")}${i} `}</span> : null;

      return <span key={`sequence-car${i}`} style={{ color: subFeatureColorScale(_classType) }}>{labelNode}{str}</span>;
    });
  },

  _canColorSubFeatures: function () {
    // must have sub-features and be on genomic DNA
    if (this.props.subFeatureData.length <= 1 || this.state.activeSequenceType === "coding_dna" || this.state.activeSequenceType === "protein") {
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

module.exports = SequenceToggler;
