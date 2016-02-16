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
        <hr />
        <div className='row'>
          <div className='columns small-6'>
            {this._renderForm()}
            <div className='button-group'>
              <Link to='/dashboard/files' className='button secondary' style={style.formButton}>Cancel</Link>
              <a className='button disabled'><i className='fa fa-upload'/> Upload</a>
            </div>
          </div>
          <div className='columns small-6'>
            <label>File</label>
            <div style={style.dropZoneContainer} className='text-center'>
              <Dropzone onDrop={this._onDrop} style={style.dropZone}>
                <p style={style.dropMessage}>Drop file here or click to select.</p>
                <h3><i className='fa fa-upload' /></h3>
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
  dropZone: {
    width: '100%',
    background: '#DDD',
    padding: '1rem',
    ':hover': {
      background: '#CCC'
    }
  },
  dropMessage: {
    margin: '0 0 1rem 0'
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
