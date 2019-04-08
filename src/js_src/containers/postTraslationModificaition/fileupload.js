import React,{Component} from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import style from './style.css';

import fetchData from '../../lib/fetchData';
const FILE_INSERT = '/ptm_file';
const TIMEOUT = 120000;

class FileUpload extends Component{
  constructor(props){
    super(props);
    this.state = {
      file:''
    };

    this.handleDrop = this.handleDrop.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleDrop(files){
    this.setState({file:files[0]});
  }

  handleSubmit(){
    let formData = new FormData(this.refs.form);
    formData.append('file', this.state.file);
    
    fetchData(FILE_INSERT,{
      type:'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': this.props.csrfToken
      },
      data:formData,
      processData: false,
      contentType: false,
      timeout:TIMEOUT
    })
    .then((data) => {
      console.log(data);
    }).catch((err) => {
      console.log(err);
    });
  }

  render(){
    return(
      <form onSubmit={this.handleSubmit} ref='form'>
            <Dropzone multiple={false} onDrop={this.handleDrop}>
              <p className={style.uploadMsg}>Drop file here or click to select.</p>
              <h3 className={style.uploadIcon}><i className='fa fa-upload' /></h3>
            </Dropzone>
            <button type='submit' className='button'>Submit</button>
      </form>
    );
  }
}


FileUpload.propTypes = {
  csrfToken: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.csrfToken
  };
}

export default connect(mapStateToProps)(FileUpload);

// export default FileUpload;