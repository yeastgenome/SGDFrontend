import React, { Component } from 'react';
import TextField from '../forms/textField';
import StringField from '../forms/stringField';
import FormDatePicker from '../../components/formDatePicker';
import Dropzone from 'react-dropzone';
import style from '../style.css';
import LoadingPage from '../../components/loadingPage';
import PropTypes from 'prop-types';
//import fetchData from '../../lib/fetchData';
//import {setError} from '../../actions/metaActions';
//import Select from 'react-select';
//const DROP_DOWN_URL = '/file_curate_menus';

class FileCurateForm extends Component{
  constructor(props){
    super(props);
    this.handleClear = this.handleClear.bind(this);
    this.renderFileDrop = this.renderFileDrop.bind(this);
    this.state = {
      files: [],
      menus: undefined
    };
  }

  handleClear(){
    this.setState({ files:[]});
  }
  handleDrop(_files){
    this.setState({files: _files});

  }
  handleSubmit(e){
    e.preventDefault();
    let data = new FormData(this.refs.upForm);
    if(this.state.files.length > 0){
      this.state.files.map( item => {
        data.append(item.name, item);
      });
      this.props.onFileUploadSubmit(data);
    }
  }

  renderFileDrop(){
    if(this.state.files.length){
      let filenames = this.state.files.map( (file, index) => {
        return <li key={index}>{file.name}</li>;
      });
      return(
        <div>
          <ul>{filenames}</ul>
          <a onClick={this.handleClear.bind(this)}>Clear Files</a>
        </div>
      );
    }
    return  (<Dropzone name={'file'} onDrop={this.handleDrop.bind(this)} multiple={true}>
                <p className={style.uploadMsg}>Drop file here or click to select.</p>
                <h3 className={style.uploadIcon}><i className='fa fa-cloud-upload' /></h3>
              </Dropzone>);
  }

