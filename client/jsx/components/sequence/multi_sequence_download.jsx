'use strict';

var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
var DidClickOutside = require('../mixins/did_click_outside.jsx');

var MultiSequenceDownload = createReactClass({
  displayName: 'MultiSequenceDownload',
  mixins: [DidClickOutside],
  propTypes: {
    sequences: PropTypes.any,
    locusFormatName: PropTypes.any, // *
  },

  getDefaultProps: function () {
    return {
      contigName: null,
      sequences: [],
      locusDisplayName: null, // *
      locusFormatName: null, // *
    };
  },

  getInitialState: function () {
    return {
      isOpen: false,
    };
  },

  render: function () {
    this.btn = [];
    var _hiddenFormNodes = _.map(this.props.sequences, (s, i) => {
      return (
        <form
          ref={(ref) => (this.btn[i] = ref)}
          method="POST"
          action="/download_sequence"
          key={'hiddenNode' + i}
        >
          <input type="hidden" name="header" value={s.header} />
          <input type="hidden" name="sequence" value={s.sequence} />
          <input type="hidden" name="filename" value={s.filename} />
        </form>
      );
    });

    var buttonNodes = _.map(this.props.sequences, (s, i) => {
      var _onClick = (e) => {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        this._handleClick(i);
      };
      return (
        <li key={'seqButton' + i}>
          <a onClick={_onClick}>{s.name}</a>
        </li>
      );
    });
    buttonNodes.push(
      <li key="topSeqButton">
        <a href={'/seqTools?seqname=' + this.props.locusFormatName}>
          Custom Retrieval
        </a>
      </li>
    );

    var hiddenFormContainerNode = (
      <div style={{ display: 'none' }}>{_hiddenFormNodes}</div>
    );

    var openKlass = this.state.isOpen ? 'f-dropdown open' : 'f-dropdown';
    return (
      <div>
        {hiddenFormContainerNode}
        <a
          className="button dropdown small secondary multi-sequence-download-button"
          onClick={this._toggleOpen}
        >
          <i className="fa fa-download" /> Download (.fsa)
        </a>
        <ul
          className={openKlass}
          style={{
            position: 'absolute',
            left: '1rem',
            display: this.state.isOpen ? 'block' : 'none',
          }}
        >
          {buttonNodes}
        </ul>
      </div>
    );
  },

  didClickOutside: function () {
    this.setState({ isOpen: false });
  },

  _toggleOpen: function (e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  },

  // get the DOM node for the form; submit to download
  _handleClick: function (key) {
    this.btn[key].submit();
  },
});

module.exports = MultiSequenceDownload;
