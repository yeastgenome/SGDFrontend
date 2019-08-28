import React, { Component } from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import StringField from './stringField';

class CheckField extends Component {
  _renderReadOnly() {
    let stringVal = this.props.defaultChecked ? 'true' : 'false';
    let extendedProps = _.clone(this.props);
    extendedProps.defaultValue = stringVal;
    return <StringField {...extendedProps} />;
  }

  render() {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let _id = `sgd-c-check-${this.props.paramName}`;
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <input id={_id} type='checkbox' name={this.props.paramName} defaultChecked={this.props.defaultChecked} />
        <label htmlFor={_id}>{iconNode}{this.props.displayName}</label>
      </div>
    );
  }
}

CheckField.propTypes = {
  defaultChecked: PropTypes.bool,
  displayName: PropTypes.string,
  paramName: PropTypes.string,
  iconClass: PropTypes.string,
  isReadOnly: PropTypes.bool
};

export default CheckField;
