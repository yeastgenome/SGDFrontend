import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import _ from 'underscore';
import createReactClass from 'create-react-class';
import apiRequest from '../../lib/api_request.jsx';
import Captcha from '../widgets/google_recaptcha.jsx';
import {
  StringField,
  CheckField,
  TextField,
  MultiSelectField,
} from '../../components/widgets/form_helpers.jsx';
import PropTypes from 'prop-types';

const COLLEAGUES_AUTOCOMPLETE_URL =
  '/redirect_backend?param=autocomplete_results?category=colleague&q=';
const GENES_URL = '/redirect_backend?param=autocomplete_results?category=locus&q=';
const KEYWORDS_AUTOCOMPLETE_URL =
  '/redirect_backend?param=autocomplete_results?category=colleague&field=keywords&q=';
const INSTITUTION_URL =
  '/redirect_backend?param=autocomplete_results?category=colleague&field=institution&q=';

const TRIAGED_COLLEAGUE_URL = '/colleagues/triage';
const COLLEAGUE_GET_URL = '/colleagues';
const USER_COLLEAGUE_UPDATE_URL = '/redirect_backend?param=colleagues';
const CURATOR_COLLEAGUE_UPDATE_URL = TRIAGED_COLLEAGUE_URL;

const ColleaguesFormShow = createReactClass({
  propTypes: {
    isReadOnly: PropTypes.bool,
    isCurator: PropTypes.bool,
    isUpdate: PropTypes.bool,
    colleagueDisplayName: PropTypes.string,
    isTriage: PropTypes.bool,
    dispatch: PropTypes.func,
  },

  getInitialState() {
    return {
      data: {},
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      isComplete: false,
      error: null,
    };
  },

  render() {
    if (this.state.isComplete) return this._renderCompleteNode();
    let formLabel = this.props.isUpdate ? 'Update Colleague' : 'New Colleague';
    let showLabel = 'Colleague data not found';
    if (Object.keys(this.state.data).length > 0) {
      showLabel = this.state.isLoadPending
        ? '...'
        : `${this.state.data.first_name} ${this.state.data.last_name}`;
    }
    let label = this.props.isReadOnly ? showLabel : formLabel;
    return (
      <div>
        <h1>{label}</h1>
        {this._renderTriageNode()}
        {this._renderForm()}
      </div>
    );
  },

  componentDidMount() {
    if (this.props.isUpdate || this.props.isReadOnly) this._fetchData();
  },

  _renderTriageNode() {
    let onApprove = this._submitData;
    if (!this.props.isTriage || !this.props.isCurator) return null;
    return (
      <div className="button-group" style={[style.controlContainer]}>
        <a
          onClick={onApprove}
          className="button small"
          style={[style.controlButton]}
        >
          <i className="fa fa-check" /> Approve Update
        </a>
        <Link
          to="/curate/colleagues"
          className="button small secondary"
          style={[style.controlButton]}
        >
          <i className="fa fa-times" /> Cancel Update
        </Link>
      </div>
    );
  },

  _renderCompleteNode() {
    return (
      <div className="panel callout">
        <p>
          Thanks for the information! It will soon be received and put on the
          site.
        </p>
      </div>
    );
  },
  _colleague_contact_dets(data) {
    let temp = [];
    if (data.full_address) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Address(s)"
          paramName="full_address"
          defaultValue={data.full_address}
          key="fullAd"
        />
      );
    }
    if (data.city) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="City"
          paramName="city"
          defaultValue={data.city}
          key="address0"
        />
      );
    }
    if (data.state) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="State / Region"
          paramName="state"
          defaultValue={data.state}
          key="address1"
        />
      );
    }
    if (data.postal_code) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Zip"
          paramName="postal_code"
          defaultValue={data.postal_code}
          key="address2"
        />
      );
    }
    if (data.country) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Country"
          paramName="country"
          defaultValue={data.country}
          key="address3"
        />
      );
    }
    if (data.email) {
      if (data.display_email) {
        temp.push(
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="Email"
            paramName="email"
            defaultValue={data.email}
            key="email"
          />
        );
      }
    }
    if (data.phones) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Phones"
          paramName="phones"
          defaultValue={data.phones}
          key="phones"
        />
      );
    }

    return temp;
  },
  _colleague_dets(data) {
    let temp = [];
    if (data.fullname) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Name"
          paramName="fullname"
          defaultValue={data.fullname}
          key="name0"
        />
      );
    }
    if (data.profession) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Profession"
          paramName="profession"
          defaultValue={data.profession}
          key="profession"
        />
      );
    }
    if (data.position) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Title"
          paramName="position"
          defaultValue={data.position}
          key="position"
        />
      );
    }
    if (data.institution) {
      temp.push(
        <MultiSelectField
          isReadOnly={this.props.isReadOnly}
          displayName="Institution"
          paramName="institution"
          defaultValue={data.institution}
          optionsUrl={INSTITUTION_URL}
          isMulti={false}
          allowCreate={true}
          key="institution"
        />
      );
    }

    return temp;
  },

  _colleague_other_dets(data) {
    let temp = [];
    if (data.colleague_note) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Colleague Note"
          paramName="colleague_note"
          defaultValue={data.colleague_note}
          key="colleague_note"
        />
      );
    }
    if (data.research_interests) {
      temp.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Research Interests"
          paramName="research_interests"
          defaultValue={data.research_interests}
          key="research_interests"
        />
      );
    }
    if (data.keywords) {
      if (data.keywords.length > 0) {
        temp.push(
          <MultiSelectField
            isReadOnly={this.props.isReadOnly}
            displayName="Keywords"
            paramName="keywords"
            optionsUrl={KEYWORDS_AUTOCOMPLETE_URL}
            defaultValues={data.keywords}
            key="keywords"
          />
        );
      }
    }

    return temp;
  },
  _renderForm() {
    if (this.state.isLoadPending)
      return (
        <div className="sgd-loader-container">
          <div className="sgd-loader"></div>
        </div>
      );
    let data = this.state.data;
    let temp2 = [];

    if (data.lab_page) {
      temp2.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Lab Webpage"
          paramName="lab_page"
          defaultValue={data.lab_page}
          key="lap_page"
        />
      );
    }
    if (data.research_page) {
      temp2.push(
        <StringField
          isReadOnly={this.props.isReadOnly}
          displayName="Research Summary Webpage"
          paramName="research_page"
          defaultValue={data.research_page}
          key="research_page"
        />
      );
    }

    return (
      <div style={[style.container]}>
        {this._renderError()}
        {this._renderControls()}
        {this._renderCaptcha()}
        <form ref={(form) => (this.form = form)} onSubmit={this._submitData}>
          <div className="row">
            <div className="column small-12">
              {this._renderName()}
              {this._renderAddress()}
              {this._colleague_other_dets(this.state.data)}
              {this.props.isReadOnly ? [] : temp2}
              {this.props.isReadOnly ? [] : this._renderAssociates()}
              {this._renderGenes()}
              {this.props.isReadOnly ? this._renderOrcid() : []}
              {this._renderCuratorInput()}
            </div>
          </div>
        </form>
        {this._renderControls()}
      </div>
    );
  },

  _renderName() {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_dets(data);
    }
    return (
      <div className="row">
        <div className="columns small-3">
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="First Name"
            paramName="first_name"
            defaultValue={data.first_name}
          />
        </div>
        <div className="columns small-2">
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="Middle Name"
            paramName="middle_name"
            defaultValue={data.middle_name}
          />
        </div>
        <div className="columns small-5">
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="Last Name"
            paramName="last_name"
            defaultValue={data.last_name}
          />
        </div>
        <div className="columns small-2">
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="Suffix"
            paramName="suffix"
            defaultValue={data.suffix}
          />
        </div>
      </div>
    );
  },

  _renderAddress() {
    let data = this.state.data;
    if (this.props.isReadOnly) {
      return this._colleague_contact_dets(data);
    }
    return (
      <div>
        <div className="row">
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="Address"
              paramName="address1"
              defaultValue={data.address1}
              key="ad1"
            />
          </div>
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="Address"
              paramName="address2"
              defaultValue={data.address2}
              key="ad2"
            />
          </div>
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="Address"
              paramName="address3"
              defaultValue={data.address3}
              key="ad3"
            />
          </div>
        </div>
        <div className="row">
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="City"
              paramName="city"
              defaultValue={data.city}
            />
          </div>
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="State / Region"
              paramName="state"
              defaultValue={data.state}
            />
          </div>
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="Postal Code"
              paramName="postal_code"
              defaultValue={data.postal_code}
            />
          </div>
          <div className="column small-3">
            <StringField
              isReadOnly={this.props.isReadOnly}
              displayName="Country"
              paramName="country"
              defaultValue={data.country}
            />
          </div>
        </div>
      </div>
    );
  },

  _renderAssociates() {
    let supervisors = this.state.data.supervisors || [];
    let labMembers = this.state.data.lab_members || [];
    let temp = [];
    let _formatLink = (d) => {
      return `/colleague/${d.format_name}/overview`;
    };
    if (supervisors.length > 0) {
      temp.push(
        <MultiSelectField
          isReadOnly={this.props.isReadOnly}
          displayName="Supervisor(s)"
          paramName="supervisors"
          optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
          defaultValues={supervisors}
          defaultOptions={supervisors}
          allowCreate={true}
          key="associate0"
          isLinks={true}
          formatLink={_formatLink}
        />
      );
    }
    if (labMembers.length > 0) {
      temp.push(
        <MultiSelectField
          isReadOnly={this.props.isReadOnly}
          displayName="Lab Members"
          paramName="lab_members"
          optionsUrl={COLLEAGUES_AUTOCOMPLETE_URL}
          defaultValues={labMembers}
          defaultOptions={labMembers}
          allowCreate={true}
          key="associate1"
          isLinks={true}
          formatLink={_formatLink}
        />
      );
    }

    if (temp.length > 0) {
      return temp;
    }
  },

  _renderCuratorInput() {
    if (!this.props.isCurator && this.props.isReadOnly) return null;
    let data = this.state.data;
    return (
      <div>
        {this._renderComments()}
        <CheckField
          isReadOnly={this.props.isReadOnly}
          displayName="Beta Tester"
          paramName="beta_tester"
          defaultValue={data.beta_tester}
        />
        <CheckField
          isReadOnly={this.props.isReadOnly}
          displayName="Show Email"
          paramName="show_email"
          defaultValue={data.show_email}
        />
        <CheckField
          isReadOnly={this.props.isReadOnly}
          displayName="Receive Newsletter"
          paramName="newsletter"
          defaultValue={data.newsletter}
        />
      </div>
    );
  },

  _renderGenes() {
    let data = this.state.data.associated_genes || [];
    if (data.length > 0) {
      return (
        <MultiSelectField
          isReadOnly={this.props.isReadOnly}
          displayName="Associated Loci"
          paramName="associated_gene_ids"
          optionsUrl={GENES_URL}
          defaultValues={data}
          defaultOptions={data}
        />
      );
    }
  },

  _renderComments() {
    if (!this.props.isCurator) return null;
    return (
      <TextField
        isReadOnly={this.props.isReadOnly}
        displayName="Comments"
        paramName="comments"
        defaultValue={this.state.data.comments}
        placeholder="comments"
      />
    );
  },

  _renderOrcid() {
    let orcid = this.state.data.orcid || '';
    if (this.props.isReadOnly) {
      if (orcid) {
        return (
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="ORCID iD"
            paramName="orcid"
            defaultValue={orcid}
          />
        );
      }
    } else {
      return (
        <div>
          <StringField
            isReadOnly={this.props.isReadOnly}
            displayName="ORCID iD"
            paramName="orcid"
            defaultValue={orcid}
          />
          <p>
            Get an ORCID iD at{' '}
            <a href="https://orcid.org/register">https://orcid.org/register</a>.
          </p>
        </div>
      );
    }
  },

  _fetchData() {
    this.setState({ isLoadPending: true });
    if (this.props.isTriage) {
      let url = TRIAGED_COLLEAGUE_URL;
      let name = this.props.colleagueDisplayName;
      apiRequest(url).then((json) => {
        let _data = _.findWhere(json, { format_name: name });
        this.setState({ data: _data, isLoadPending: false });
      });
    } else {
      let backendSegment = this.props.isCurator ? '' : '/backend';
      let url = `${backendSegment}${COLLEAGUE_GET_URL}/${this.props.colleagueDisplayName}`;
      apiRequest(url).then((json) => {
        this.setState({ data: json, isLoadPending: false });
      });
    }
  },

  _renderControls() {
    if (this.props.isReadOnly) return null;
    let classSuffix = this.state.isUpdatePending ? ' disabled ' : '';
    let label = this.state.isUpdatePending ? 'Saving...' : 'Send Update';
    let saveIconNode = this.state.isUpdatePending ? null : (
      <span>
        <i className="fa fa-upload" />{' '}
      </span>
    );
    let _onClick = (e) => {
      e.preventDefault();
      this._submitData();
    };
    return (
      <div>
        <div className="button-group" style={[style.controlContainer]}>
          <a
            onClick={_onClick}
            className={`button small secondary ${classSuffix}`}
            style={[style.controlButton]}
          >
            {saveIconNode}
            {label}
          </a>
          <a
            href="/search?category=colleague"
            className="button small secondary"
            style={[style.controlButton]}
          >
            <i className="fa fa-search" /> Search Colleagues
          </a>
        </div>
      </div>
    );
  },

  _renderCaptcha() {
    if (this.props.isReadOnly || this.props.isCurator) return null;
    return (
      <div style={[style.controlContainer]}>
        <Captcha onComplete={() => {}} />
      </div>
    );
  },

  // saves form data to server, if new makes POST
  _submitData(e) {
    if (e) e.preventDefault();
    let _data = new FormData(this.form);
    let _method = this.props.isUpdate ? 'PUT' : 'POST';
    let url;
    if (this.props.isCurator) {
      url = `${CURATOR_COLLEAGUE_UPDATE_URL}/${this.props.colleagueDisplayName}`;
    } else {
      url = this.props.isUpdate
        ? `${USER_COLLEAGUE_UPDATE_URL}/${this.props.colleagueDisplayName}`
        : USER_COLLEAGUE_UPDATE_URL;
    }
    let options = {
      data: _data,
      method: _method,
    };
    apiRequest(url, options)
      .then((response) => {
        // is complete
        this.setState({ error: null });
        // let curator redirect to index
        if (this.props.isCurator) {
          this.props.dispatch(push('/curate/colleagues'));
        } else {
          this.setState({ isComplete: true });
        }
      })
      .catch((e) => {
        this.setState({ error: e.message });
      });
  },

  _renderError() {
    if (!this.state.error) return null;
    return (
      <div className="callout warning">
        <p>{this.state.error}</p>
      </div>
    );
  },
});

const style = {
  container: {
    marginBottom: '2rem',
  },
  controlContainer: {
    marginBottom: '1rem',
  },
  controlButton: {
    marginRight: '0.5rem',
  },
};

function mapStateToProps(_state) {
  return {};
}

export default connect(mapStateToProps)(Radium(ColleaguesFormShow));
