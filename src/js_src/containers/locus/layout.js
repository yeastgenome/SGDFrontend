import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import t from 'tcomb-form';

import style from './style.css';
import CategoryLabel from '../../components/categoryLabel';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';
import updateTitle from '../../lib/updateTitle';
import { updateData, setPending, clearPending} from './locusActions';
import { setMessage, setError, clearError } from '../../actions/metaActions';
import { PREVIEW_URL } from '../../constants.js';

const BASE_CURATE_URL = '/curate/locus';
const SECTIONS = [
  'basic',
  'summaries'
];

class LocusLayout extends Component {
  componentDidMount() {
    this.fetchData();
  }

  handleSubmit(e) {
    e.preventDefault();
    let value = this.formInput.getValue();
    if (value) {
      let id = this.props.params.id;
      let url = `/locus/${id}/curate`;
      this.props.dispatch(setPending());
      fetchData(url, { type: 'PUT', data: value }).then( (data) => {
        this.props.dispatch(updateData(data));
        this.props.dispatch(setMessage('Locus was updated successfully.'));
        this.props.dispatch(clearError());
        this.props.dispatch(clearPending());
      }).catch( (data) => {
        let errorMessage = data ? data.error : 'There was an error updating the locus.';
        this.props.dispatch(setError(errorMessage));
        this.props.dispatch(clearPending());
        let errorData = this.props.data;
        errorData.paragraphs = value;
        this.props.dispatch(updateData(errorData));
      });
    }
  }

  fetchData() {
    let id = this.props.params.id;
    let url = `/locus/${id}/curate`;
    this.props.dispatch(updateData(null));
    fetchData(url).then( (data) => {
      updateTitle(data.name);
      this.props.dispatch(clearPending());
      this.props.dispatch(updateData(data));
    }); 
  }

  renderForms() {
    let FormSchema = t.struct({
      phenotype_summary: t.maybe(t.String),
      regulation_summary: t.maybe(t.String),
      regulation_summary_pmids: t.maybe(t.String)
    });
    let options = {
      fields: {
        phenotype_summary: {
          type: 'textarea'
        },
        regulation_summary: {
          type: 'textarea'
        },
        regulation_summary_pmids: {
          label: 'Regulation summary PMIDs (space-separated)'
        }
      }
    };
    let data = this.props.data.paragraphs;
    return (
      <div className='sgd-curate-form row'>
        <div className='columns small-12 medium-6'>
          <form onSubmit={this.handleSubmit.bind(this)}>
            <t.form.Form options={options} ref={input => this.formInput = input} type={FormSchema} value={data} />
            <div className='form-group'>
              <button type='submit' className='button'>Save</button>
            </div>
        </form>
        </div>
      </div>
    );
  }

  renderNav() {
    let baseUrl = `${BASE_CURATE_URL}/${this.props.params.id}`;
    let current = this.props.pathname.replace(baseUrl, '');
    let nodes = SECTIONS.map( (d) => {
      let relative;
      if (d === 'basic') {
        relative = '';
      } else {
        relative = `/${d}`;
      }
      let isActive = (current === relative);
      let url = `${baseUrl}${relative}`;
      let _className = isActive ? style.activeNavLink : style.navLink;
      return <li key={`lit${d}`}><Link className={_className} to={url}>{d}</Link></li>;
    });
    return <ul className={`vertical menu ${style.menu}`}>{nodes}</ul>;
  }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    let previewUrl = `${PREVIEW_URL}/locus/${this.props.params.id}`;
    return (
      <div>
        <h3 style={{ display: 'inline-block', marginRight: '0.5rem' }}><CategoryLabel category='locus' hideLabel isPageTitle /> {data.name}</h3>
        <span><a href={previewUrl} target='_new'><i className='fa fa-file-image-o' aria-hidden='true'></i> preview</a></span>
        <hr style={{ margin: 0 }} />
        <div className='row'>
          <div className='columns small-2'>
            {this.renderNav()}
          </div>
          <div className='columns small-10'>
            {this.renderForms()}
          </div>  
        </div>
        
      </div>
    );
  }
}

LocusLayout.propTypes = {
  data: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  isPending: React.PropTypes.bool,
  pathname: React.PropTypes.string,
  params: React.PropTypes.object
};

function mapStateToProps(state) {
  let _data = state.locus.get('data') ? state.locus.get('data').toJS() : null;
  return {
    data: _data,
    isPending: state.locus.get('isPending'),
    pathname: state.routing.locationBeforeTransitions.pathname
  };
}

export { LocusLayout as LocusLayout };
export default connect(mapStateToProps)(LocusLayout);
