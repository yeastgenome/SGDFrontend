import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

import apiRequest from '../../lib/api_request.jsx';
import Captcha from '../widgets/google_recaptcha.jsx';
import { StringField, CheckField, TextField, SelectField, MultiSelectField } from '../../components/widgets/form_helpers.jsx';

const COLLEAGUES_AUTOCOMPLETE_URL = '/backend/autocomplete_results?category=colleague&q=';
const GENES_URL = '/backend/autocomplete_results?category=locus&q=';
const KEYWORDS_AUTOCOMPLETE_URL = '/backend/autocomplete_results?category=colleague&field=keywords&q=';
const INSTITUTION_URL = '/backend/autocomplete_results?category=colleague&field=institution&q=';

const TRIAGED_COLLEAGUE_URL = '/colleagues/triage';
const COLLEAGUE_GET_URL = '/colleagues';
const USER_COLLEAGUE_UPDATE_URL = '/backend/colleagues';
const CURATOR_COLLEAGUE_UPDATE_URL = TRIAGED_COLLEAGUE_URL;

const Primer3 = React.createClass({
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
      isComplete: false,
      error: null
    };
  },

  render () {
    if (this.state.isComplete) return this._renderCompleteNode();
    let formLabel = 'Primer3 Design';
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

  _renderCompleteNode () {
    return (
      <div className='panel callout'>
        <p>Thanks for the information!  It will soon be received and put on the site.</p>
      </div>
    );
  },
  _colleague_contact_dets(data){
    let temp = []
    if (data.full_address) {
        temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Address(s)" paramName="full_address" defaultValue={data.full_address} key="fullAd" />);
      }
    if (data.city) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="City" paramName="city" defaultValue={data.city} key="address0" />);
    }
    if (data.state) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="State / Region" paramName="state" defaultValue={data.state} key="address1" />);
    }
    if (data.postal_code) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Zip" paramName="postal_code" defaultValue={data.postal_code} key="address2" />);
    }
    if (data.country) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Country" paramName="country" defaultValue={data.country} key="address3" />);
    }
    if (data.email) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Email" paramName="email" defaultValue={data.email} key="email" />);
    }
    if (data.phones) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Phones" paramName="phones" defaultValue={data.phones} key="phones" />);
    }

    return temp
  },
  _colleague_dets(data){
    let temp = []
    if (data.fullname) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Name" paramName="fullname" defaultValue={data.fullname} key="name0" />);
    }
    if (data.profession) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Profession" paramName="profession" defaultValue={data.profession} key="profession" />);
    }
    if (data.position) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Title" paramName="position" defaultValue={data.position} key="position" />);
    }
    if (data.institution) {
      temp.push(<MultiSelectField isReadOnly={this.props.isReadOnly} displayName="Institution" paramName="institution" defaultValue={data.institution} optionsUrl={INSTITUTION_URL} isMulti={false} allowCreate={true} key="institution" />);
    }

    return temp
  },

  _colleague_other_dets(data){
    let temp = []
    if (data.colleague_note) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Colleague Note" paramName="colleague_note" defaultValue={data.colleague_note} key="colleague_note" />);
    }
    if (data.research_interests) {
      temp.push(<StringField isReadOnly={this.props.isReadOnly} displayName="Research Interests" paramName="research_interests" defaultValue={data.research_interests} key="research_interests" />);
    }
    if (data.keywords) {
      if (data.keywords.length > 0) {
        temp.push(<MultiSelectField isReadOnly={this.props.isReadOnly} displayName="Keywords" paramName="keywords" optionsUrl={KEYWORDS_AUTOCOMPLETE_URL} defaultValues={data.keywords} key="keywords" />);
      }
    }

    return temp
  },
  _renderForm () {
    if (this.state.isLoadPending) return <div className='sgd-loader-container'><div className='sgd-loader'></div></div>;    let data = this.state.data;

    return <div style={[style.container]}>
        {this._renderError()}
        {this._renderCaptcha()}
        <form ref="form" onSubmit={this._submitData}>
          <div className="row">
            <div className="column small-12">
              {this._renderInput()}
              {this._renderPurposeInput()}
              {this._renderPrimerLocation()}
              {this._renderMeltingTemp()}
              {this._renderPrimerComposition()}
              {this._renderPrimerAnnealing()}
              {this._colleague_other_dets(this.state.data)}
            </div>
          </div>
        </form>
        {this._renderControls()}
      </div>;
  },


   _renderInput () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_contact_dets(data);
    }
    return <div>
        <div className="row">
          <div className="column small-4">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Locus: Enter a standard gene name or systematic ORF name (i.e. ACT1, YKR054C)" paramName="gene_name" defaultValue={data.gene_name} />
          </div>
          <br></br>
          <h1> OR </h1>
          <br></br>
          <div className="column small-10">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Enter the DNA Sequence (numbers are OK, but comments should be removed)" paramName="sequence" defaultValue={data.sequence}  />
          </div>
        </div>
      </div>;
  },


  _renderPurposeInput () {
    if (!this.props.isCurator && this.props.isReadOnly) return null;
    let data = this.state.data;
    return (
      <div>
        {this._renderComments()}
        <CheckField isReadOnly={this.props.isReadOnly} displayName='PCR or ' paramName='pcr' defaultValue={data.pcr} />
        <CheckField isReadOnly={this.props.isReadOnly} displayName='SEQUENCING' paramName='sequencing' defaultValue={data.sequencing} />
      </div>
    );
  },

   _renderPrimerLocation () {
    let data = this.state.data;
    let supervisors = this.state.data.supervisors || [];
    let labMembers = this.state.data.lab_members || [];
     return <div>
        <div className="row">
        <h3> Location </h3>
          <div className="column small-3">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Length in which to search for valid primers:" paramName="dna_len" defaultValue={data.dna_len} />
          </div>
          <div className="column small-3">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Distance between sequencing primers:" paramName="primer_distance" defaultValue={data.primer_distance}  />
          </div>
          <div className="column small-3">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Optimum primer length:" paramName="primer_length" defaultValue={data.primer_length}  />
          </div>
          <div className="column small-2">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Minimum length:" paramName="primer_min_len" defaultValue={data.primer_min_len}  />
          </div>
          <div className="column small-1">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Maximum length:" paramName="primer_max_len" defaultValue={data.primer_max_len}  />
          </div>

        </div>
      </div>;
  },

   _renderMeltingTemp () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_contact_dets(data);
    }
    return <div>
        <div className="row">
           <h3> Melting Temperature </h3>
          <div className="column small-4">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Optimum Tm:" paramName="opt_tm" defaultValue={data.opt_tm} />
          </div>
          <div className="column small-4">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Minimum Tm:" paramName="min_tm" defaultValue={data.min_tm}  />
          </div>
          <div className="column small-4">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Maximum Tm:" paramName="max_tm" defaultValue={data.max_tm}  />
          </div>
        </div>
      </div>;
  },

  _renderPrimerComposition () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_dets(data);
    }
    return (
      <div className='row'>
       <h3> Primer Composition </h3>
        <div className='columns small-4'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Optimum percent GC content:' paramName='gc_content' defaultValue={data.gc_content} />
        </div>
        <div className='columns small-4'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Minimum GC:' paramName='min_gc' defaultValue={data.min_gc} />
        </div>
        <div className='columns small-4'>
          <StringField isReadOnly={this.props.isReadOnly} displayName='Maximum GC:' paramName='max_gc' defaultValue={data.max_gc} />
        </div>
      </div>
    );
  },

  _renderPrimerAnnealing () {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_contact_dets(data);
    }
    return <div>
        <div className="row">
           <h3> Primer Annealing </h3>
          <div className="column small-6">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Self Anneal:" paramName="self_anneal" defaultValue={data.selfanneal} />
          </div>
          <div className="column small-6">
            <StringField isReadOnly={this.props.isReadOnly} displayName="Self End Anneal:" paramName="self_end_anneal" defaultValue={data.self_end_anneal}  />
          </div>
        </div>
      </div>;
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
    if(data.length > 0){
      return <MultiSelectField isReadOnly={this.props.isReadOnly} displayName="Associated Loci" paramName="associated_gene_ids" optionsUrl={GENES_URL} defaultValues={data} defaultOptions={data} />;
    }

  },

  _renderComments () {
    if (!this.props.isCurator) return null;
    return <TextField isReadOnly={this.props.isReadOnly} displayName='Comments' paramName='comments' defaultValue={this.state.data.comments} placeholder='comments' />;
  },

  _renderOrcid () {
    let orcid = this.state.data.orcid || '';
    if (this.props.isReadOnly) {
      if (orcid){
        return <StringField isReadOnly={this.props.isReadOnly} displayName="ORCID iD" paramName="orcid" defaultValue={orcid} />;
      }
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
        let _data = _.findWhere(json, { format_name: name });
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

  _renderControls () {
    if (this.props.isReadOnly) return null;
    let classSuffix = this.state.isUpdatePending ? ' disabled ' : '';
    let label = 'Submit';
    let saveIconNode = this.state.isUpdatePending ? null : <span><i className='fa fa-upload' /> </span>;
    let _onClick = e => {
      e.preventDefault();
      this._submitData();
    };
    return (
      <div>
        <div className='button-group' style={[style.controlContainer]}>
          <a onClick={_onClick} className={`button small secondary ${classSuffix}`}style={[style.controlButton]}>{saveIconNode}{label}</a>
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

export default connect(mapStateToProps)(Radium(Primer3));
