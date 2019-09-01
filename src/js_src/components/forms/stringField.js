import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Renders single line input field
 * @prop {string} defaultValue : default text value
 * @prop {string} displayName : clabel
 * @prop {string} id: element id
 * @prop {string} iconClass : font-awesome icon class
 * @prop {boolean} isReadOnly : read/write flag
 * @prop {string} paramName : component name
 * @prop {string} placeholder : placeholder text
 * @func {object} _renderReadOnly: render read-only component
 * @func {object} _renderEdit: render writeable component
 * @func {object} _renderIcon: render font-awesome icon
 * @prop {boolean} isRequired: reqiored flag
 */

class StringField extends Component {
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
        <input defaultValue={this.props.defaultValue} id={this.props.id} name={this.props.paramName} placeholder={this.props.placeholder} type='text' required={this.props.isRequired} />
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

StringField.propTypes = {
  defaultValue: PropTypes.string,
  displayName: PropTypes.string,
  id: PropTypes.string,
  iconClass: PropTypes.string,
  isReadOnly: PropTypes.bool,
  paramName: PropTypes.string,
  placeholder: PropTypes.string,
  isRequired: PropTypes.bool
};

export default StringField;
