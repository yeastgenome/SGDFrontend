import React from 'react';
import { connect } from 'react-redux';

import Loader from '../../components/widgets/loader';
import apiRequest from '../../lib/api_request';
import { StringField, CheckField, TextField, SelectField, MultiSelectField } from '../../components/widgets/form_helpers';

const COLLEAGUE_GET_URL = '/colleagues';
const COLLEAGUE_POST_URL = '/colleagues';
const COLLEAGUES_AUTOCOMPLETE_URL = '/colleagues_auto';
const GENES_URL = '/genes';
const KEYWORDS_AUTOCOMPLETE_URL = '/keywords';

const ColleaguesFormShow = React.createClass({
  propTypes: {
    isReadOnly: React.PropTypes.bool,
    isCurator: React.PropTypes.bool,
    isUpdate: React.PropTypes.bool,
    colleagueDisplayName: React.PropTypes.string
  },

  getInitialState () {
    return {
      data: {},
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      error: null
    };
  },

  render () {
    let formLabel = this.props.isUpdate ? 'Update Colleague' : 'New Colleague';
    let showLabel = this.state.isLoadPending ? '...' : `${this.state.data.first_name} ${this.state.data.last_name}`;
    let label = this.props.isReadOnly ? showLabel : formLabel;
    return (
      <div>
        <h1>{label}</h1>
        <hr />
        {this._renderForm()}
      </div>
    );
  },

  componentDidMount () {
    if (this.props.isUpdate || this.props.isReadOnly) this._fetchData();
  },

  _renderForm () {
    if (this.state.isLoadPending) return <Loader />;
    let data = this.state.data;
    return (
      <div>
        {this._renderControls()}
        <form ref='form' onSubmit={this._submitData}>
          {this._renderStatusSelector()}
          <div className='row'>
            <div className='column small-3'>
              <StringField isReadOnly={this.props.isReadOnly} displayName='First Name' paramName='first_name' defaultValue={data.first_name} />
            </div>
            <div className='column small-2'>
              <StringField isReadOnly={this.props.isReadOnly} displayName='Middle Name' paramName='middle_name' defaultValue={data.middle_name} />
            </div>
            <div className='column small-5'>
              <StringField isReadOnly={this.props.isReadOnly} displayName='Last Name' paramName='last_name' defaultValue={data.last_name} />
            </div>
            <div className='column small-2'>
              <StringField isReadOnly={this.props.isReadOnly} displayName='Suffix' paramName='suffix' defaultValue={data.suffix} />
            </div>
          </div>
          <div className='row'>
            <div className='column small-12'>
              <StringField isReadOnly={this.props.isReadOnly} displayName='Email' paramName='email' defaultValue={data.email} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Position' paramName='position' defaultValue={data.position} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Profession' paramName='profession' defaultValue={data.profession} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Organization' paramName='organization' defaultValue={data.organization} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Work Phone' paramName='work_phone' defaultValue={data.work_phone} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Other Phone' paramName='other_phone' defaultValue={data.other_phone} />
              {this._renderAddress()}
              <StringField isReadOnly={this.props.isReadOnly} displayName='Lab Webpage' paramName='lab_page' defaultValue={data.lab_page} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Research Summary Webpage' paramName='research_page' defaultValue={data.research_page} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Research Interests' paramName='research_interests' defaultValue={data.research_interests} />
              <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Keywords' paramName='keywords' optionsUrl={KEYWORDS_AUTOCOMPLETE_URL} defaultValues={data.keywords} />
              {this._renderAssociates()}
              {this._renderGenes()}
              {this._renderOrcid()}
              {this._renderCuratorInput()}
            </div>
          </div>
        </form>
        {this._renderControls()}
      </div>
    );
  },

  _renderStatusSelector () {
    if (!this.props.isCurator) return null;
    const _options = [
      { id: 'triaged', name: 'Triaged' },
      { id: 'approved', name: 'Approved' }
    ];
    return (
      <div className='row'>
        <div className='column small-3'>
          <SelectField isReadOnly={this.props.isReadOnly} displayName='Status' paramName='status' defaultValue={this.state.data.status} options={_options} />
        </div>
      </div>
    );
  },

  _renderAddress () {
    let data = this.state.data;
    let addOneNode = this.props.isReadOnly ? <p>{data.address_0}</p> :  <input type='text' name='address_0' defaultValue={data.address_0} />;
    let addTwoNode = this.props.isReadOnly ? <p>{data.address_1}</p> :  <input placeholder='street' type='text' name='address_1' defaultValue={data.address_1} />;
    let addThreeNode = this.props.isReadOnly ? <p>{data.address_2}</p> :  <input placeholder='suite #' type='text' name='address_2' defaultValue={data.address_2} />;
    return (
      <div className='row'>
        <div className='column small-12'>
          <label>Address</label>
          {addOneNode}
          {addTwoNode}
          {addThreeNode}
        </div>
        <div className='column small-3'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='City' paramName='city' defaultValue={data.city} />
        </div>
        <div className='column small-3'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='State / Region' paramName='state' defaultValue={data.state} />
        </div>
        <div className='column small-3'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Postal Code' paramName='postal_code' defaultValue={data.postal_code} />
        </div>
        <div className='column small-3'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Country' paramName='country' defaultValue={data.country} />
        </div>
      </div>
    );
  },

  _renderAssociates () {
    let supervisors = this.state.data.supervisors || [];
    let labMembers = this.state.data.lab_members || [];
    return (
      <div>
        <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Supervisor(s)' paramName='supervisors_display_names' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL} defaultValues={this._getIdsFromArray(supervisors)} defaultOptions={supervisors}/>
        <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Lab Members' paramName='lab_members_display_names' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL} defaultValues={this._getIdsFromArray(labMembers)} defaultOptions={labMembers}/>
      </div>
    );
  },

  _renderCuratorInput () {
    if (!this.props.isCurator && this.props.isReadOnly) return null;
    let data = this.state.data;
    return (
      <div>
        {this._renderComments()}
        <CheckField isReadOnly={this.props.isReadOnly} displayName='Beta Tester' paramName='beta_tester' defaultValue={data.beta_tester} />
        <CheckField isReadOnly={this.props.isReadOnly} displayName='Show Email' paramName='show_email' defaultValue={data.show_email} />
        <CheckField isReadOnly={this.props.isReadOnly} displayName='Receive Newsletter' paramName='newsletter' defaultValue={data.newsletter} />
      </div>
    );

  },

  _renderGenes () {
    let data = this.state.data.associated_genes || [];
    return <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Associated Genes' paramName='associated_gene_ids' optionsUrl={GENES_URL} defaultValues={this._getIdsFromArray(data)} defaultOptions={data}/>;
  },

  _renderComments () {
    if (!this.props.isCurator) return null;
    return <TextField isReadOnly={this.props.isReadOnly} displayName='Comments' paramName='comments' defaultValue={this.state.data.comments} placeholder='comments' />;
  },

  _renderOrcid () {
    let orcid = this.state.data.orcid || '';
    let node = this.props.isReadOnly ? <p>{orcid}</p> :  <input type='text' name='orcid' defaultValue={orcid} />;
    return (
      <div>
        <label>ORCID iD.  Get one at <a href='https://orcid.org/register'>https://orcid.org/register</a>.</label>
        {node}
      </div>
    );
  },

  _fetchData () {
    this.setState({ isLoadPending: true });
    let displayName = this.props.colleagueDisplayName;
    apiRequest(`${COLLEAGUE_GET_URL}/${displayName}`).then( json => {
      this.setState({ data: json, isLoadPending: false });
    });
  },

  _getIdsFromArray (original) {
    return original.map( d => d.id );
  },

  _renderControls () {
    if (this.props.isReadOnly) return null;
    let classSuffix = this.state.isUpdatePending ? ' disabled secondary' : '';
    let label = this.state.isUpdatePending ? 'Saving...' : 'Save';
    let saveIconNode = this.state.isUpdatePending ? null : <span><i className='fa fa-floppy-o' /> </span>;
    let _onClick = e => {
      e.preventDefault();
      this._submitData();
    };
    return (
      <div>
        {this._renderError()}
        <div className='button-group'>
          <a onClick={_onClick} className={`button ${classSuffix}`}>{saveIconNode}{label}</a>
          <a className={'button alert'}><i className='fa fa-times' /> Delete</a>
        </div>
      </div>
    );
  },

  // saves form data to server, if new makes POST
  _submitData (e) {
    if (e) e.preventDefault();
    let _method = this.props.isUpdate ? 'PUT' : 'POST';
    let _data = new FormData(this.refs.form);
    let url = this.props.isUpdate ? `${COLLEAGUE_POST_URL}/${this.props.colleagueDisplayName}` : COLLEAGUE_POST_URL;
    let options = {
      crsfToken: this.props.crsfToken,
      data: _data,
      method: _method
    };
    // TEMP
    apiRequest(url, options).then( response => {
      console.log(response);
      this.setState({ error: null });
    }).catch( e => {
      this.setState({ error: e.message });
    });
  },

  _renderError () {
    if (!this.state.error) return null;
    return (
      <div className='callout warning'>
          <p>{this.state.error}</p>
      </div>
    );
  }
});

function mapStateToProps(_state) {
  let state = _state.auth;
  return {
    csrfToken: state.csrfToken
  };
}

export default connect(mapStateToProps)(ColleaguesFormShow);
