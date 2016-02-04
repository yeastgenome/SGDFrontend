import Radium from 'radium';
import React from 'react';
import Dropzone from 'react-dropzone';
import { connect } from 'react-redux';
import { Link } from 'react-router';

const FilesIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>Dataset Upload</h1>
        <div className='panel'>
          <p>File</p>
          <div style={style.dropZoneContainer}>
            <Dropzone onDrop={this._onDrop}>
              <p style={style.dropMessage}>Drop file here or click to select.</p>
            </Dropzone>
          </div>
          <div className='button-group'>
           <Link to='/dashboard/files' className='button secondary' style={style.formButton}>Cancel</Link>
           <a className='button disabled'><i className='fa fa-upload'/> Upload</a>
          </div>
        </div>
      </div>
    );
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
