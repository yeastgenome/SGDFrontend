import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import 'isomorphic-fetch';

import Loader from '../../components/widgets/loader';

const UPLOAD_URL = '/upload';

const FilesIndex = React.createClass({
  getInitialState () {
    return {
      files: null,
      isPending: false,
      isComplete: false,
    };
  },

  render () {
    return (
      <div>
        <h1>Dataset Upload</h1>
        <hr />
        {this._renderFormOrMessage()}
      </div>
    );
  },

  _renderFormOrMessage () {
    if (this.state.isPending) return <Loader />;
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
    let strMonth = ("0" + now.getMonth()).slice(-2);
    let strDate = ("0" + now.getDate()).slice(-2);
    let strToday = `${now.getYear() + 1900}-${strMonth}-${strDate}`;
    return (
      <form ref='form' onSubmit={this._onFormSubmit}>
        <div className='row'>
          <div className='large-12 columns'>
            {this._renderFileDrop()}
          </div>
          {this._renderStringField('Name', 'display_name')}
          {this._renderStringField('Previous Name', 'previous_file_name')}
          {this._renderStringField('Old File Path', 'old_filepath')}
          {this._renderStringField('New File Path', 'new_filepath')}
          {this._renderStringField('Status', 'status')}
          {this._renderStringField('Date', 'file_date', strToday, 'YYYY-MM-DD')}
          {this._renderCheckField('Public', 'is_public')}
          {this._renderCheckField('For SPELL', 'for_spell')}
          {this._renderCheckField('For Browser', 'for_browser')}
          <div className='large-12 columns'>
            <input type='submit' className='button' value='Upload' />
          </div>
        </div>
      </form>
    );
  },

  _renderStringField(displayName, paramName, defaultValue, placeholder) {
    return (
      <div className='large-12 columns'>
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
      <div className='large-12 columns'>
        <input type='checkbox' name={paramName} id={_id} />
        <label htmlFor={_id}>{displayName}</label>
      </div>
    );
  },

  _renderFileDrop () {
    if (this.state.files) return <p className='text-left'>{this.state.files[0].name}</p>;
    return (
      <Dropzone onDrop={this._onDrop}>
        <p style={[styles.dropMessage]}>Drop file here or click to select.</p>
        <h3><i className='fa fa-upload' /></h3>
      </Dropzone>
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
    console.log(_files)
    this.setState({ files: _files });
  },

  _uploadFile (formData) {
    this.setState({ isPending: true });
    fetch(UPLOAD_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': this.props.csrfToken,        
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: formData
    }).then( response => {
      if (this.isMounted()) {
        console.log(response)
        this.setState({
          isPending: false,
          isComplete: true,
        });
      }
    });
  }
});

const styles = {
  dropZoneContainer: {
    marginBottom: '0.5rem'
  },
  dropMessage: {
    margin: '1rem'
  },
}


function mapStateToProps(_state) {
  let state = _state.auth;
  return {
    csrfToken: state.csrfToken,
  };
};

module.exports = connect(mapStateToProps)(Radium(FilesIndex));
