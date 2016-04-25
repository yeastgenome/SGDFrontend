import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Select from 'react-select';
import 'isomorphic-fetch';

const UPLOAD_URL = '/upload';

const FilesIndex = React.createClass({
  getInitialState () {
    return {
      files: null,
      isPending: false,
      isComplete: false,
      error: false
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

  // "old_filepath", "new_filepath", "previous_file_name", "display_name", "status", "topic", "topic_id", "format", "format_id", "extension", "extension_id", "file_date", "is_public", "for_spell", "for_browser", "readme_name", "pmids", "keywords"
  _renderForm () {
    // get today's date in SGD format
    let now = new Date();
    let strMonth = ("0" + (now.getMonth() + 1)).slice(-2);
    let strDate = ("0" + now.getDate()).slice(-2);
    let strToday = `${now.getYear() + 1900}-${strMonth}-${strDate}`;
    let buttonNode = this.state.isPending ? <a className='button disabled secondary'>Uploading</a> : <input type='submit' className='button' value='Upload' />;
    // TEMP local options, need list of topics, formats, extensions, and PMIDs
    const selectOptions = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }];
    return (
      <div className='row'>
        <div className='large-6 columns'>
          <form ref='form' onSubmit={this._onFormSubmit}>
            {this._renderStringField('Name', 'display_name')}
            {this._renderStringField('Previous Name', 'previous_file_name')}
            {this._renderStringField('Path', 'new_filepath')}
            {this._renderStringField('Old File Path', 'old_filepath')}
            {this._renderStringField('Status', 'status')}
            {this._renderMultiSelectField('Keyword(s)', 'keywords', selectOptions)}
            {this._renderSingleSelectField('Topic', 'topic_id', selectOptions)}
            {this._renderSingleSelectField('Format', 'format_id', selectOptions)}
            {this._renderSingleSelectField('Extension', 'extension_id', selectOptions)}
            {this._renderStringField('Date', 'file_date', strToday, 'YYYY-MM-DD')}
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

  _renderStringField(displayName, paramName, defaultValue, placeholder) {
    return (
      <div>
        <label>
          {displayName}
          <input type='text' name={paramName} placeholder={placeholder} defaultValue={defaultValue} />
        </label>
      </div>
    );
  },

  _renderCheckField(displayName, paramName, isChecked) {
    let _id = `sgd-c-check-${paramName}`;
    return (
      <div>
        <input id={_id} type='checkbox' name={paramName} />
        <label htmlFor={_id}>{displayName}</label>
      </div>
    );
  },

  _renderSingleSelectField(displayName, paramName, _options, defaultValue) {
    return (
      <div>
        <label>{displayName}</label>
        <Select name={paramName} value={defaultValue} options={_options} multi={false} />
      </div>
    );
  },

  _renderMultiSelectField(displayName, paramName, _options, defaultValue) {
    return (
      <div>
        <label>{displayName}</label>
        <Select name={paramName} value={defaultValue} options={_options} multi={true} />
      </div>
    );
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

  // only called if the metadata is valid according to json schema
  // do extra valitation and check if file is there
  // TODO, show error if no file
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
    fetch(UPLOAD_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': this.props.csrfToken },
      body: formData
    }).then( response => {
      this.setState({ isPending: false });
      // if not 200 or 400 throw unkown error
      if ([200, 400].indexOf(response.status) < 0) throw new Error('Upload API error.');
      return response.json();
    }).then( responseJson => {
      if (this.isMounted()) {
        this.setState({ isPending: false });
        // error state
        if (responseJson.error) {
          this.setState({ isComplete: false, error: responseJson.error });
        // success
        } else {
          this.setState({ isComplete: true, error: false });
        }
      }
    }).catch( e => {
      this.setState({ error: 'There was an uknown problem with your upload.  Please try again.  If you continue to see this message, please contact sgd-programmers@lists.stanford.edu' });
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

module.exports = connect(mapStateToProps)(Radium(FilesIndex));
