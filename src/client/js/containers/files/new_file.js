import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import moment from 'moment';
import DatePicker from 'react-datepicker';
const Select = require('react-select');
import 'isomorphic-fetch';

const UPLOAD_URL = '/upload';
const KEYWORDS_URL = '/keywords';
const TOPICS_URL = '/topics';
const FORMATS_URL = '/formats';
const EXTENSIONS_URL = '/extensions';
const REQUEST_TIMEOUT = 5000;

const NewFile = React.createClass({
  getInitialState () {
    return {
      files: null,
      isPending: false,
      isComplete: false,
      error: false,
      time: moment(),
    };
  },

  render () {
    return (
      <div>
        <div className='row'>
          <div className='large-12 columns'>
            <h1>Dataset Upload</h1>
            <hr />
          </div>
        </div>
        {this._renderFormOrMessage()}
      </div>
    );
  },

  _renderFormOrMessage () {
    if (this.state.isComplete) {
      return (
        <p>File uploaded successfully.</p>
      );
    }
    return this._renderForm();
  },

  _renderForm () {
    let buttonNode = this.state.isPending ? <a className='button disabled secondary'>Uploading</a> : <input type='submit' className='button' value='Upload' />;
    return (
      <div className='row'>
        <div className='large-6 columns'>
          <form ref='form' onSubmit={this._onFormSubmit}>
            {this._renderStringField('Name', 'display_name')}
            {this._renderStatusSelector()}
            {this._renderStringField('Previous Name', 'previous_file_name')}
            {this._renderStringField('Path', 'new_filepath')}
            {this._renderStringField('Old File Path', 'old_filepath')}
            {this._renderMultiSelectField('Keyword(s)', 'keyword_ids', KEYWORDS_URL)}
            {this._renderSingleSelectField('Topic', 'topic_id', TOPICS_URL)}
            {this._renderSingleSelectField('Format', 'format_id', FORMATS_URL)}
            {this._renderSingleSelectField('Extension', 'extension', EXTENSIONS_URL)}
            {this._renderDateSelector()}
            {this._renderCheckField('Public', 'is_public')}
            {this._renderCheckField('For SPELL', 'for_spell')}
            {this._renderCheckField('For Browser', 'for_browser')}
            {this._renderStringField('README name', 'readme_name')}
            {this._renderStringField('PMIDs', 'pmids', '', 'Comma-separated list of PMIDs')}
            {this._renderErrors()}
            {buttonNode}
          </form>
        </div>
        <div className='large-6 columns'>
          {this._renderFileDrop()}
        </div>
      </div>
    );
  },

  // hardcoded for 'Active' and 'Archived'
  _renderStatusSelector () {
    return (
      <div>
        <label>Status</label>
        <input id='upActiveRadio' defaultChecked type='radio' name='status' value='Active' /><label htmlFor='upActiveRadio'>Active</label>
        <input id='upArchivedRadio' type='radio' name='status' value='Archived' /><label htmlFor='upArchivedRadio'>Archived</label>
      </div>
    );
  },

  _renderStringField (displayName, paramName, defaultValue, placeholder) {
    return (
      <div>
        <label>{displayName}</label>
        <input type='text' name={paramName} placeholder={placeholder} defaultValue={defaultValue} />
      </div>
    );
  },

  _renderCheckField (displayName, paramName, isChecked) {
    let _id = `sgd-c-check-${paramName}`;
    return (
      <div>
        <input id={_id} type='checkbox' name={paramName} />
        <label htmlFor={_id}>{displayName}</label>
      </div>
    );
  },

  _renderSingleSelectField (displayName, paramName, optionsUrl) {
    const _onChange = newValue => {
      let obj = {};
      obj[paramName] = newValue;
      this.setState(obj);
    };
    return (
      <div>
        <label>{displayName}</label>
        <Select.Async
          name={paramName} value={this.state[paramName]}
          loadOptions={this._getAsyncOptions(optionsUrl)}
          labelKey='name' valueKey='id'
          onChange={_onChange}
        />
      </div>
    );
  },

  _renderMultiSelectField (displayName, paramName, optionsUrl) {
    const _onChange = newValue => {
      newValue = newValue ? newValue.split(',').map( d => { return parseInt(d); }) : [];
      let obj = {};
      obj[paramName] = newValue;
      this.setState(obj);
    };
    return (
      <div>
        <label>{displayName}</label>
        <Select.Async multi simpleValue joinValues
          name={paramName} value={this.state[paramName]}
          loadOptions={this._getAsyncOptions(optionsUrl)}
          labelKey='name' valueKey='id'
          onChange={_onChange} 
        />
      </div>
    );
  },

  _renderDateSelector () {
    return (
      <div>
        <label>Date</label>
        // <DatePicker />
        <input type='text' name='file_date' />
      </div>
    );
  },

  // from a URL, returns the fetch function needed to get the options
  _getAsyncOptions (optionsUrl) {
    return (input, cb) => {
      return fetch(optionsUrl)
        .then( response => {
          return response.json();
        });
    };
  },

  _renderErrors () {
    if (!this.state.error) return null;
    return (
      <div className='callout warning'>
        <p>{this.state.error}</p>
      </div>
    );
  },

  _renderFileDrop () {
    if (this.state.files) return <p className='text-left'>{this.state.files[0].name}</p>;
    return (
      <div style={[styles.dropZoneContainer]}>
        <Dropzone onDrop={this._onDrop}>
          <p style={[styles.dropMessage]}>Drop file here or click to select.</p>
          <h3 style={[styles.dropIcon]}><i className='fa fa-upload' /></h3>
        </Dropzone>
      </div>
    );
  },

  _onFormSubmit (e) {
    e.preventDefault();
    let formData = new FormData(this.refs.form);
    if (this.state.files) {
      formData.append('file', this.state.files[0]);
    }
    this._uploadFile(formData);
  },

  _onDrop (_files) {
    this.setState({ files: _files });
  },

  _uploadFile (formData) {
    this.setState({ isPending: true });
    // timeout isomorphic fetch per https://github.com/whatwg/fetch/issues/20
    let p = Promise.race([
      fetch(UPLOAD_URL, {
        method: 'POST',
        timeout: REQUEST_TIMEOUT,
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': this.props.csrfToken },
        body: formData
      }),
      new Promise(function (resolve, reject) {
        setTimeout(() => reject(new Error('request timeout')), REQUEST_TIMEOUT);
      })
    ]);
    p.then( response => {
      this.setState({ isPending: false });
      // if not 200 or 400 throw unkown error
      if ([200, 400].indexOf(response.status) < 0) throw new Error('Upload API error.');
      return response.json();
    }).then( responseJson => {
      if (this.isMounted()) {
        // error state
        if (responseJson.error) {
          this.setState({ isComplete: false, error: responseJson.error });
        // success
        } else {
          this.setState({ isComplete: true, error: false });
        }
      }
    });
    p.catch( e => {
      this.setState({
        isPending: false,
        isComplete: false,
        error: 'There was an uknown problem with your upload.  Please try again.  If you continue to see this message, please contact sgd-programmers@lists.stanford.edu'
      });
    });
  }
});

const styles = {
  dropZoneContainer: {
    marginTop: '1.5rem'
  },
  dropMessage: {
    margin: '1rem'
  },
  dropIcon: {
    textAlign: 'center'
  }
};

function mapStateToProps(_state) {
  let state = _state.auth;
  return {
    csrfToken: state.csrfToken,
  };
};

module.exports = connect(mapStateToProps)(Radium(NewFile));
