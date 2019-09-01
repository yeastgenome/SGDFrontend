import React, { Component } from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Select from 'react-select';
import _ from 'underscore';
import PropTypes from 'prop-types';
import style from './style.css';
import fetchData from '../../lib/fetchData';
import AnnotationSummary from '../../components/annotationSummary';
import Loader from '../../components/loader';
import { clearError, setError } from '../../actions/metaActions';
import CurateLayout from '../curateHome/layout';

const UPLOAD_URL = '/upload_spreadsheet';
const UPLOAD_TIMEOUT = 120000;

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

  handleClear() {
    this.setState({ files: [], templateValue: DEFAULT_VALUE, annotationData: null });
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
      contentType: false,
      timeout: UPLOAD_TIMEOUT,
    }).then( (data) => {
      this.setState({
        isPending: false,
        annotationData: data.annotations
      });
      this.props.dispatch(clearError());
    }).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an error processing the upload. Please try again.';
      this.props.dispatch(setError(errorMessage));
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
          <a onClick={this.handleClear.bind(this)}>Clear Files</a>
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
        <h4><u>Directions</u></h4>
        <ul>
          <li>File header has to match any of the example template headers in the drop down menu below</li>
          <li>The following file formats are acceptable: <span className="label">csv</span> <span className="label">txt</span> <span className="label">xlsx</span> <span className="label">xls</span> <span className="label">tsv</span>
          </li>
          <li>Select a template type (refer to examples), upload your file by dragging into box or clicking box, then click "submit."</li>
          </ul>
        <h4><u>File</u></h4>
        <div className='row'>
          <div className={`columns small-3 ${style.selectContainer}`}>
            <label>Template Examples</label>
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
      let d = state.annotationData;
      node = (
        <div>
          <p>{d.inserts.toLocaleString()} inserts and {d.updates.toLocaleString()} updates</p>
          <AnnotationSummary annotations={d.entries} />
          <a onClick={this.handleClear.bind(this)}>Upload More</a>
        </div>
      );
    } else {
      node = this.renderForm();
    }
    return (
      <CurateLayout>
        <div>
          <h1>Spreadsheet Upload</h1>
          {node}
        </div>
      </CurateLayout>
    );
  }
}

SpreadsheetUpload.propTypes = {
  csrfToken: PropTypes.string,
  dispatch: PropTypes.func
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.get('csrfToken')
  };
}

export { SpreadsheetUpload as SpreadsheetUpload };
export default connect(mapStateToProps)(SpreadsheetUpload);

// TEMP
const TEMPLATE_OPTIONS = [
  {
    label: 'Phenotype',
    value: 'phenotype',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/1g_MfDnzQGvHaAXB-IUWa15tk-KUrS7l0rpG4eI9pgvw/edit?usp=sharing'
  },
  {
    label: 'Protein',
    value: 'protein_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/1Q_bPcDplLIpl-_wUpdBiFayVDVtdBCPjj5_MoKckQcA/edit?usp=sharing'
  },

  {
    label: 'Sequence',
    value: 'sequence_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/10ZgpWmMXaC2-M4IR111sBFANEjAVsl5r9lv8IY_3gow/edit?usp=sharing'
  },
  {
    label: 'Interaction',
    value: 'Interaction_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/1v3auVd6IZzE14QHiC4v5SstbhuVZphYgo_2p72lRePM/edit?usp=sharing'
  },
  {
    label: 'Regulation',
    value: 'regulation_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/173BbPl9Q05ZDIZB3unSGmDaJ-YK0v2UXXmUuats7QJw/edit?usp=sharing'
  },
  {
    label: 'Disease',
    value: 'disease_summaries',
    tempalateUrl: 'https://docs.google.com/spreadsheets/d/1E4gj7P7SADnRc0GJOMMTCz4foTX46kcAnZmWkmKw4mE/edit?usp=sharing'
  }
];
const DEFAULT_VALUE = TEMPLATE_OPTIONS[0].value;
