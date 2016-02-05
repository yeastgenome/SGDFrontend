import Radium from 'radium';
import React from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import TForm from '../../components/widgets/t_form'

const FilesIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>Dataset Upload</h1>
        <div className='row'>
          <div className='columns small-6'>
            {this._renderForm()}
            <div className='button-group'>
              <Link to='/dashboard/files' className='button secondary' style={style.formButton}>Cancel</Link>
              <a className='button disabled'><i className='fa fa-upload'/> Upload</a>
            </div>
          </div>
          <div className='columns small-6'>
            <p>File</p>
            <div style={style.dropZoneContainer}>
              <Dropzone onDrop={this._onDrop}>
                <p style={style.dropMessage}>Drop file here or click to select.</p>
              </Dropzone>
            </div>
          </div>
        </div>
      </div>
    );
  },

  _renderForm () {
      const datasetSchema = {
        title: 'Dataset',
        type: 'object',
        properties: {
          filename: { type: 'string' },
          date: { type: 'string' },
          file_format: { type: 'string' },
        },
        required: ['filename']
      };
      return <TForm validationObject={datasetSchema} />;
  },

  _onDrop (files) {
      console.log('Received files: ', files);
    },
});

const style = {
  dropZoneContainer: {
    marginBottom: '0.5rem'
  },
  dropMessage: {
    margin: '1rem'
  },
  formButton: {
    marginRight: '0.5rem'
  }
}

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(Radium(FilesIndex));
