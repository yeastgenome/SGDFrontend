import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
// import { Link } from 'react-router';
import t from 'tcomb-form';

import CategoryLabel from '../../components/categoryLabel';
import CurateLayout from '../curateHome/layout';
import FlexiForm from '../../components/forms/flexiForm';
import { setMessage } from '../../actions/metaActions';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_BASE_URL = '/reservations';

class GeneNameReservationEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    let url = `${DATA_BASE_URL}/${this.props.params.id}`;
    fetchData(url).then( _data => {
      this.setState({ data: _data });
    });
  }

  handleUpdateSuccess() {
    this.props.dispatch(setMessage('Gene name reservation updated.'));
  }

  handlePmidSuccess() {
    this.props.dispatch(setMessage('Publication associated with gene name reservation.'));
  }

  renderForms() {
    let data = this.state.data;
    let reserveSchema = t.struct({
      systematic_name: t.String,
      name_description: t.String
    });
    let reserveOptions = {
      fields: {
        name_description: {
          type: 'textarea'
        }
      }
    };
    let pmidSchema = t.struct({
      pmid: t.String
    });
    let pmidOptions = {
      fields: {
        pmid: {
          label: 'PMID'
        }
      }
    };
    let reserveUpdateUrl = `${DATA_BASE_URL}/${this.props.params.id}`;
    let pmidUpdateUrl = `${DATA_BASE_URL}/${this.props.params.id}/pmid`;
    if (data) {
      return (
        <div>
          <h3><CategoryLabel category='reserved_name' hideLabel /> Reserved Gene Name: {data.display_name}</h3>
          <div>
            <FlexiForm defaultData={data} onSuccess={this.handleUpdateSuccess.bind(this)} requestMethod='PUT' tFormSchema={reserveSchema} tFormOptions={reserveOptions} updateUrl={reserveUpdateUrl} />
            <p>Add PMID to change personal communication to reference. The personal communication will only be deleted if it is not used on other gene name reservations.</p>
            <div className='row'>
              <div className='columns small-12 medium-4'>
                <FlexiForm onSuccess={this.handlePmidSuccess.bind(this)} requestMethod='PUT' tFormSchema={pmidSchema} tFormOptions={pmidOptions} updateUrl={pmidUpdateUrl} submitText='Associate PMID' />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <Loader />;
  }

  render() {
    return (
      <CurateLayout>
        <div className='row'>
          <div className='columns small-12 medium-6'>
            {this.renderForms()}
          </div>
        </div>
      </CurateLayout>
    );
  }
}

GeneNameReservationEdit.propTypes = {
  params: React.PropTypes.object,
  dispatch: React.PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(GeneNameReservationEdit);
