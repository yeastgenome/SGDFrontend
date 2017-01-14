import React, { Component } from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Select from 'react-select';
import _ from 'underscore';

import style from './style.css';

class SpreadsheetUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templateValue: DEFAULT_VALUE
    };
  }

  handleSelectChange(newVal) {
    this.setState({ templateValue: newVal.value });
  }

  getActiveTemplate() {
    return _.findWhere(TEMPLATE_OPTIONS, { value: this.state.templateValue });
  }

  render() {
    let activeTemplate = this.getActiveTemplate();
    return (
      <div>
        <h1>Spreadsheet Upload</h1>
        <p>Directions: Select a template type (refer to examples), upload your file by dragging into box or clicking box, then click "submit."</p>
        <div className='row'>
          <div className='columns small-3'>
            <label>Template</label>
            <Select
              onChange={this.handleSelectChange.bind(this)}
              options={TEMPLATE_OPTIONS}
              value={this.state.templateValue}
            />
            <label><a href={activeTemplate.tempalateUrl} target='_new'>See example {activeTemplate.label} template</a></label>
          </div>
        </div>
        <div className='row'>
          <div className='columns small-4'>
            <label>Upload File</label>
            <Dropzone>
              <p className={style.uploadMsg}>Drop file here or click to select.</p>
              <h3 className={style.uploadIcon}><i className='fa fa-upload' /></h3>
            </Dropzone>
          </div>
        </div>
        <a className={`button ${style.submitButton}`} href='#'>Submit</a>
      </div>
    );
  }
}

function mapStateToProps() {
  return {
  };
}

export { SpreadsheetUpload as SpreadsheetUpload };
export default connect(mapStateToProps)(SpreadsheetUpload);

// TEMP
const TEMPLATE_OPTIONS = [
  {
    label: 'Locus Summaries',
    value: 'locus_summaries',
    tempalateUrl: 'http://yeastgenome.org'
  },
  {
    label: 'Phenotype Annotations',
    value: 'phenotype_annotations',
    tempalateUrl: 'http://yeastgenome.org'
  }
];
const DEFAULT_VALUE = TEMPLATE_OPTIONS[0].value;
