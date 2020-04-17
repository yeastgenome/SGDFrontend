'use strict';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
var WIDTH = 400;

class HelpIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      textIsVisible: false,
    };

    this.handleOnClick = this.handleOnClick.bind(this);
    this.handleToggleTextVisible = this.handleToggleTextVisible.bind(this);
  }

  // click handler for icon
  handleToggleTextVisible(e) {
    e.nativeEvent.stopImmediatePropagation();
    this.setState((prevState) => ({
      textIsVisible: !prevState.textIsVisible,
    }));
  }

  render() {
    // get text (null if unless textIsVisible)
    var textNode = this._getTextNode();

    var _iconKlass = this.props.isInfo ? 'info-circle' : 'question-circle';
    var iconKlass = `fa fa-${_iconKlass}`;

    return (
      <span className="context-help-icon" style={{ position: 'relative' }}>
        {textNode}
        <a onClick={this.handleToggleTextVisible}>
          <i className={iconKlass}></i>
        </a>
      </span>
    );
  }

  handleOnClick() {
    if (this.state.textIsVisible) {
      this.setState({ textIsVisible: false });
    }
  }

  // add event listener to document to dismiss when clicking
  componentDidMount() {
    document.addEventListener('click', this.handleOnClick);
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.handleOnClick);
  }

  _getTextNode() {
    var textNode = null;
    if (this.state.textIsVisible) {
      var _onClick = (e) => {
        return e.nativeEvent.stopImmediatePropagation();
      };
      var _orientKlass =
        this.props.orientation === 'left' ? 'drop-left' : 'drop-right';
      var _klass = `f-dropdown content medium ${_orientKlass}`;
      var _left = this.props.orientation === 'left' ? -WIDTH : '1em';
      textNode = (
        <p
          className={_klass}
          style={{ width: WIDTH, top: -7, left: _left, textAlign: 'left' }}
          onClick={_onClick}
          dangerouslySetInnerHTML={{ __html: this.props.text }}
        />
      );
    }

    return textNode;
  }
}

HelpIcon.propTypes = {
  isInfo: PropTypes.any,
  orientation: PropTypes.any,
  text: PropTypes.any,
};

HelpIcon.defaultProps = {
  text: '',
  orientation: 'right',
  isInfo: false, // makes an "i" if true, default is "?"
};

module.exports = HelpIcon;
