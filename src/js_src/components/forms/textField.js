import React, { Component } from 'react';
import PropTypes from 'prop-types';
/**
 * Renders multi-line input field
 * @prop {string} displayName : label
 * @prop {string} paramName : component name
 * @prop {string} defaultValue : default text value
 * @prop {string} iconClass : font-awesome icon class
 * @prop {string} placeholder : placeholder text
 * @prop {boolean} isReadOnly: read/write flag
 * @func {object} _renderReadOnly: render read-only component
 * @func {object} _renderEdit: render writeable component
 * @func {object} _renderIcon: render font-awesome icon
 *
 */

class TextField extends Component {
  _renderReadOnly () {
    return (
      <div className='form-read-field'>
        <dl className='key-value'>
          <dt>{this._renderIcon()}{this.props.displayName}</dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  }

  _renderEdit () {
    return (
      <div>
        <label>{this._renderIcon()}{this.props.displayName}</label>
        <textarea defaultValue={this.props.defaultValue} className={this.props.className} type='text' name={this.props.paramName} placeholder={this.props.placeholder} required={this.props.isRequired}></textarea>
      </div>
    );
  }

  _renderIcon () {
    return this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
  }

  render () {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  }
}

TextField.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  paramName: PropTypes.string,
  defaultValue: PropTypes.string,
  iconClass: PropTypes.string,
  placeholder: PropTypes.string,
  isReadOnly: PropTypes.bool,
  isRequired: PropTypes.bool,

};

export default TextField;
