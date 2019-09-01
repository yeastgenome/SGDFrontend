import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { push } from 'connected-react-router';
import { Async } from 'react-select';
import PropTypes from 'prop-types';
import ColleagueForm from '../../components/colleagueForm';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const AUTOCOMPLETE_BASE = '/autocomplete_results?category=colleague&q=';
const COLLEAGUE_BASE = '/colleagues';

export class ColleagueUpdate extends Component {
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
    let selectNode = this.state.isNewColleague ? null : <Async value={this.state.selectorValue} loadOptions={getOptions} onChange={this.handleSelect.bind(this)} placeholder='Search for your last name in colleague registry' />;
    return (
      <div style={{ marginBottom: '1rem' }}>
        <p>Are you registered as an SGD colleague? If so, select your name and make any desired updates. If not, select the checkbox and enter information below.</p>
        <div className='row'>
          <div className='columns small-12 medium-6'>
            {selectNode}
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
    if (!this.state.selectorValue && !this.state.isNewColleague) return null;
    let _requestMethod = 'POST';
    let url = 'colleagues';
    if (!this.state.isNewColleague) {
      _requestMethod = 'PUT';
      url = `colleagues/${this.state.colleagueId}`;
    }
    let _submitText = this.props.submitText || 'Next';
    return <ColleagueForm defaultData={this.state.formValue} onComplete={this.props.onComplete.bind(this)} requestMethod={_requestMethod} submitUrl={url} submitText={_submitText} />;
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
  dispatch: PropTypes.func,
  onComplete: PropTypes.func,
  submitText: PropTypes.string
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(ColleagueUpdate);
