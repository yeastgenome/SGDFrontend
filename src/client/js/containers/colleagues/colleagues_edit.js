import React from 'react';
import { connect } from 'react-redux';

import Loader from '../../components/widgets/loader';
import { StringField, CheckField } from '../../components/widgets/form_helpers';

const COLLEAGUE_GET_URL = '/colleagues';

const ColleaguesEdit = React.createClass({
  getInitialState () {
    return {
      data: {},
      isLoadPending: false, // loading existing data
      isUpdatePending: false // sending update to server
    };
  },

  render () {
    let isUpdate = this._isUpdate();
    let label = isUpdate ? 'Update Colleague' : 'New Colleague';
    return (
      <div>
        <h1>{label}</h1>
        <hr />
        {this._renderForm()}
      </div>
    );
  },

  componentDidMount () {
    if (this._isUpdate()) this._fetchData();
  },

  _renderForm () {
    if (this.state.isLoadPending) return <Loader />;
    let data = this.state.data;
    return (
      <div className='row'>
        <form>
          <div className='column small-3'>
            <StringField displayName='First Name' paramName='first_name' defaultValue={data.first_name} />
          </div>
          <div className='column small-2'>
            <StringField displayName='Middle Name' paramName='middle_name' defaultValue={data.middle_name} />
          </div>
          <div className='column small-5'>
            <StringField displayName='Last Name' paramName='last_name' defaultValue={data.last_name} />
          </div>
          <div className='column small-2'>
            <StringField displayName='Suffix' paramName='suffix' defaultValue={data.suffix} />
          </div>
          <div className='column small-12'>
            <StringField displayName='Email' paramName='email' defaultValue={data.email} />
            <StringField displayName='Position' paramName='position' defaultValue={data.position} />
            <StringField displayName='Profession' paramName='profession' defaultValue={data.profession} />
            <StringField displayName='Organization' paramName='organization' defaultValue={data.organization} />
            <StringField displayName='Work Phone' paramName='work_phone' defaultValue={data.work_phone} />
            <StringField displayName='Other Phone' paramName='other_phone' defaultValue={data.other_phone} />
            {this._renderAddress()}
            <StringField displayName='Lab Webpage' paramName='lab_page' defaultValue={data.lab_page} />
            <StringField displayName='Research Summary Webpage' paramName='research_page' defaultValue={data.research_page} />
            <StringField displayName='Research Interests' paramName='research_interests' defaultValue={data.research_interests} />
            <StringField displayName='Keywords' paramName='keywords' defaultValue={data.keywords} />
            {this._renderTopics()}
            {this._renderAssociates()}
            {this._renderGenes()}
            {this._renderComments()}
            {this._renderNotes()}
            <CheckField displayName='Beta Tester' paramName='beta_tester' defaultValue={data.beta_tester} />
            {this._renderOrcid()}
          </div>
        </form>
      </div>
    );
    // associates/collaborators - separates out lab members from supervisors/PIs
    // non-lab collaborators
    // research interests (free text)
    // comments
    // curator Note -- combine this and 'Add a new note' into single section -- to show note and add a new one
    // associated genes
    // delay submission (make into a button at top and bottom with a space for reason)
    // delete submission check box (make a button at top and bottom)
  },

  _renderAddress () {
    let data = this.state.data;
    let addresses = this.state.data.addresses || ['', '', ''];
    return (
      <div className='row'>
        <div className='column small-12'>
          <label>Address</label>
          <input type='text' name='address_1' defaultValue={addresses[0]} />
          <input type='text' name='address_2' placeholder='street' defaultValue={addresses[1]} />
          <input type='text' name='address_3' placeholder='suite #' defaultValue={addresses[2]} />
        </div>
        <div className='column small-3'>
          <StringField displayName='City' paramName='city' defaultValue={data.city} />
        </div>
        <div className='column small-3'>
          <StringField displayName='State / Region' paramName='state' defaultValue={data.state} />
        </div>
        <div className='column small-3'>
          <StringField displayName='Postal Code' paramName='postal_code' datadefaultValue={data.postal_code} />
        </div>
        <div className='column small-3'>
          <StringField displayName='Country' paramName='country' defaultValue={data.country} />
        </div>
      </div>
    );
  },

  // TODO, controlled vocab
  _renderTopics () {
    return null;
  },

  _renderAssociates () {
    return null;
  },

  _renderGenes () {
    return null;
  },

  _renderComments () {
    return null;
  },

  _renderNotes () {
    return null;
  },

  _renderOrcid () {
    return (
      <div>
        <label>ORCID iD.  Get one at <a href='https://orcid.org/register'>https://orcid.org/register</a>.</label>
        <input type='text' name='orcid' defaultValue={this.state.data.orcid} />
      </div>
    );
  },

  _fetchData () {
    this.setState({ isLoadPending: true });
    let displayName = this.props.routeParams.colleagueDisplayName;
    fetch(`${COLLEAGUE_GET_URL}/${displayName}`, {
      credentials: 'same-origin',
    }).then( response => {
      return response.json();
    }).then( json => {
      this.setState({ data: json, isLoadPending: false });
    });
  },

  // true if edit page,not /new
  _isUpdate () {
    return (typeof this.props.routeParams.colleagueDisplayName === 'string');
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesEdit);
