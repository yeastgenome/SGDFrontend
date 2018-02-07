import React, { Component } from 'react';
import t from 'tcomb-form';

import FlexiForm from '../../components/forms/flexiForm';

const URL = '/reference';

class NewReference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSuccess: false
    };
  }

  handleSuccess() {
    this.setState({ isSuccess: true });
  }

  render() {
    if (this.state.isSuccess) {
      return <p>Reference was added successfully.</p>;
    }
    let refSchema = t.struct({
      pmids: t.String,
      override_previous: t.Boolean
    });
    let refOptions = {
      fields: {
        pmids: {
          label: 'PMIDs * (space-separated)'
        },
        override_previous: {
          label: 'Add even if already in REFERENCEDELETED'
        }
      }
    };
    return (
      <div>
        <h1>Add a New Reference</h1>
        <p>Enter the the PMID of the reference you wish to add. Matching entries in REFERENCETRIAGE and REFERENCEDELETED will be removed. If the reference is already in the database, no operation will be performed.</p>
        <div className='row'>
          <div className='columns medium-3 center'>      
            <FlexiForm onSuccess={this.handleSuccess.bind(this)} requestMethod='POST' tFormSchema={refSchema} tFormOptions={refOptions} updateUrl={URL} />
          </div>
        </div>
      </div>
    );
  }
}

export default NewReference;
