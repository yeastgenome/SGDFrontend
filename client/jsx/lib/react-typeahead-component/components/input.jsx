'use strict';

var React = require('react');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

module.exports = createReactClass({
  displayName: 'Input',

  propTypes:
    process.env.NODE_ENV === 'production'
      ? {}
      : {
          value: PropTypes.string,
          onChange: PropTypes.func,
        },

  getDefaultProps: function () {
    return {
      value: '',
      onChange: function () {},
    };
  },

  componentDidUpdate: function () {
    var _this = this,
      dir = _this.props.dir;

    if (dir === null || dir === undefined) {
      // When setting an attribute to null/undefined,
      // React instead sets the attribute to an empty string.

      // This is not desired because of a possible bug in Chrome.
      // If the page is RTL, and the input's `dir` attribute is set
      // to an empty string, Chrome assumes LTR, which isn't what we want.
      this.input.removeAttribute('dir');
    }
  },

  render: function () {
    var _this = this;

    return (
      <input
        ref={(input) => (this.input = input)}
        {..._this.props}
        onChange={_this.handleChange}
        autoComplete="off"
      />
    );
  },

  handleChange: function (event) {
    var props = this.props;

    // There are several React bugs in IE,
    // where the `input`'s `onChange` event is
    // fired even when the value didn't change.
    // https://github.com/facebook/react/issues/2185
    // https://github.com/facebook/react/issues/3377
    if (event.target.value !== props.value) {
      props.onChange(event);
    }
  },

  focus: function () {
    this.input.focus();
  },

  blur: function () {
    this.input.blur();
  },

  isCursorAtEnd: function () {
    var _this = this,
      inputDOMNode = this.input,
      valueLength = _this.props.value.length;

    return (
      inputDOMNode.selectionStart === valueLength &&
      inputDOMNode.selectionEnd === valueLength
    );
  },
});
