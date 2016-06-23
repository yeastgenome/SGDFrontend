import React from 'react';

import EditableList from './editable_list';

export const CheckField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultChecked: React.PropTypes.bool,
    iconClass: React.PropTypes.string
  },

  render () {
    let _id = `sgd-c-check-${this.props.paramName}`;
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <input id={_id} type='checkbox' name={this.props.paramName} defaultChecked={this.props.defaultChecked} />
        <label htmlFor={_id}>{iconNode}{this.props.displayName}</label>
      </div>
    );
  }
});

export const StringField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string
  },

  render () {
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <label>{iconNode}{this.props.displayName}</label>
        <input type='text' name={this.props.paramName} placeholder={this.props.placeholder} defaultValue={this.props.defaultValue} />
      </div>
    );
  }
});

export const ListField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    defaultValues: React.PropTypes.array
  },

  getInitialState() {
    return {
      values: this.props.defaultValues || []
    };
  },

  render () {
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <label>{iconNode}{this.props.displayName}</label>
        <EditableList onUpdate={this._onUpdate} placeholder={this.props.placeholder} />
        <input type='hidden' name={this.props.paramName} value={JSON.stringify(this.state.values)} />
      </div>
    );
  },

  _onUpdate (newValues) {
    this.setState({ values: newValues });
  }
});
