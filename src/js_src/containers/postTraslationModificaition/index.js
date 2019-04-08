import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import FileUpload from './fileupload';

class PostTranslationModification extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <CurateLayout>
        <div className="row">
          <div className="columns large-6">
            <h1>PTM file upload</h1>
            <FileUpload />
          </div>
          <div className="columns large-6">
            <h1>Add single value</h1>
            <p>SGD_ID</p> <p>Dbentity_id hidden</p>
            <br />
            <p>Source ID</p> <p>834</p>
            <br />
            <p>Taxonomy ID</p> <p>274803</p>
            <br />
            <p>SGD_ID</p> <p>Dbentity_id for references hidden</p>
            <br />
            <p>Site Index</p> <p>Actual user input also it is number</p>
            <br />
            <p>Site residue</p> <p>Letter</p>
            <br />
            <p>Dropdown for </p>
            <br />
            <p>Modifier (SGD ID)</p> <p>dbentity_id for locus Hidden</p>
          </div>
        </div>
      </CurateLayout>
    );
  }

}

export default PostTranslationModification;