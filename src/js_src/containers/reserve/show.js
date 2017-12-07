import React, { Component } from 'react';
// import { Link } from 'react-router';

import CurateLayout from '../curateHome/layout';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_BASE_URL = '/reservations';

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
    if (this.state.data) {
      return (
        <div>
        </div>
      );
    }
    return <Loader />;
  }

  render() {
    return (
      <CurateLayout>
        {this.renderRes()}
      </CurateLayout>
    );
  }
}

export default GeneNameReservation;
