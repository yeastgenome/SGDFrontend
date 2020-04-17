'use strict';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
var React = require('react');
var DidClickOutside = require('../mixins/did_click_outside.jsx');

var FlexibleDropdown = createReactClass({
  displayName: 'FlexibleDropdown',

  mixins: [DidClickOutside],

  propTypes: {
    labelText: PropTypes.string.isRequired,
    innerNode: PropTypes.object.isRequired, // react component
    orientation: PropTypes.string, // "left", "right"
  },

  getDefaultProps: function () {
    return {
      orientation: 'left',
    };
  },

  getInitialState: function () {
    return {
      isActive: false,
    };
  },

  render: function () {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {this._getActiveNode()}
        <a
          className="button dropdown small secondary"
          onClick={this._toggleActive}
        >
          {this.props.labelText}
        </a>
      </div>
    );
  },

  didClickOutside: function () {
    this.setState({ isActive: false });
  },

  _getActiveNode: function () {
    if (!this.state.isActive) return null;

    var _style = {
      position: 'absolute',
      top: '3rem',
      padding: '1rem',
      background: '#b9b9b9',
      zIndex: 2,
    };
    if (this.props.orientation === 'right') _style.right = 0;

    return <div style={_style}>{this.props.innerNode}</div>;
  },

  _toggleActive: function (e) {
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    this.setState((prevState) => ({ isActive: !prevState.isActive }));
  },
});

module.exports = FlexibleDropdown;
