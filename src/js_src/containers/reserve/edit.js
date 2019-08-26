import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { push } from 'connected-react-router';
// import { Link } from 'react-router-dom';
import t from 'tcomb-form';
import PropTypes from 'prop-types';
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
    let url = `${DATA_BASE_URL}/${this.props.match.params.id}`;
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
      display_name: t.String,
      systematic_name: t.maybe(t.String),
      name_description: t.maybe(t.String),
      notes: t.maybe(t.String)
    });
    let reserveOptions = {
      fields: {
        display_name: {
          label: 'Proposed name'
        },
        systematic_name: {
          label: 'Systematic name'
        },
        name_description: {
          type: 'textarea',
          label: 'Name description'
        },
        notes: {
          type: 'textarea'
        }
      }
    };
    
    let reserveUpdateUrl = `${DATA_BASE_URL}/${this.props.match.params.id}`;
    
    if (data) {
      return (
        <div>
          <h3><CategoryLabel category='reserved_name' hideLabel /> Reserved Gene Name: {data.display_name}</h3>
          <div>
            <FlexiForm defaultData={data} onSuccess={this.handleUpdateSuccess.bind(this)} requestMethod='PUT' tFormSchema={reserveSchema} tFormOptions={reserveOptions} updateUrl={reserveUpdateUrl} />
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
  match: PropTypes.object,
  dispatch: PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(GeneNameReservationEdit);
