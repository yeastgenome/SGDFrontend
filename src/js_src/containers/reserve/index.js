import React, { Component } from 'react';

// import style from './style.css';
// import fetchData from '../../lib/fetchData';
import FlexiForm from '../../components/forms/flexiForm';
import t from 'tcomb-form';

const TARGET_URL = '/reserve';

class GeneNameReservation extends Component {
  render() {
    let reserveSchema = t.struct({
      new_gene_name: t.String,
      description: t.String,
      orf_name: t.String,
      first_name: t.String,
      last_name: t.String,
      email: t.String,
      institution: t.String,
      position: t.String,
      title: t.String
    });
    let reserveOptions = {
      fields: {
        new_gene_name: {
          label: 'Proposed Gene Name *'
        },
        description: {
          label: 'Description of Gene Name Acronym *'
        },
        orf_name: {
          label: 'ORF Name'
        },
        first_name: {
          label: 'First Name *'
        },
        last_name: {
          label: 'Last Name *'
        },
        email: {
          label: 'Email *'
        },
        title: {
          label: 'Publication Title'
        }
      }
    };
    let _onSuccess = (data) => {
      console.log(data);
    };
    return (
      <div>
        <h1>Reserve a Gene Name</h1>
        <FlexiForm tFormOptions={reserveOptions} tFormSchema={reserveSchema} onSuccess={_onSuccess} submitText='Send gene name reservation' updateUrl={TARGET_URL} />
        <p>* indicates required field</p>
      </div>
    );
  }
}

export default GeneNameReservation;
