import React from 'react';
import { connect } from 'react-redux';

import Loader from '../../components/widgets/loader';

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
          <div className='column small-5'>
            {this._renderStringField('First Name', 'first_name', data.first_name)}
          </div>
          <div className='column small-5'>
            {this._renderStringField('Last Name', 'last_name', data.last_name)}
          </div>
          <div className='column small-2'>
            {this._renderStringField('Suffix', 'suffix', data.suffix)}
          </div>
          <div className='column small-12'>
            {this._renderStringField('Email', 'email', data.email)}
            {this._renderStringField('Position', 'position', data.position)}
            {this._renderStringField('Profession', 'profession', data.profession)}
            {this._renderStringField('Organization', 'organization', data.organization)}
            {this._renderStringField('ORCID', 'info', data.info)}
            {this._renderStringField('Work Phone', 'work_phone', data.work_phone)}
            {this._renderStringField('Other Phone', 'other_phone', data.other_phone)}
            {this._renderAddress()}
            {this._renderStringField('Lab Webpage', 'lab_page', data.lab_page)}
            {this._renderStringField('Research Summary Webpage', 'research_page', data.research_page)}
            {this._renderStringField('Research Interests', 'research_interests', data.research_interests)}
            {this._renderStringField('Keywords', 'keywords', data.keywords)}
            {this._renderTopics()}
            {this._renderAssociates()}
            {this._renderGenes()}
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
          {this._renderStringField('City', 'city', data.city)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('State / Region', 'state', data.state)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('Postal Code', 'postal_code', data.postal_code)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('Country', 'country', data.country)}
        </div>
      </div>
    );
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
          {this._renderStringField('City', 'city', data.city)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('State / Region', 'state', data.state)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('Postal Code', 'postal_code', data.postal_code)}
        </div>
        <div className='column small-3'>
          {this._renderStringField('Country', 'country', data.country)}
        </div>
      </div>
    );
  },

  // TODO
  _renderTopics () {
    return null;
  },

  _renderAssociates () {
    return null;
  },

  _renderGenes () {
    return null;
  },

  _renderStringField (displayName, paramName, defaultValue, placeholder) {
    return (
      <div>
        <label>{displayName}</label>
        <input type='text' name={paramName} placeholder={placeholder} defaultValue={defaultValue} />
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
