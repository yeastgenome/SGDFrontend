import React, { Component } from 'react';
import Select from 'react-select';

const DELIMITER = '@@';

class MultiSelectField extends Component {
  getDefaultProps () {
    return {
      isMulti: true
    };
  }

  getInitialState () {
    let defaultValues = this.props.defaultValues || [];
    // if string is supplied, convert to array
    if (typeof defaultValues === 'string') {
      defaultValues = defaultValues.split(DELIMITER);
    }
    return {
      values: defaultValues || []
    };
  }

  _renderReadOnly () {
    let displayValuesStr = this.state.values.reduce( (prev, d, i) => {
      let maybeComma = (i === this.state.values.length) ? '' : ', ';
      let name = (typeof d === 'string') ? d : d.name;
      prev += `${name}${maybeComma}`;
      return prev;
    }, '');
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;

    let extendedProps = _.extend({ defaultValue: displayValuesStr }, this.props);
    return <StringField {...extendedProps} />;
  }

  _onChange (newValues) {
    newValues = newValues ? newValues.split(DELIMITER) : [];
    this.setState({ values: newValues });
  }

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
  }
}

MultiSelectField.propTypes = {
  displayName: React.PropTypes.string,
  optionsUrl: React.PropTypes.string,
  paramName: React.PropTypes.string,
  defaultValues: React.PropTypes.array,
  iconClass: React.PropTypes.string,
  defaultOptions: React.PropTypes.array,
  isReadOnly: React.PropTypes.bool,
  allowCreate: React.PropTypes.bool,
  isMulti: React.PropTypes.bool
};

export default MultiSelectField;
