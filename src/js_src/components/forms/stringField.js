import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
        <input defaultValue={this.props.defaultValue} name={this.props.paramName} placeholder={this.props.placeholder} type='text' />
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
  iconClass: PropTypes.string,
  isReadOnly: PropTypes.bool,
  paramName: PropTypes.string,
  placeholder: PropTypes.string
};

export default StringField;
