import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import { connect } from 'react-redux';
import FileCurateForm from '../../components/fileCurate/fileCurateForm';
import fetchData from '../../lib/fetchData';
import { clearError, setError } from '../../actions/metaActions';
import PropTypes from 'prop-types';

const UPLOAD_TAR_URL = '/upload_tar_file';
const GET_FILE_URL = '/get_file';
const UPLOAD_TIMEOUT = 120000;

class FileCurateUpdate extends Component {
  constructor(props){
    super(props);
    this.state = {
      files: [],
      isPending: false,
      fileData: undefined,
      toHome: false
    };
    this.handleFileUploadSubmit = this.handleFileUploadSubmit.bind(this);
  }

  componentDidMount(){

    let urlStr = this.getParam();
    fetchData(`${GET_FILE_URL}/${urlStr}`, {
      type: 'GET',
      credentials: 'same-origin',
      processData: false,
      contentType: false
    }).then(data => {
      this.setState({
        fileData: data

      });

    }).catch(data => {
      let errorMEssage = data ? data.error : 'Error occured';
      this.props.dispatch(setError(errorMEssage));
    });
  }

  getParam(){
    let urlStr = '';
    let query = new URLSearchParams(this.props.location.search);
    for (let param of query.entries()){
      urlStr = param[1];
    }

    return urlStr;

  }

  handleFileUploadSubmit(e){
    this.uploadData(e);
  }

  uploadData(formData){
    this.setState({ isPending: true});
    fetchData(UPLOAD_TAR_URL, {
      type: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': this.props.csrfToken,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      data: formData,
      processData: false,
      contentType: false,
      timeout: UPLOAD_TIMEOUT
    }).then( (data) => {
      if (data){
        this.setState({
          isPending: false,
          toHome: true
        });
        this.props.dispatch(clearError());

      }


    }).catch( (data) => {
      let errorMEssage = data ? data.error: 'Error occured';
      this.props.dispatch(setError(errorMEssage));
      this.setState({ isPending: false});
    });
    //fetchData

  }

  render(){
    if(this.state.toHome){
      window.location.href = '/';
      return false;
    }
    else{
      return (<CurateLayout><div className='row'><FileCurateForm onFileUploadSubmit={this.handleFileUploadSubmit} fileData={this.state.fileData} location={this.props.location} /></div></CurateLayout>);
    }
  }
}

FileCurateUpdate.propTypes = {
  csrfToken: PropTypes.string,
  dispatch: PropTypes.func,
  location: PropTypes.object
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.get('csrfToken')
  };
}

export default connect(mapStateToProps)(FileCurateUpdate);
