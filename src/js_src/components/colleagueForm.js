import React, { Component } from 'react';
import t from 'tcomb-form';

import FlexiForm from './forms/flexiForm';
import { COUNTRIES, STATES } from './colleagueConstants';

class ColleagueForm extends Component {
  render() {
    let colleagueSchema = t.struct({
      first_name: t.maybe(t.String),
      middle_name: t.maybe(t.String),
      last_name: t.maybe(t.String),
      suffix: t.maybe(t.String),
      orcid: t.maybe(t.String),
      email: t.maybe(t.String),
      display_email: t.Boolean,
      receive_quarterly_newsletter: t.Boolean,
      willing_to_be_beta_tester: t.Boolean,
      phone_number: t.maybe(t.String),
      job_title: t.maybe(t.String),
      profession: t.maybe(t.String),
      institution: t.maybe(t.String),
      pi: t.maybe(t.String),
      address_1: t.maybe(t.String),
      address_2: t.maybe(t.String),
      city: t.maybe(t.String),
      state: t.maybe(t.enums.of(STATES)),
      country: t.maybe(t.enums.of(COUNTRIES)),// will be pull down
      zip_code: t.maybe(t.String),
      // TODO URLs
      research_keywords: t.maybe(t.list(t.String)),// will be pull down
      research_interests: t.maybe(t.String),
      associated_genes: t.maybe(t.String),


    });
    let formLayout = locals => {
      return (
        <div>
          <p>* indicates required field</p>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.first_name}</div>
            <div className='column small-4'>{locals.inputs.middle_name}</div>
            <div className='column small-4'>{locals.inputs.last_name}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.email}</div>
            <div className='column small-3'>{locals.inputs.phone_number}</div>
            <div className='column small-5' />
          </div>
          <div className='row'>
            <div className='column small-2'>{locals.inputs.display_email}</div>
            <div className='column small-3'>{locals.inputs.receive_quarterly_newsletter}</div>
            <div className='column small-7'>{locals.inputs.willing_to_be_beta_tester}</div>
          </div>
          <span><a href='https://orcid.org/register' target='_new'><i className='fa fa-question-circle' /> Register for an ORCID iD</a></span>
          <div className='row'>
            <div className='column small-2'>{locals.inputs.orcid}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.address_1}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.address_2}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.address_3}</div>
          </div>
          <div className='row'>
            <div className='column small-3'>{locals.inputs.city}</div>
            <div className='column small-3'>{locals.inputs.state}</div>
            <div className='column small-2'>{locals.inputs.zip_code}</div>
            <div className='column small-4'>{locals.inputs.country}</div>
          </div>
          <div className='row'>
            <div className='column small-3'>{locals.inputs.job_title}</div>
            <div className='column small-3'>{locals.inputs.institution}</div>
            <div className='column small-3'>{locals.inputs.profession}</div>
            <div className='column small-3'>{locals.inputs.pi}</div>
          </div>
          {locals.inputs.research_interests}
          {locals.inputs.associated_genes}
          {locals.inputs.research_keywords}
        </div>
      );
    };
    let colleagueOptions = {
      template: formLayout,
      fields: {
        colleague_id: {
          type: 'hidden'
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
        pi: {
          label: 'PI (optional)'
        },
        address_1: {
          label: 'Address (optional)'
        },
        address_2: {
          label: 'Address line 2'
        },
        associated_genes: {
          label: 'Associated genes (optional) (comma-separated)'
        },
        research_keywords: {
          disableOrder: true,
          disableRemove: true
        }
      }
    };
    let _onSuccess = (data) => {
      if (this.props.onComplete) this.props.onComplete(data.colleague_id);
    };
    let _requestMethod = 'PUT';
    return <FlexiForm defaultData={this.props.defaultData} tFormOptions={colleagueOptions} tFormSchema={colleagueSchema} onSuccess={_onSuccess} requestMethod={_requestMethod} submitText='Approve Changes' updateUrl={this.props.submitUrl} />;
  }
}

ColleagueForm.propTypes = {
  defaultData: React.PropTypes.object,
  onComplete: React.PropTypes.func,
  submitUrl: React.PropTypes.string
};

export default ColleagueForm;
