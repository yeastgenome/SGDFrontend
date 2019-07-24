import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import FileUpload from './fileUpload';
import RegulationForm from './regulationForm';

class Regulation extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <CurateLayout>
        <div className='row'>
          <div className='columns small-12 medium-12 large-5'>
            <h1>Regulation file upload</h1>
            <FileUpload />
          </div>
          <div className='columns small-12 medium-12 large-5 end'>
            <h1>Add/Update regulation</h1>
            <RegulationForm />
          </div>
        </div>
      </CurateLayout>
    );
  }

}

export default Regulation;