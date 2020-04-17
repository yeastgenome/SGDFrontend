import React from 'react';
import _ from 'underscore';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const DownloadButton = createReactClass({
  displayName: 'DownloadButton',
  propTypes: {
    url: PropTypes.any,
    buttonId: PropTypes.any,
    extension: PropTypes.any,
    params: PropTypes.any,
    text: PropTypes.any,
  },
  getDefaultProps: function () {
    return {
      buttonId: null,
      isButton: true, // false makes a simpler anchor
      url: null, // *
      extension: '.txt',
      params: {},
      text: 'Download',
    };
  },

  render: function () {
    var _paramKeys = _.keys(this.props.params);
    var inputNodes = _.map(_paramKeys, (k, i) => {
      return (
        <input
          type="hidden"
          name={k}
          value={this.props.params[k]}
          key={'downloadKey' + i}
        />
      );
    });

    return (
      <form method="POST" action={this.props.url}>
        {inputNodes}
        <button id={this.props.buttonId} className="button small secondary">
          <i className="fa fa-download" /> {this.props.text} (
          {this.props.extension})
        </button>
      </form>
    );
  },
});

module.exports = DownloadButton;