  render(){
    if(this.props.fileData == undefined){
      return (<LoadingPage />);
    }
    else if (Object.keys(this.props.fileData).length == 0) {
      return(
          <form ref='upForm' onSubmit={this.handleSubmit.bind(this)} name='test'>
            <div>
              <h1>Upload Files to S3</h1>
              <hr />
              <h5>Directions</h5>
              <ul>
                <li>Make sure file name is valid</li>
                <li>Keywords can be comma separated</li>
                <li>Acceptable file formats:
                  <span className={'label'}>README</span>
                  <span className={'label'}>SRA</span>
                  <span className={'label'}>ZIP</span>
                  <span className={'label'}>TAR</span>
                </li>
              </ul>
            </div>
            <hr />

            <div className={'row'} >
              <div className={'columns small-6'}>
                <StringField id='dname' className={'columns small-6'} paramName={'displayName'} displayName={'Display Name'} placeholder={'El Hage_2014_PMID_24532716.README'} isRequired={true} />
              </div>
              <div className={'columns small-6'}>
                <StringField id='status' className={'columns small-6'} paramName={'status'} displayName={'status'} defaultValue={'active'} placeholder={'Active or Archive'} isRequired={true} />      </div>
              </div>

            <div className={'row'}>
              <div className={'columns small-6'}>
                <StringField value='x' id='gvariation' className={'columns small-6 medium-6'} paramName={'keywords'} displayName={'keywords'} placeholder={'genome variation'} isRequired={true} />
              </div>
              <div className={'columns small-6'}>
                <StringField id='pfilename' className={'columns small-6 medium-6'} paramName={'previousFileName'} displayName={'Previous Filename'} />
              </div>
            </div>
            <div className={'row'}>
              <div id='description' className={'columns small-6'}><TextField className={`${style.txtBox}`} paramName={'description'} defaultValue={''}  displayName={'Description'} placeholder={'Genome-wide measurement of whole transcriptome versus histone modified mutants'} isRequired={true}  /></div>
              <div className={'columns small-6 small-offset-5'}></div>
            </div>
            <div className={'row'}>
              <div className={`columns small-6 ${style.dateComponent}`}>
                <label htmlFor="dPicker"> File Date </label>
                <FormDatePicker id="dPicker" /></div>
              <div className={'columns small-6 small-offset-5'}>
              </div>
            </div>
            <div className={'row'}>
              <div className={'columns small-6 small-offset-5'}></div>
            </div>
            <div className={'row'}>
              <div className={'columns small-6'}>
                {this.renderFileDrop()}
              </div>
            </div>

            <hr />
            <div className={'row'}>
              <div className={'columns small-3'}>
                <input type='submit' className='button' value='Submit' />
              </div>
              <div className={'columns small-3 small-offset-4'}></div>
            </div>

          </form>
      );
    }
    else{
      let description = this.props.fileData.description;
      let displayName = this.props.fileData.display_name;
      let status = this.props.fileData.status;
      let url = this.props.fileData.s3_url;
      return(
          <form ref='upForm' onSubmit={this.handleSubmit.bind(this)} name='test'>
            <div>
              <h1>Upload README Files to S3</h1>
              <hr />
              <h5>Directions</h5>
              <ul>
                <li>Make sure file name(s) is valid</li>
                <li>Keywords can be comma separated</li>
                <li>Acceptable file formats:
                  <span className={'label'}>README</span>
                </li>
              </ul>
            </div>
            <hr />
            {url ? <a href={url} target='_blank' rel='noopener noreferrer'>File source</a>: ''}
            <hr />

            <div className={'row'} >
              <div className={'columns small-6'}>
                <StringField id='dname' className={'columns small-6'} defaultValue={displayName} paramName={'displayName'} displayName={'Display Name'} placeholder={'El Hage_2014_PMID_24532716.README'} isRequired={true} />
              </div>
              <div className={'columns small-6'}>
                <StringField id='status' className={'columns small-6'} paramName={'status'} displayName={'status'} defaultValue={status} placeholder={'Active or Archive'} isRequired={true} />      </div>
              </div>

            <div className={'row'}>
              <div className={'columns small-6'}>
                <StringField value='x' id='gvariation' className={'columns small-6 medium-6'} paramName={'keywords'} displayName={'keywords'} placeholder={'genome variation'} isRequired={true} />
              </div>
              <div className={'columns small-6'}>
                <StringField id='pfilename' className={'columns small-6 medium-6'} paramName={'previousFileName'} displayName={'Previous Filename'} />
              </div>
            </div>
            <div className={'row'}>
              <div id='description' className={'columns small-6'}><TextField className={`${style.txtBox}`} paramName={'description'} defaultValue={description}  displayName={'Description'} placeholder={'Genome-wide measurement of whole transcriptome versus histone modified mutants'} isRequired={true}  /></div>
              <div className={'columns small-6 small-offset-5'}></div>
            </div>
            <div className={'row'}>
              <div className={`columns small-6 ${style.dateComponent}`}>
                <label htmlFor="dPicker"> File Date </label>
                <FormDatePicker id="dPicker" /></div>
              <div className={'columns small-6 small-offset-5'}>
              </div>
            </div>
            <div className={'row'}>
              <div className={'columns small-6 small-offset-5'}></div>
            </div>
            <div className={'row'}>
              <div className={'columns small-6'}>
                {this.renderFileDrop()}
              </div>
            </div>

            <hr />
            <div className={'row'}>
              <div className={'columns small-3'}>
                <input type='submit' className='button' value='Submit' />
              </div>
              <div className={'columns small-3 small-offset-4'}></div>
            </div>

          </form>
      );
    }

  }
}

FileCurateForm.propTypes = {
  onFileUploadSubmit: PropTypes.func,
  dispatch: PropTypes.func,
  fileData: PropTypes.object,
  location: PropTypes.object
};

export default FileCurateForm;
