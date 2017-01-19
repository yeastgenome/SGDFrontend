import React, { Component } from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Select from 'react-select';
import _ from 'underscore';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import AnnotationSummary from '../../components/annotationSummary';
import Loader from '../../components/loader';

const UPLOAD_URL = '/upload_spreadsheet';

class SpreadsheetUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      isPending: false,
      annotationData: null,
      templateValue: DEFAULT_VALUE
    };
  }

  handleDrop (_files) {
    this.setState({ files: _files });
  }

  handleSelectChange(newVal) {
    this.setState({ templateValue: newVal.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    let formData = new FormData(this.refs.form);
    if (this.state.files) {
      formData.append('file', this.state.files[0]);
    }
    this.uploadData(formData);
  }

  uploadData(formData) {
    this.setState({ isPending: true });
    fetchData(UPLOAD_URL, {
      type: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': this.props.csrfToken
      },
      data: formData,
      processData: false,
      contentType: false
    }).then( data => {
      this.setState({
        isPending: false,
        annotationData: data.annotations
      });
    }).catch( () => {
      this.setState({ isPending: false });
    });
  }

  getActiveTemplate() {
    return _.findWhere(TEMPLATE_OPTIONS, { value: this.state.templateValue });
  }

  renderFileDrop() {
    if (this.state.files.length) {
      let fileName = this.state.files[0].name;
      return (
        <div className={style.fileContainer}>
          <p>{fileName}</p>
        </div>
      );
    }
    return (
      <Dropzone onDrop={this.handleDrop.bind(this)} multiple={false}>
        <p className={style.uploadMsg}>Drop file here or click to select.</p>
        <h3 className={style.uploadIcon}><i className='fa fa-upload' /></h3>
      </Dropzone>
    );
  }

  renderForm() {
    let activeTemplate = this.getActiveTemplate();
    return (
      <form ref='form' onSubmit={this.handleSubmit.bind(this)}>
        <p>Directions: Select a template type (refer to examples), upload your file by dragging into box or clicking box, then click "submit."</p>
        <div className='row'>
          <div className={`columns small-3 ${style.selectContainer}`}>
            <label>Template</label>
            <Select
              onChange={this.handleSelectChange.bind(this)}
              options={TEMPLATE_OPTIONS}
              name='template'
              value={this.state.templateValue}
            />
            <label><a href={activeTemplate.tempalateUrl} target='_new'>See example {activeTemplate.label} template</a></label>
          </div>
        </div>
        <div className='row'>
          <div className='columns small-4'>
            <label>Upload File</label>
            {this.renderFileDrop()}
          </div>
        </div>
        <input className={`button ${style.submitButton}`} type='submit' value='Submit' />
      </form>
    );
  }

  render() {
    let state = this.state;
    let node;
    if (state.isPending) {
      node = <Loader />;
    } else if (state.annotationData) {
      node = <AnnotationSummary annotations={state.annotationData} />;
    } else {
      node = this.renderForm();
    }
    return (
      <div>
        <h1>Spreadsheet Upload</h1>
        {node}
      </div>
    );
  }
}

SpreadsheetUpload.propTypes = {
  csrfToken: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.csrfToken
  };
}

export { SpreadsheetUpload as SpreadsheetUpload };
export default connect(mapStateToProps)(SpreadsheetUpload);

// TEMP
const TEMPLATE_OPTIONS = [
  {
    label: 'Locus Summaries',
    value: 'locus_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/1GwirBge5wrKBv5mDOnHMOrf7nxLydBQOIojaf5wd3QE/edit#gid=0'
  }
];
const DEFAULT_VALUE = TEMPLATE_OPTIONS[0].value;
