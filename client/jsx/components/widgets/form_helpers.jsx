import React from 'react';
import Select from 'react-select';
import _ from 'underscore';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
const DELIMITER = '@@';

export const CheckField = createReactClass({
  propTypes: {
    displayName: PropTypes.string,
    paramName: PropTypes.string,
    defaultChecked: PropTypes.bool,
    iconClass: PropTypes.string,
    isReadOnly: PropTypes.bool,
  },

  render() {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let _id = `sgd-c-check-${this.props.paramName}`;
    let iconNode = this.props.iconClass ? (
      <span>
        <i className={`fa fa-${this.props.iconClass}`} />{' '}
      </span>
    ) : null;
    return (
      <div>
        <input
          id={_id}
          type="checkbox"
          name={this.props.paramName}
          defaultChecked={this.props.defaultChecked}
        />
        <label htmlFor={_id}>
          {iconNode}
          {this.props.displayName}
        </label>
      </div>
    );
  },

  _renderReadOnly() {
    let stringVal = this.props.defaultChecked ? 'true' : 'false';
    let extendedProps = _.clone(this.props);
    extendedProps.defaultValue = stringVal;
    return <StringField {...extendedProps} />;
  },
});

export const StringField = createReactClass({
  propTypes: {
    displayName: PropTypes.string,
    paramName: PropTypes.string,
    // defaultValue: string or nodes
    iconClass: PropTypes.string,
    placeholder: PropTypes.string,
    isReadOnly: PropTypes.bool,
    defaultValue: PropTypes.any,
  },

  render() {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  },

  _renderReadOnly() {
    if (this.props.paramName == 'colleague_note') {
      let tempStr = this.props.defaultValue.match(/\<a.*\>/);
      let tempArr = this.props.defaultValue.split(/\<a.*\>/);

      return (
        <div className="form-read-field">
          <dl className="key-value">
            <dt>
              {this._renderIcon()}
              {this.props.displayName}
            </dt>
            <dd>
              {tempArr[0]}{' '}
              <span dangerouslySetInnerHTML={{ __html: tempStr[0] }} />
              {tempArr[1]}
            </dd>
          </dl>
        </div>
      );
    }
    return (
      <div className="form-read-field">
        <dl className="key-value">
          <dt>
            {this._renderIcon()}
            {this.props.displayName}
          </dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  },

  _renderEdit() {
    return (
      <div>
        <label>
          {this._renderIcon()}
          {this.props.displayName}
        </label>
        <input
          type="text"
          name={this.props.paramName}
          placeholder={this.props.placeholder}
          defaultValue={this.props.defaultValue}
        />
      </div>
    );
  },

  _renderIcon() {
    return this.props.iconClass ? (
      <span>
        <i className={`fa fa-${this.props.iconClass}`} />{' '}
      </span>
    ) : null;
  },
});

export const TextField = createReactClass({
  propTypes: {
    displayName: PropTypes.string,
    paramName: PropTypes.string,
    defaultValue: PropTypes.string,
    iconClass: PropTypes.string,
    placeholder: PropTypes.string,
    isReadOnly: PropTypes.bool,
  },

  render() {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  },

  _renderReadOnly() {
    return (
      <div className="form-read-field">
        <dl className="key-value">
          <dt>
            {this._renderIcon()}
            {this.props.displayName}
          </dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  },

  _renderEdit() {
    return (
      <div>
        <label>
          {this._renderIcon()}
          {this.props.displayName}
        </label>
        <textarea
          type="text"
          name={this.props.paramName}
          placeholder={this.props.placeholder}
          value={this.props.defaultValue}
        />
      </div>
    );
  },

  _renderIcon() {
    return this.props.iconClass ? (
      <span>
        <i className={`fa fa-${this.props.iconClass}`} />{' '}
      </span>
    ) : null;
  },
});

export const MultiSelectField = createReactClass({
  propTypes: {
    displayName: PropTypes.string,
    optionsUrl: PropTypes.string,
    paramName: PropTypes.string,
    defaultValues: PropTypes.array,
    iconClass: PropTypes.string,
    defaultOptions: PropTypes.array,
    isReadOnly: PropTypes.bool,
    allowCreate: PropTypes.bool,
    isMulti: PropTypes.bool,
    isLinks: PropTypes.bool,
    formatLink: PropTypes.func,
  },

  getDefaultProps() {
    return {
      isMulti: true,
    };
  },

  componentDidMount() {
    this._isMounted = true;
  },

  componentWillUnmount() {
    this._isMounted = false;
  },

  getInitialState() {
    let defaultValues = this.props.defaultValues || '';
    // if string is supplied, convert to array
    if (typeof defaultValues === 'string') {
      defaultValues = defaultValues.split(DELIMITER);
    }
    return {
      values: defaultValues,
    };
  },

  render() {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let iconNode = this.props.iconClass ? (
      <span>
        <i className={`fa fa-${this.props.iconClass}`} />{' '}
      </span>
    ) : null;
    return (
      <div>
        <label>
          {iconNode}
          {this.props.displayName}
        </label>
        <Select
          multi={this.props.isMulti}
          joinValues
          name={this.props.paramName}
          value={this.state.values}
          asyncOptions={this._getAsyncOptions()}
          labelKey="name"
          valueKey="name"
          onChange={this._onChange}
          delimiter={DELIMITER}
          allowCreate={this.props.allowCreate}
        />
      </div>
    );
  },

  _renderReadOnly() {
    let values;
    if (this.props.isLinks) {
      values = this.state.values.map((d, i) => {
        let url = this.props.formatLink(d);
        let maybeComma =
          i === this.state.values.length - 1 ? null : <span>, </span>;
        return (
          <span key={`collA${d.format_name}`}>
            <a href={url}>{d.name}</a>
            {maybeComma}
          </span>
        );
      });
    } else {
      values = this.state.values.reduce((prev, d, i) => {
        let maybeComma = i === this.state.values.length - 1 ? '' : ', ';
        let name = typeof d === 'string' ? d : d.name;
        prev += `${name}${maybeComma}`;
        return prev;
      }, '');
    }
    let extendedProps = _.extend({ defaultValue: values }, this.props);
    return <StringField {...extendedProps} />;
  },

  _onChange(newValues) {
    newValues = newValues ? newValues.split(DELIMITER) : [];
    this.setState({ values: newValues });
  },

  // from a URL, returns the fetch function needed to get the options
  _getAsyncOptions() {
    return (input, cb) => {
      let url = `${this.props.optionsUrl}${input}`;
      fetch(url)
        .then((response) => {
          return response.json();
        })
        .then((optionsObj) => {
          // add defaultOptions to results and remove duplicated
          let defaultOptions = this.props.defaultOptions || [];
          optionsObj.options = _.uniq(
            optionsObj.results.concat(defaultOptions)
          );
          if (!this._isMounted) return;
          return cb(null, optionsObj);
        });
    };
  },
});

export const SelectField = createReactClass({
  propTypes: {
    displayName: PropTypes.string,
    paramName: PropTypes.string,
    defaultValue: PropTypes.string,
    iconClass: PropTypes.string,
    options: PropTypes.array,
    isReadOnly: PropTypes.bool,
    allowCreate: PropTypes.bool,
  },

  getInitialState() {
    return {
      value: this.props.defaultValue || '',
    };
  },

  render() {
    if (this.props.isReadOnly) return this._renderReadOnly();
    let iconNode = this.props.iconClass ? (
      <span>
        <i className={`fa fa-${this.props.iconClass}`} />{' '}
      </span>
    ) : null;
    return (
      <div>
        <label>
          {iconNode}
          {this.props.displayName}
        </label>
        <Select
          name={this.props.paramName}
          value={this.state.value}
          options={this.props.options}
          clearable={false}
          labelKey="name"
          valueKey="id"
          onChange={this._onChange}
          allowCreate={this.props.allowCreate}
        />
      </div>
    );
  },

  _renderReadOnly() {
    return <StringField {...this.props} />;
  },

  _onChange(newValue) {
    this.setState({ value: newValue });
  },
});
