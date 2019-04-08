import React,{Component} from 'react';
import Dropzone from 'react-dropzone';
import style from './style.css';
import fetchData from '../../lib/fetchData';

const FILE_INSERT = '/ptm_file';

class FileUpload extends Component{
  constructor(props){
    super(props);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleDrop(file){
    console.log(file);
  }

  handleSubmit(){
    fetchData(FILE_INSERT,{
      type:'GET'
    })
    .then((data) => {
      console.log(data);
    }).catch((err) => {
      console.log(err);
    });
  }

  render(){
    return(
      <form onSubmit={this.handleSubmit}>
            <Dropzone multiple={false} onDrop={this.handleDrop}>
              <p className={style.uploadMsg}>Drop file here or click to select.</p>
              <h3 className={style.uploadIcon}><i className='fa fa-upload' /></h3>
            </Dropzone>
            <button type='submit' className='button'>Submit</button>
      </form>
      
    );
  }
}


export default FileUpload;