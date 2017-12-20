import React, { Component } from 'react';

import FlexiForm from '../../components/forms/flexiForm';
import t from 'tcomb-form';

const TARGET_URL = '/reserve';

class GeneNameReservation extends Component {
  render() {
    let Author = t.struct({
      first_name: t.String,
      last_name: t.String,
      orcid: t.String
    });
    let reserveSchema = t.struct({
      new_gene_name: t.String,
      orf_name: t.String,
      description: t.String,
      first_name: t.String,
      last_name: t.String,
      email: t.String,
      phone_number: t.String,
      position: t.String,
      institution: t.String,
      profession: t.String,
      publication_title: t.String,
      journal: t.String,
      year: t.Number,
      authors: t.list(Author)
    });
    let authorLayout = locals => {
      return (
        <div className='row'>
          <div className='column small-4'>{locals.inputs.first_name}</div>
          <div className='column small-4'>{locals.inputs.last_name}</div>
          <div className='column small-2'>{locals.inputs.orcid}</div>
          <div className='column small-2'>{locals.inputs.removeItem}</div>
        </div>
      );
    };
    let formLayout = locals => {
      return (
        <div>
          <p>* indicates required field</p>
          <p><b>Gene Name Information</b></p>
          <div className='row'>
            <div className='column small-6'>{locals.inputs.new_gene_name}</div>
            <div className='column small-6'>{locals.inputs.orf_name}</div>
          </div>
          <div>{locals.inputs.description}</div>
          <p><b>Your Information</b></p>
          <div className='row'>
            <div className='column small-3'>{locals.inputs.first_name}</div>
            <div className='column small-3'>{locals.inputs.last_name}</div>
            <div className='column small-3'>{locals.inputs.email}</div>
            <div className='column small-3'>{locals.inputs.phone_number}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.position}</div>
            <div className='column small-4'>{locals.inputs.institution}</div>
            <div className='column small-4'>{locals.inputs.profession}</div>
          </div>
          <p><b>Publication Information</b></p>
          <div className='row'>
            <div className='column small-6'>{locals.inputs.publication_title}</div>
            <div className='column small-4'>{locals.inputs.journal}</div>
            <div className='column small-2'>{locals.inputs.year}</div>
          </div>
          <span><a href='https://orcid.org/register' target='_new'><i className='fa fa-question-circle' /> Register for an ORCID iD</a></span>
          <div>{locals.inputs.authors}</div>
        </div>
      );
    };
    let reserveOptions = {
      template: formLayout,
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
        publication_title: {
          label: 'Publication Title *'
        },
        authors: {
          disableOrder: true,
          disableRemove: true,
          item: {
            template: authorLayout
          }
        }
      }
    };
    let _onSuccess = (data) => {
      console.log(data);
    };
    let _defaultData = { authors: [{ first_name: ''}] };
    t.form.Form.i18n = {
      optional: '',
      required: '',
      add: 'Add another author',
      remove: 'Remove this author'
    };
    return (
      <div>
        <h1>Reserve a Gene Name</h1>
        <FlexiForm defaultData={_defaultData} tFormOptions={reserveOptions} tFormSchema={reserveSchema} onSuccess={_onSuccess} submitText='Send gene name reservation' updateUrl={TARGET_URL} />
        
      </div>
    );
  }
}

export default GeneNameReservation;
