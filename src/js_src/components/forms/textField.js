import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
        <textarea type='text' name={this.props.paramName} placeholder={this.props.placeholder}>{this.props.defaultValue}</textarea>
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
  displayName: PropTypes.string,
  paramName: PropTypes.string,
  defaultValue: PropTypes.string,
  iconClass: PropTypes.string,
  placeholder: PropTypes.string,
  isReadOnly: PropTypes.bool
};

export default TextField;
