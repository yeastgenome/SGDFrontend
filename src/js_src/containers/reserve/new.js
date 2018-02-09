import React, { Component } from 'react';

import ColleagueUpdate from './colleagueUpdate';
import FlexiForm from '../../components/forms/flexiForm';
import t from 'tcomb-form';

const TARGET_URL = '/reserve';

class GeneNameReservation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colleagueId: null,
      isSuccess: false,
      stage: 0
    };
  }

  handleColleagueCompletion(_colleagueId) {
    this.setState({ stage: 1, colleagueId: _colleagueId });
  }

  renderSuccess() {
    return (
      <div>
        <p>Thanks for submitting your gene name reservation! SGD curators will review and be in touch.</p>
      </div>
    );
  }

  renderColleagueUpdate() {
    return <ColleagueUpdate onComplete={this.handleColleagueCompletion.bind(this)} />;
  }

  renderResForm() {
    let Author = t.struct({
      first_name: t.maybe(t.String),
      last_name: t.maybe(t.String),
      orcid: t.maybe(t.String)
    });
    let reserveSchema = t.struct({
      colleague_id: t.Number,
      new_gene_name: t.maybe(t.String),
      systematic_name: t.maybe(t.String),
      description: t.maybe(t.String),
      notes: t.maybe(t.String),
      publication_title: t.maybe(t.String),
      journal: t.maybe(t.String),
      year: t.maybe(t.String),
      authors: t.maybe(t.list(Author))
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
            <div className='column small-6'>{locals.inputs.systematic_name}</div>
          </div>
          <div>{locals.inputs.description}</div>
          <div>{locals.inputs.notes}</div>
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
        systematic_name: {
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
        year: {
          label: 'Year *'
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
    let _onSuccess = () => {
      this.setState({ isSuccess: true });
    };
    let _defaultData = { colleague_id: this.state.colleagueId, authors: [{ first_name: ''}] };
    t.form.Form.i18n = {
      optional: '',
      required: '',
      add: 'Add another author',
      remove: 'Remove this author'
    };
    return <FlexiForm defaultData={_defaultData} tFormOptions={reserveOptions} tFormSchema={reserveSchema} onSuccess={_onSuccess} requestMethod='POST' submitText='Send gene name reservation' updateUrl={TARGET_URL} />;
  }

  render() {
    if (this.state.isSuccess) {
      return this.renderSuccess();
    }
    let formNode = (this.state.stage === 0) ? this.renderColleagueUpdate() : this.renderResForm();
    return (
      <div>
        <h1>Reserve a Gene Name</h1>
        {formNode}
      </div>
    );
  }
}

export default GeneNameReservation;
