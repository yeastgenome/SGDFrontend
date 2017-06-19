import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

import fetchData from '../../lib/fetchData.js';
// import Captcha from '../widgets/google_recaptcha.jsx';
import CheckField from '../../components/forms/checkField';
import StringField from '../../components/forms/stringField';
import MultiSelectField from '../../components/forms/multiSelectField';
import TextField from '../../components/forms/textField';

const COLLEAGUES_AUTOCOMPLETE_URL = '/autocomplete_results?category=colleague&q=';
const COUNTRIES_URL = '/assets/countries.json?';
const GENES_URL = '/autocomplete_results?category=locus&q=';
const KEYWORDS_AUTOCOMPLETE_URL = '/keywords?q=';

const TRIAGED_COLLEAGUE_URL = '/colleagues/triage';
const COLLEAGUE_GET_URL = '/colleagues';
const USER_COLLEAGUE_UPDATE_URL = '/backend/colleagues';
const CURATOR_COLLEAGUE_UPDATE_URL = TRIAGED_COLLEAGUE_URL;

class ColleaguesFormShow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      isComplete: false,
      error: null
    };
  }

  componentDidMount () {
    if (this.props.isUpdate || this.props.isReadOnly) this._fetchData();
  }

  _renderTriageNode () {
    let onApprove = this._submitData;
    if (!this.props.isTriage || !this.props.isCurator) return null;
    return (
      <div className='button-group'>
        <a onClick={onApprove} className='button small'><i className='fa fa-check' /> Approve Update</a>
        <Link to='/curate/colleagues' className='button small secondary'><i className='fa fa-times' /> Cancel Update</Link>
      </div>
    );
  }

  _renderCompleteNode () {
    return (
      <div className='panel callout'>
        <p>Thanks for the information!  It will soon be received and put on the site.</p>
      </div>
    );
  }

  _renderForm () {
    if (this.state.isLoadPending) return <div className='sgd-loader-container'><div className='sgd-loader'></div></div>;    let data = this.state.data;
    return (
      <div>
        {this._renderError()}
        <form ref='form' onSubmit={this.handleSubmitData}>
          <div className='row'>
            <div className='column small-12'>
              {this._renderName()}
              {this._renderOrcid()}
              <StringField isReadOnly={this.props.isReadOnly} displayName='Email' paramName='email' defaultValue={data.email} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Position' paramName='position' defaultValue={data.position} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Profession' paramName='profession' defaultValue={data.profession} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Institution' paramName='institution' defaultValue={data.institution} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Work Phone' paramName='work_phone' defaultValue={data.work_phone} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Other Phone' paramName='other_phone' defaultValue={data.other_phone} />
              {this._renderAddress()}
              <StringField isReadOnly={this.props.isReadOnly} displayName='Lab Webpage' paramName='lab_page' defaultValue={data.lab_page} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Research Summary Webpage' paramName='research_page' defaultValue={data.research_page} />
              <StringField isReadOnly={this.props.isReadOnly} displayName='Research Interests' paramName='research_interests' defaultValue={data.research_interests} />
              <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Keywords' paramName='keywords' optionsUrl={KEYWORDS_AUTOCOMPLETE_URL} defaultValues={data.keywords} multi />
              {this._renderAssociates()}
              {this._renderGenes()}
              {this._renderCuratorInput()}
            </div>
          </div>
        </form>
        {this._renderControls()}
      </div>
    );
  }

  _renderName () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return [
        <StringField isReadOnly={this.props.isReadOnly} displayName='First Name' paramName='first_name' defaultValue={data.first_name} key='name0' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Middle Name' paramName='middle_name' defaultValue={data.middle_name} key='name1' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Last Name' paramName='last_name' defaultValue={data.last_name} key='name2' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Suffix' paramName='suffix' defaultValue={data.suffix} key='name3' />
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
  }

  _renderAddress () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return [
        <StringField isReadOnly={this.props.isReadOnly} displayName='City' paramName='city' defaultValue={data.city} key='address0' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='State / Region' paramName='state' defaultValue={data.state} key='address1' />,
        <StringField isReadOnly={this.props.isReadOnly} displayName='Postal Code' paramName='postal_code' defaultValue={data.postal_code} key='address2' />,
        <MultiSelectField
          key='address3'
          isReadOnly={this.props.isReadOnly} displayName='Country'
          paramName='country' optionsUrl={COUNTRIES_URL}
          defaultValues={data.country}
          allowCreate
        />
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
          <MultiSelectField
            isReadOnly={this.props.isReadOnly} displayName='Country'
            paramName='country' optionsUrl={COUNTRIES_URL}
            defaultValues={data.country}
            allowCreate
          />
        </div>
      </div>
    );
  }

  _renderAssociates () {
    let supervisors = this.state.data.supervisors || [];
    let labMembers = this.state.data.lab_members || [];
    let _formatLink = d => { return `/colleague/${d.format_name}/overview`; };
    return [
      <MultiSelectField
        isReadOnly={this.props.isReadOnly} displayName='Supervisor(s)'
        paramName='supervisors' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
        defaultValues={supervisors} defaultOptions={supervisors}
        allowCreate key='associate0'
        isLinks formatLink={_formatLink}
        multi
      />,
      <MultiSelectField
        isReadOnly={this.props.isReadOnly} displayName='Lab Members'
        paramName='lab_members' optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
        defaultValues={labMembers} defaultOptions={labMembers}
        allowCreate key='associate1'
        isLinks formatLink={_formatLink}
        multi
      />
    ];
  }

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
  }

  _renderGenes () {
    let data = this.state.data.associated_genes || [];
    return <MultiSelectField isReadOnly={this.props.isReadOnly} displayName='Associated Genes' paramName='associated_gene_ids' optionsUrl={GENES_URL} defaultValues={data} defaultOptions={data} multi />;
  }

  _renderComments () {
    if (!this.props.isCurator) return null;
    return <TextField isReadOnly={this.props.isReadOnly} displayName='Comments' paramName='comments' defaultValue={this.state.data.comments} placeholder='comments' />;
  }

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
  }

  _fetchData () {
    this.setState({ isLoadPending: true });
    if (this.props.isTriage) {
      let url = TRIAGED_COLLEAGUE_URL;
      let name = this.props.colleagueDisplayName;
      fetchData(url).then( json => {
        let _data = _.findWhere(json, { format_name: name });
        this.setState({ data: _data, isLoadPending: false });
      });
    } else {
      let url = `/${COLLEAGUE_GET_URL}/${this.props.colleagueDisplayName}`;
      fetchData(url).then( json => {
        this.setState({ data: json, isLoadPending: false });
      });
    }
  }
  
  _renderControls () {
    if (this.props.isReadOnly) return null;
    // let classSuffix = this.state.isUpdatePending ? ' disabled ' : '';
    // let label = this.state.isUpdatePending ? 'Saving...' : 'Send Update';
    // let saveIconNode = this.state.isUpdatePending ? null : <span><i className='fa fa-upload' /> </span>;
    // let _onClick = e => {
    //   e.preventDefault();
    //   this.handleSubmitData();
    // };
    return (
      <div>
        <div className='button-group'>
          <a className='button'>Submit Update</a>
        </div>
      </div>
    );
  }

  // _renderCaptcha() {
  //   if (this.props.isReadOnly || this.props.isCurator) return null;
  //   return (
  //     <div style={[style.controlContainer]}>
  //       <Captcha onComplete={() => {}}/>
  //     </div>
  //   );
  // },

  // saves form data to server, if new makes POST
  handleSubmitData (e) {
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
    fetchData(url, options).then( () => {
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
  }

  _renderError () {
    if (!this.state.error) return null;
    return (
      <div className='callout warning'>
        <p>{this.state.error}</p>
      </div>
    );
  }

  render () {
    if (this.state.isComplete) return this._renderCompleteNode();
    let formLabel = this.props.isUpdate ? 'Update Colleague' : 'New Colleague';
    let showLabel = this.state.isLoadPending ? '...' : `${this.state.data.first_name} ${this.state.data.last_name}`;
    let label = this.props.isReadOnly ? showLabel : formLabel;
    return (
      <div>
        <div className='row'>
          <div className='columns small-12'>
            <h1>{label}</h1>
          </div>
        </div>
        {this._renderTriageNode()}
        {this._renderForm()}
      </div>
    );
  }
}

ColleaguesFormShow.propTypes = {
  colleagueDisplayName: React.PropTypes.string,
  dispatch: React.PropTypes.func,
  isReadOnly: React.PropTypes.bool,
  isCurator: React.PropTypes.bool,
  isUpdate: React.PropTypes.bool,
  isTriage: React.PropTypes.bool
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesFormShow);
