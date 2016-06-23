import React from 'react';
import { Async } from 'react-select';
import _ from 'underscore';

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
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    defaultValues: React.PropTypes.array
  },

  getInitialState () {
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

export const MultiSelectField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    optionsUrl: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValues: React.PropTypes.array,
    iconClass: React.PropTypes.string,
    defaultOptions: React.PropTypes.array
  },

  getInitialState () {
    return {
      values: this.props.defaultValues || []
    };
  },

  render () {
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <label>{iconNode}{this.props.displayName}</label>
        <Async multi simpleValue joinValues
          name={this.props.paramName} value={this.state.values}
          loadOptions={this._getAsyncOptions()}
          labelKey='name' valueKey='id'
          onChange={this._onChange} 
        />
      </div>
    );
  },

  _onChange (newValues) {
    newValues = newValues ? newValues.split(',').map( d => { return parseInt(d); }) : [];
    this.setState({ values: newValues });
  },

  // from a URL, returns the fetch function needed to get the options
  _getAsyncOptions () {
    return (input, cb) => {
      return fetch(this.props.optionsUrl)
        .then( response => {
          return response.json();
        }).then( optionsObj => {
          // add defaultOptions to results and remove duplicated
          let defaultOptions = this.props.defaultOptions || [];
          optionsObj.options = _.uniq(optionsObj.options.concat(defaultOptions))
          return optionsObj;
        });
    };
  },

  _onUpdate (newValues) {
    this.setState({ values: newValues });
  }
});
