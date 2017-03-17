import React from 'react';
import Select from 'react-select';
import _ from 'underscore';

const DELIMITER = '@@';

export const CheckField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultChecked: React.PropTypes.bool,
    iconClass: React.PropTypes.string,
    isReadOnly: React.PropTypes.bool
  },

  render () {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let _id = `sgd-c-check-${this.props.paramName}`;
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <input id={_id} type='checkbox' name={this.props.paramName} defaultChecked={this.props.defaultChecked} />
        <label htmlFor={_id}>{iconNode}{this.props.displayName}</label>
      </div>
    );
  },

  _renderReadOnly () {
    let stringVal = this.props.defaultChecked ? 'true' : 'false';
    let extendedProps = _.clone(this.props);
    extendedProps.defaultValue = stringVal;
    return <StringField {...extendedProps} />;
  }
});

export const StringField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    // defaultValue: string or nodes
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    isReadOnly: React.PropTypes.bool
  },

  render () {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  },

  _renderReadOnly () {
    return (
      <div className='form-read-field'>
        <dl className='key-value'>
          <dt>{this._renderIcon()}{this.props.displayName}</dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  },

  _renderEdit () {
    return (
      <div>
        <label>{this._renderIcon()}{this.props.displayName}</label>
        <input type='text' name={this.props.paramName} placeholder={this.props.placeholder} defaultValue={this.props.defaultValue} />
      </div>
    );
  },

  _renderIcon () {
    return this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
  }
});

export const TextField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    isReadOnly: React.PropTypes.bool
  },

  render () {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  },

  _renderReadOnly () {
    return (
      <div className='form-read-field'>
        <dl className='key-value'>
          <dt>{this._renderIcon()}{this.props.displayName}</dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  },

  _renderEdit () {
    return (
      <div>
        <label>{this._renderIcon()}{this.props.displayName}</label>
        <textarea type='text' name={this.props.paramName} placeholder={this.props.placeholder}>{this.props.defaultValue}</textarea>
      </div>
    );
  },

  _renderIcon () {
    return this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
  }
});

export const MultiSelectField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    optionsUrl: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValues: React.PropTypes.array,
    iconClass: React.PropTypes.string,
    defaultOptions: React.PropTypes.array,
    isReadOnly: React.PropTypes.bool,
    allowCreate: React.PropTypes.bool,
    isMulti: React.PropTypes.bool,
    isLinks: React.PropTypes.bool,
    formatLink: React.PropTypes.func
  },

  getDefaultProps () {
    return {
      isMulti: true
    };
  },

  getInitialState () {
    let defaultValues = this.props.defaultValues || [];
    // if string is supplied, convert to array
    if (typeof defaultValues === 'string') {
      defaultValues = defaultValues.split(DELIMITER);
    }
    return {
      values: defaultValues || []
    };
  },

  render () {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <label>{iconNode}{this.props.displayName}</label>
        <Select multi={this.props.isMulti} joinValues
          name={this.props.paramName} value={this.state.values}
          asyncOptions={this._getAsyncOptions()}
          labelKey='name' valueKey='name'
          onChange={this._onChange} delimiter={DELIMITER}
          allowCreate={this.props.allowCreate}
        />
      </div>
    );
  },

  _renderReadOnly () {
    let values;
    if (this.props.isLinks) {
      values = this.state.values.map( (d, i) => {
        let url = this.props.formatLink(d);
        let maybeComma = (i === this.state.values.length - 1) ? null : <span>, </span>;
        return <span key={`collA${d.format_name}`}><a href={url}>{d.name}</a>{maybeComma}</span>;
      });
    } else {
      values = this.state.values.reduce( (prev, d, i) => {
        let maybeComma = (i === this.state.values.length - 1) ? '' : ', ';
        let name = (typeof d === 'string') ? d : d.name;
        prev += `${name}${maybeComma}`;
        return prev;
      }, '');
    }
    let extendedProps = _.extend({ defaultValue: values }, this.props);
    return <StringField {...extendedProps} />;
  },

  _onChange (newValues) {
    newValues = newValues ? newValues.split(DELIMITER) : [];
    this.setState({ values: newValues });
  },

  // from a URL, returns the fetch function needed to get the options
  _getAsyncOptions () {
    return (input, cb) => {
      let url = `${this.props.optionsUrl}${input}`;
      fetch(url)
        .then( response => {
          return response.json();
        }).then( optionsObj => {
          // add defaultOptions to results and remove duplicated
          let defaultOptions = this.props.defaultOptions || [];
          optionsObj.options = _.uniq(optionsObj.results.concat(defaultOptions));
          if (!this.isMounted()) return;
          return cb(null, optionsObj);
        });
    };
  }
});

export const SelectField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    iconClass: React.PropTypes.string,
    options: React.PropTypes.array,
    isReadOnly: React.PropTypes.bool,
    allowCreate: React.PropTypes.bool
  },

  getInitialState () {
    return {
      value: this.props.defaultValue || ''
    };
  },

  render () {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div>
        <label>{iconNode}{this.props.displayName}</label>
        <Select
          name={this.props.paramName} value={this.state.value}
          options={this.props.options} clearable={false}
          labelKey='name' valueKey='id'
          onChange={this._onChange} allowCreate={this.props.allowCreate} 
        />
      </div>
    );
  },

  _renderReadOnly () {
    return <StringField {...this.props} />;
  },

  _onChange (newValue) {
    this.setState({ value: newValue });
  }
});
