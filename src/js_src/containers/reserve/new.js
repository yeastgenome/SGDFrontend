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
        <h2 style={{ marginTop: '3rem' }}>Thanks for submitting your gene name reservation! SGD curators will review and be in touch.</h2>
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
    let Reservation = t.struct({
      new_gene_name: t.maybe(t.String),
      systematic_name: t.maybe(t.String),
      description: t.maybe(t.String),
      notes: t.maybe(t.String),
    });
    let reserveSchema = t.struct({
      colleague_id: t.maybe(t.Number),
      reservations: t.list(Reservation),
      publication_title: t.maybe(t.String),
      journal: t.maybe(t.String),
      year: t.maybe(t.String),
      status: t.maybe(t.enums.of([
        'In press',
        'Submitted',
        'In preparation',
        'Unpublished'
      ])),
      authors: t.maybe(t.list(Author))
    });
    let resLayout = locals => {
      return (
        <div>
          <div className='row'>
            <div className='column small-6'>{locals.inputs.new_gene_name}</div>
            <div className='column small-6'>{locals.inputs.systematic_name}</div>
          </div>
          <div>{locals.inputs.description}</div>
          <div>{locals.inputs.notes}</div>
        </div>
      );
    };
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
          {locals.inputs.colleague_id}
          {locals.inputs.reservations}
          <p><b>Publication Information</b></p>
          <div className='row'>
            <div className='column small-6'>{locals.inputs.publication_title}</div>
            <div className='column small-4'>{locals.inputs.journal}</div>
            <div className='column small-2'>{locals.inputs.year}</div>
          </div>
          <div className='row'>
            <div className='column small-3'>
              {locals.inputs.status}
            </div>
          </div>
          <span><a href='https://orcid.org/register' target='_new'><i className='fa fa-question-circle' /> Register for an ORCID iD</a></span>
          <div>{locals.inputs.authors}</div>
        </div>
      );
    };
    let reserveOptions = {
      template: formLayout,
      fields: {
        colleague_id: {
          type: 'hidden'
        },
        year: {
          label: 'Year *'
        },
        status: {
          label: 'Publication status *'
        },
        reservations: {
          disableOrder: true,
          label: 'Gene name reservations',
          item: {
            template: resLayout,
            fields: {
              new_gene_name: {
                label: 'Proposed Gene Name *'
              },
              description: {
                label: 'Description of Gene Name Acronym'
              },
              systematic_name: {
                label: 'ORF Name (strongly encouraged)'
              },
            }
          },
          i18n: {
            add: 'Add another gene name reservation',
            remove: 'Remove this gene name reservation',
            optional: '',
            required: ''
          }
        },
        authors: {
          disableOrder: true,
          disableRemove: true,
          item: {
            template: authorLayout
          },
          i18n: {
            add: 'Add another author',
            optional: '',
            required: '',
          },
        }
      }
    };
    let _onSuccess = () => {
      this.setState({ isSuccess: true });
      if (window) window.scrollTo(0, 0);
    };
    let _defaultData = { colleague_id: this.state.colleagueId, status: 'Unpublished', reservations: [{ new_gene_name: '' }], authors: [{ first_name: ''}] };
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
