import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
// import { Link } from 'react-router-dom';
import t from 'tcomb-form';
import PropTypes from 'prop-types';
import CategoryLabel from '../../components/categoryLabel';
import CurateLayout from '../curateHome/layout';
import DetailList from '../../components/detailList';
import FlexiForm from '../../components/forms/flexiForm';
import { setMessage } from '../../actions/metaActions';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_BASE_URL = '/reservations';

class GeneNameReservationStandardize extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    let url = `${DATA_BASE_URL}/${this.props.match.params.id}`;
    fetchData(url).then( _data => {
      this.setState({ data: _data });
    });
  }

  handleSuccess() {
    this.props.dispatch(setMessage(`${this.state.data.display_name} was standardized.`));
    this.props.dispatch(push({ pathname: '/' }));
  }

  renderForm() {
    let data = this.state.data;
    if (!data) return <Loader />;
    let standardizeSchema = t.struct({
      gene_name_pmid: t.maybe(t.String),
      name_description_pmid: t.maybe(t.String)
    });
    let standardizeOptions = {
      fields: {
        gene_name_pmid: {
          label: 'Gene Name PMID *'
        },
        name_description_pmid: {
          label: 'Name Description PMID (optional)'
        }
      }
    };
    let standardizeUrl = `${DATA_BASE_URL}/${this.props.match.params.id}/standardize`;
    let _defaultData = null;
    return (
      <div>
        <h3><CategoryLabel category='reserved_name' hideLabel /> Reserved Gene Name: {data.display_name} / {data.systematic_name}</h3>
        <p>Standardize the gene name by entering the PMID(s) in the fields below and clicking the button. The personal communication will automatically be deleted if it is not used on other gene name reservations.</p>
        <DetailList data={data} fields={['name_description']} />
        <div className='row'>
          <div className='columns small-12 medium-4'>
            <FlexiForm defaultData={_defaultData} onSuccess={this.handleSuccess.bind(this)} requestMethod='POST' tFormSchema={standardizeSchema} tFormOptions={standardizeOptions} updateUrl={standardizeUrl} submitText='Associate PMID(s) and Standardize' />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <CurateLayout>
        <div className='row'>
          <div className='columns small-12 medium-8'>
            {this.renderForm()}
          </div>
        </div>
      </CurateLayout>
    );
  }
}

GeneNameReservationStandardize.propTypes = {
  match: PropTypes.object,
  dispatch: PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(GeneNameReservationStandardize);
