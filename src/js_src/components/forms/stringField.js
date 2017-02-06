import React, { Component } from 'react';

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
  defaultValue: React.PropTypes.string,
  displayName: React.PropTypes.string,
  iconClass: React.PropTypes.string,
  isReadOnly: React.PropTypes.bool,
  paramName: React.PropTypes.string,
  placeholder: React.PropTypes.string
};

export default StringField;
