import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import { Async } from 'react-select';
import t from 'tcomb-form';

import FlexiForm from '../../components/forms/flexiForm';
// import { setMessage } from '../../actions/metaActions';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

// const DATA_BASE_URL = '/reservations';
const AUTOCOMPLETE_BASE = '/autocomplete_results?category=colleague&q=';
const COLLEAGUE_BASE = '/colleagues';

class ColleagueUpdate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      colleagueId: null,
      selectorValue: null,
      formValue: null,
      isPending: false,
      isNewColleague: false
    };
  }

  handleCheckChange() {
    this.setState({ isNewColleague: !this.state.isNewColleague });
  }

  handleSelect(value) {
    if (Array.isArray(value)) {
      this.setState({ selectorValue: null, colleagueId: null });
    }
    this.setState({ selectorValue: value });
    // fetch data to update form
    let url = `${COLLEAGUE_BASE}/${value.formatName}`;
    this.setState({ isPending: true });
    fetchData(url).then( data => {
      this.setState({ formValue: data, isPending: false, colleagueId: data.colleague_id });
    });
  }

  renderSelector() {
    let getOptions = (input, callback) => {
      if (input === '') {
        callback(null, {
          options: [],
          complete: false
        });
      }

      let url = `${AUTOCOMPLETE_BASE}${input}`;
      fetchData(url).then( data => {
        let results = data.results || [];
        let _options = results.map( d => {
          let institution =  d.institution ? `, ${d.institution}` : '';
          return {
            label: `${d.name}${institution}`,
            formatName: d.format_name
          };
        });
        callback(null, {
          options: _options,
          complete: false
        });
      });
    };
    return (
      <div style={{ marginBottom: '1rem' }}>
        <p>Are you registered as an SGD colleague? If so, select your name and make any desired updates. If not, select the checkbox and enter information below.</p>
        <div className='row'>
          <div className='columns small-12 medium-6'>
            <Async value={this.state.selectorValue} loadOptions={getOptions} onChange={this.handleSelect.bind(this)} placeholder='Search for your last name in colleague registry' />
          </div>
          <div className='columns small-12 medium-6'>
            <label>
              <input checked={this.state.isNewColleague} onChange={this.handleCheckChange.bind(this)} type='checkbox' />
              I am not yet an SGD colleague. Add my information to registry.
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderForm() {
    if (this.state.isPending) return <Loader />;
    let reserveSchema = t.struct({
      first_name: t.maybe(t.String),
      last_name: t.maybe(t.String),
      email: t.maybe(t.String),
      orcid: t.maybe(t.String),
      phone_number: t.maybe(t.String),
      position: t.maybe(t.String),
      institution: t.maybe(t.String),
      profession: t.maybe(t.String),
    });
    let formLayout = locals => {
      return (
        <div>
          <p>* indicates required field</p>
          <div className='row'>
            <div className='column small-2'>{locals.inputs.first_name}</div>
            <div className='column small-3'>{locals.inputs.last_name}</div>
            <div className='column small-4'>{locals.inputs.email}</div>
            <div className='column small-3'>{locals.inputs.phone_number}</div>
          </div>
          <span><a href='https://orcid.org/register' target='_new'><i className='fa fa-question-circle' /> Register for an ORCID iD</a></span>
          <div className='row'>
            <div className='column small-2'>{locals.inputs.orcid}</div>
          </div>
          <div className='row'>
            <div className='column small-4'>{locals.inputs.position}</div>
            <div className='column small-4'>{locals.inputs.institution}</div>
            <div className='column small-4'>{locals.inputs.profession}</div>
          </div>
        </div>
      );
    };
    let reserveOptions = {
      template: formLayout,
      fields: {
        colleague_id: {
          type: 'First Name *'
        },
        last_name: {
          label: 'Last Name *'
        },
        email: {
          label: 'Email *'
        }
      }
    };
    let _onSuccess = (data) => {
      if (this.props.onComplete) this.props.onComplete(data.colleague_id);
    };
    let _requestMethod = 'POST';
    let url = 'colleagues';
    if (!this.state.isNewColleague) {
      _requestMethod = 'PUT';
      url = `colleagues/${this.state.colleagueId}`;
    }
    return <FlexiForm defaultData={this.state.formValue} tFormOptions={reserveOptions} tFormSchema={reserveSchema} onSuccess={_onSuccess} requestMethod={_requestMethod} submitText='Next' updateUrl={url} />;
  }

  render() {
    return (
      <div>
        {this.renderSelector()}
        {this.renderForm()}
      </div>
    );
  }
}

ColleagueUpdate.propTypes = {
  dispatch: React.PropTypes.func,
  onComplete: React.PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(ColleagueUpdate);
