import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

import apiRequest from '../../lib/api_request';
import Loader from '../../components/widgets/loader';
import { StringField, CheckField, TextField, SelectField, MultiSelectField } from '../../components/widgets/form_helpers';

const COLLEAGUES_AUTOCOMPLETE_URL = '/autocomplete_results?category=colleague&q=';
const GENES_URL = '/autocomplete_results?category=locus&q=';
const KEYWORDS_AUTOCOMPLETE_URL = '/autocomplete_results?category=colleague&field=keywords&q=';
const INSTITUTION_URL = '/autocomplete_results?category=colleague&field=institution&q=';
const TRIAGED_COLLEAGUE_URL = '/colleagues/triage';
const COLLEAGUE_GET_URL = '/colleagues';
const USER_COLLEAGUE_UPDATE_URL = '/backend/colleagues';
const CURATOR_COLLEAGUE_UPDATE_URL = TRIAGED_COLLEAGUE_URL;

const ColleaguesFormShow = React.createClass({
  propTypes: {
    isReadOnly: React.PropTypes.bool,
    isCurator: React.PropTypes.bool,
    isUpdate: React.PropTypes.bool,
    colleagueDisplayName: React.PropTypes.string,
    isTriage: React.PropTypes.bool
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
        {this._renderTriageNode()}
        {this._renderForm()}
      </div>
    );
  },

  componentDidMount () {
    if (this.props.isUpdate || this.props.isReadOnly) this._fetchData();
  },

  _renderTriageNode () {
    let onApprove = this._submitData;
    if (!this.props.isTriage || !this.props.isCurator) return null;
    return (
      <div className='button-group' style={[style.controlContainer]}>
        <a onClick={onApprove} className='button small' style={[style.controlButton]}><i className='fa fa-check'/> Approve Update</a>
        <Link to='/curate/colleagues' className='button small secondary' style={[style.controlButton]}><i className='fa fa-times'/> Cancel Update</Link>
      </div>
    );
  },

  _renderForm () {
    if (this.state.isLoadPending) return <Loader />;
    let data = this.state.data;
    return (
      <div style={[style.container]}>
        {this._renderError()}
        {this._renderControls()}
        {this._renderCaptcha()}
        <form ref='form' onSubmit={this._submitData}>
          <div className='row'>
            <div className='column small-12'>
              {this._renderName()}
              <StringField isReadOnly={this.props.isReadOnly} displayName='Email' paramName='email' defaultValue={data.email} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Position' paramName='position' defaultValue={data.position} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Profession' paramName='profession' defaultValue={data.profession} />
              <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Institution' paramName='institution' defaultValue={data.institution} optionsUrl={INSTITUTION_URL} isMulti={false} allowCreate={true} />
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

  _renderName () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return [
        <StringField isReadOnly={this.props.isReadOnly} displayName='First Name' paramName='first_name' defaultValue={data.first_name} key='name0'/>,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Middle Name' paramName='middle_name' defaultValue={data.middle_name} key='name1'/>,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Last Name' paramName='last_name' defaultValue={data.last_name} key='name2'/>,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Suffix' paramName='suffix' defaultValue={data.suffix} key='name3'/>
      ];
    }
    return (
      <div className='row'>
        <div className='columns small-3'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='First Name' paramName='first_name' defaultValue={data.first_name} />
        </div>
        <div className='columns small-2'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Middle Name' paramName='middle_name' defaultValue={data.middle_name} />
        </div>
        <div className='columns small-5'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Last Name' paramName='last_name' defaultValue={data.last_name} />
        </div>
        <div className='columns small-2'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Suffix' paramName='suffix' defaultValue={data.suffix} />
        </div>
      </div>
    );
  },

  _renderAddress () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return [
        <StringField isReadOnly={this.props.isReadOnly} displayName='City' paramName='city' defaultValue={data.city} key='address0' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='State / Region' paramName='state' defaultValue={data.state} key='address1' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Postal Code' paramName='postal_code' defaultValue={data.postal_code} key='address2' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Country' paramName='country' defaultValue={data.country} key='address3' />
      ];
    }
    return (
      <div className='row'>
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
    return [
      <MultiSelectField
        isReadOnly={this.props.isReadOnly} displayName='Supervisor(s)'
        paramName='supervisors_display_names' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
        defaultValues={this._getIdsFromArray(supervisors)} defaultOptions={supervisors}
        allowCreate={true} key='associate0'
      />,
      <MultiSelectField
        isReadOnly={this.props.isReadOnly} displayName='Lab Members'
        paramName='lab_members_display_names' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
        defaultValues={this._getIdsFromArray(labMembers)} defaultOptions={labMembers}
        allowCreate={true} key='associate1'
      />
    ];
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
    if (this.props.isReadOnly) {
      return <StringField isReadOnly={this.props.isReadOnly} displayName='ORCID iD' paramName='orcid' defaultValue={orcid} />;
    } else {
      return (
        <div>
          <StringField isReadOnly={this.props.isReadOnly} displayName='ORCID iD' paramName='orcid' defaultValue={orcid} />
          <p>Get an ORCID iD at <a href='https://orcid.org/register'>https://orcid.org/register</a>.</p>
        </div>
      );
    }
  },

  _fetchData () {
    this.setState({ isLoadPending: true });
    if (this.props.isTriage) {
      let url = TRIAGED_COLLEAGUE_URL;
      let name = this.props.colleagueDisplayName;
      apiRequest(url).then( json => {
        let _data = _.findWhere(json, { triage_id: parseInt(name) }).data;
        this.setState({ data: _data, isLoadPending: false });
      });
    } else {
      let backendSegment = this.props.isCurator ? '' : '/backend';
      let url = `${backendSegment}${COLLEAGUE_GET_URL}/${this.props.colleagueDisplayName}`;
      apiRequest(url).then( json => {
        this.setState({ data: json, isLoadPending: false });
      });
    }
  },

  _getIdsFromArray (original) {
    return original.map( d => d.id );
  },

  _renderControls () {
    if (this.props.isReadOnly) return null;
    let classSuffix = this.state.isUpdatePending ? ' disabled ' : '';
    let label = this.state.isUpdatePending ? 'Saving...' : 'Send Update';
    let saveIconNode = this.state.isUpdatePending ? null : <span><i className='fa fa-upload' /> </span>;
    let _onClick = e => {
      e.preventDefault();
      this._submitData();
    };
    return (
      <div>
        <div className='button-group' style={[style.controlContainer]}>
          <a onClick={_onClick} className={`button small secondary ${classSuffix}`}style={[style.controlButton]}>{saveIconNode}{label}</a>
          <a href='/search?category=colleague' className='button small secondary'style={[style.controlButton]}><i className='fa fa-search' /> Search Colleagues</a>
        </div>
      </div>
    );
  },

  _renderCaptcha() {
    if (this.props.isReadOnly || this.props.isCurator) return null;
    return (
      <div style={[style.controlContainer]}>
        <Captcha onComplete={() => {}}/>
      </div>
    );
  },

  // saves form data to server, if new makes POST
  _submitData (e) {
    if (e) e.preventDefault();
    let _data = new FormData(this.refs.form);
    let _method = this.props.isUpdate ? 'PUT' : 'POST';
    let url;
    if (this.props.isCurator) {
      url = `${CURATOR_COLLEAGUE_UPDATE_URL}/${this.props.colleagueDisplayName}`;
    } else {
      url = this.props.isUpdate ? `${USER_COLLEAGUE_UPDATE_URL}/${this.props.colleagueDisplayName}` : USER_COLLEAGUE_UPDATE_URL;
    }
    let options = {
      data: _data,
      method: _method
    };
    apiRequest(url, options).then( response => {
      // is complete
      this.setState({ error: null });
      // let curator redirect to index
      if (this.props.isCurator) {
        this.props.dispatch(push('/curate/colleagues'));
      } else {
        this.setState({ isComplete: true });
      }
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

const style = {
  container: {
    marginBottom: '2rem'
  },
  controlContainer: {
    marginBottom: '1rem'
  },
  controlButton: {
    marginRight: '0.5rem'
  }
};

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(Radium(ColleaguesFormShow));
