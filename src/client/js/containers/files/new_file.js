import Radium from 'radium';
import React from 'react';
import Dropzone from 'react-dropzone';

import TForm from '../../components/widgets/t_form'

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

const FilesIndex = React.createClass({
  getInitialState () {
    return {
      files: null,
      isPending: false
    };
  },

  render() {
    return (
      <div>
        <h1>Dataset Upload</h1>
        <hr />
        <div className='row'>
          <div className='columns small-6'>
            {this._renderForm()}
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
      </div>
    );
  },

  _renderForm () {
      return <TForm validationObject={SCHEMA_OBJ} onSubmit={this._onFormSubmit} submitText='Upload' cancelHref='/dashboard/files' />;
  },

  _onFormSubmit (value) {
    let formData = new FormData();
    for (let k in value) {
      formData.append(k, value[k]);
    }
    this.state.files.forEach( file => {
      formData.append('file', file);
    });
    console.log(formData)
  },

  _onDrop (_files) {
    console.log(_files)
    this.setState({ files: _files });
  },
});

const styles = {
  dropZoneContainer: {
    marginBottom: '0.5rem'
  },
  dropMessage: {
    margin: '1rem'
  },
}

module.exports = Radium(FilesIndex);
