import React, { Component } from 'react';
// import { Link } from 'react-router';

import CategoryLabel from '../../components/categoryLabel';
import CurateLayout from '../curateHome/layout';
import DetailList from '../../components/detailList';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_BASE_URL = '/reservations';
const DISPLAY_KEYS = ['reservation_status', 'display_name', 'name_description', 'locus', 'reservation_date', 'expiration_date', 'submitter_name', 'submitter_email', 'reference'];

class GeneNameReservation extends Component {
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

  renderRes() {
    let data = this.state.data;
    if (data) {
      return (
        <div>
          <h3><CategoryLabel category='reserved_name' hideLabel /> Reserved Gene Name: {data.display_name}</h3>
          <a><i className='fa fa-edit' /> Edit</a>
          <DetailList data={data} fields={DISPLAY_KEYS} />
        </div>
      );
    }
    return <Loader />;
  }

  renderActions() {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
        <a className='button primary'><i className='fa fa-check' /> Standardize Gene Name</a>
        <a className='button secondary'>Extend Gene Name Reservation</a>
        <a className='button alert'><i className='fa fa-trash' /> Discard Gene Name Reservation</a>
      </div>
    );
  }

  render() {
    return (
      <CurateLayout>
        <div>
          {this.renderRes()}
          {this.renderActions()}
        </div>
      </CurateLayout>
    );
  }
}

GeneNameReservation.propTypes = {
  params: React.PropTypes.object
};

export default GeneNameReservation;
