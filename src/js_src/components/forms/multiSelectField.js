import React, { Component } from 'react';
import { Async } from 'react-select';
import PropTypes from 'prop-types';
import fetchData from '../../lib/fetchData';


class MultiSelectField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: {}
    };
  }

  handleChange(newValue) {
    this.setState({ value: newValue });
  }

  // from a URL, returns the fetch function needed to get the options
  getAsyncOptions (input, cb) {
    let url = `${this.props.optionsUrl}${input}`;
    fetchData(url)
      .then( response => {
        let optionsObj = {
          options: response.results,
          complete: true
        };
        return cb(null, optionsObj);
      });
  }

  render () {
    let iconNode = this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
    return (
      <div className='selectContainer'>
        <label>{iconNode}{this.props.displayName}</label>
        <Async
          onChange={this.handleChange.bind(this)}
          name={this.props.paramName} value={this.state.value}
          loadOptions={this.getAsyncOptions.bind(this)}
          labelKey='name' valueKey='name'
          allowCreate
          cache={false}
        />
      </div>
    );
  }
}

MultiSelectField.propTypes = {
  displayName: PropTypes.string,
  optionsUrl: PropTypes.string,
  paramName: PropTypes.string,
  defaultValues: PropTypes.array,
  iconClass: PropTypes.string,
  defaultOptions: PropTypes.array,
  allowCreate: PropTypes.bool
};

export default MultiSelectField;
