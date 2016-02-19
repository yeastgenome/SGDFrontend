import Radium from 'radium';
import React from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import 'isomorphic-fetch';

import Loader from '../../components/widgets/loader';
import TForm from '../../components/widgets/t_form';

const SCHEMA_OBJ = {
  title: 'Dataset',
  type: 'object',
  properties: {
    file_display_name: { type: 'string' },
    topic: { type: 'string' },
    keywords: { type: 'string' },
    pmids: { type: 'string' },
    is_public: { type: 'boolean' },
    for_spell: { type: 'boolean' },
    for_browser: { type: 'boolean' },
    file_format: { type: 'string' },
    date: { type: 'string' }
  },
  required: ['file_display_name', 'date']
};
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

  _renderForm () {
    return (
      <div className='row'>
        <div className='columns small-6'>
          <TForm validationObject={SCHEMA_OBJ} onSubmit={this._onFormSubmit} submitText='Upload' cancelHref='/dashboard/files' />
        </div>
        <div className='columns small-6'>
          <label>File</label>
          <div style={[styles.dropZoneContainer]} className='text-center'>
            <Dropzone onDrop={this._onDrop}>
              <p style={[styles.dropMessage]}>Drop file here or click to select.</p>
              <h3><i className='fa fa-upload' /></h3>
            </Dropzone>
          </div>
        </div>
      </div>
    );
  },

  // only called if the metadata is valid according to json schema
  // do extra valitation and check if file is there
  // TODO, show error if no file
  _onFormSubmit (value) {
    let formData = new FormData();
    for (let k in value) {
      formData.append(k, value[k]);
    }
    // TODO raise error
    if (!this.state.files) return;
    formData.append('file', this.state.files[0]);
    this._uploadFile(formData);
  },

  _onDrop (_files) {
    console.log(_files)
    this.setState({ files: _files });
  },

  _uploadFile (formData) {
    console.log(this.props.csrfToken)
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
