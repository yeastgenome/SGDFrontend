import React,{Component} from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import style from './style.css';

import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import Loader from '../../components/loader';
const FILE_INSERT = '/ptm_file';
const TIMEOUT = 120000;

class FileUpload extends Component{
  constructor(props){
    super(props);
    this.state = {
      file:'',
      isPending:false
    };

    this.handleDrop = this.handleDrop.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleDrop(files){
    this.setState({file:files[0]});
  }

  handleSubmit(e){
    e.preventDefault();
    let formData = new FormData(this.refs.form);

    if(! this.state.file){
      this.props.dispatch(setError('No file selected'));
    }
    else{
      formData.append('file', this.state.file);
      this.setState({ isPending: true });
      fetchData(FILE_INSERT, {
        type: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this.props.csrfToken
        },
        data: formData,
        processData: false,
        contentType: false,
        timeout: TIMEOUT
      })
        .then((data) => {
          this.setState({ isPending: false });
          this.props.dispatch(setMessage(data.success));
        })
        .catch((err) => {
          this.setState({ isPending: false });
          this.props.dispatch(setError(err.error));
        });
    }
  }

  render(){
    const isLoading = this.state.isPending;
    return(
      <form onSubmit={this.handleSubmit} ref='form'>
        <div className='row'>
          <div className='columns medium-2'>
          <p>Template File: </p>
          </div>
          <div className='columns medium-6 end'>
            <a href='https://docs.google.com/spreadsheets/d/1Hd3bvvlEEtx-ubgF42uGDA8F4_B5ryaOJivzqk059hA/edit?usp=sharing' target='_blank' >PTM template file </a>
          </div>
        </div>

        <div className='row'>
          <div className='columns medium-12'>
            <ul>
              <li>Drop/Select an <span className="primary label">excel (.xlsx)</span> file as shown in the template.</li>
              <li>Ordering of columns is not required.</li>
              <li>For updating an exisiting record, Separate old value & new value with pipe | </li>
            </ul>
          </div>
        </div>
        <div className='row'>
          <div className='columns medium-12'>
            <Dropzone multiple={false} onDrop={this.handleDrop}>
              <p className={style.uploadMsg}>Drop file here or click to select.</p>
              <h3 className={style.uploadIcon}><i className='fa fa-upload' /></h3>
            </Dropzone>
          </div>
        </div>
        <div className='row'>
          <div className='columns medium-12'>
            <p>Current file name : {this.state.file.name}</p>
          </div>
        </div> 
        <div className='row'>
          <div className='columns small-3'>
            {isLoading ? <Loader /> : <button type='submit' className='button'>Submit</button>}            
          </div>
        </div> 
      </form>
    );
  }
}

FileUpload.propTypes = {
  csrfToken: React.PropTypes.string,
  dispatch: React.PropTypes.func
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.csrfToken
  };
}

export default connect(mapStateToProps)(FileUpload);