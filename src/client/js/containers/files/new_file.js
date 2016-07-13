import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import moment from 'moment';
import DatePicker from 'react-datepicker';
const Select = require('react-select');
import 'isomorphic-fetch';

import { StringField, CheckField } from '../../components/widgets/form_helpers';

const UPLOAD_URL = '/upload';
const KEYWORDS_URL = '/keywords';
const TOPICS_URL = '/topics';
const FORMATS_URL = '/formats';
const EXTENSIONS_URL = '/extensions';
const REQUEST_TIMEOUT = 5000;
const DATE_FORMAT = 'YYYY/MM/DD hh:mm:ss';

const NewFile = React.createClass({
  getInitialState () {
    return {
      files: null,
      isPending: false,
      isComplete: false,
      error: false,
      rawFileDate: moment(),
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
            <StringField displayName='Name' paramName='display_name' />
            {this._renderStatusSelector()}
            <StringField displayName='Previous Name' paramName='previous_file_name' />
            <StringField displayName='Path' paramName='new_filepath' />
            <StringField displayName='Old File Path' paramName='old_filepath' />
            {this._renderMultiSelectField('Keyword(s)', 'keyword_ids', KEYWORDS_URL)}
            {this._renderSingleSelectField('Topic', 'topic_id', TOPICS_URL)}
            {this._renderSingleSelectField('Format', 'format_id', FORMATS_URL)}
            {this._renderSingleSelectField('Extension', 'extension', EXTENSIONS_URL)}
            {this._renderDateSelector()}
            <CheckField displayName='Public' paramName='is_public' />
            <CheckField displayName='For SPELL' paramName='for_spell' />
            <CheckField displayName='For Browser' paramName='for_browser' />
            <StringField displayName='README name' paramName='readme_name' />
            <StringField displayName='PMIDs' paramName='pmids' placeholder='Comma-separated lis of PMIDs' />
            {this._renderErrors()}
            <div className='text-right'>
              {buttonNode}
            </div>
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

  _renderSingleSelectField (displayName, paramName, optionsUrl) {
    const _onChange = newValue => {
      let obj = {};
      obj[paramName] = newValue;
      this.setState(obj);
    };
    return (
      <div>
        <label>{displayName}</label>
        <Select
          name={paramName} value={this.state[paramName]}
          asyncOptions={this._getAsyncOptions(optionsUrl)}
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
        <Select multi simpleValue joinValues
          name={paramName} value={this.state[paramName]}
          asyncOptions={this._getAsyncOptions(optionsUrl)}
          labelKey='name' valueKey='id'
          onChange={_onChange} 
        />
      </div>
    );
  },

  _renderDateSelector () {
    const _onDateChange = newDate => {
      this.setState({ rawFileDate: newDate });
    };
    return (
      <div>
        <label>Date</label>
        <DatePicker selected={this.state.rawFileDate} onChange={_onDateChange} dateFormat='YYYY/MM/DD' />
        <input type='hidden' name='file_date' value={this._getFormattedTime()} />
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
  },

  _getFormattedTime () {
    return this.state.rawFileDate.format(DATE_FORMAT);
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
