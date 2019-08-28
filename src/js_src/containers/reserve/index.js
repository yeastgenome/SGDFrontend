import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import CurateLayout from '../curateHome/layout';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_URL = '/reservations';

class GeneNameReservationIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    fetchData(DATA_URL).then( _data => {
      this.setState({ data: _data });
    });
  }

  renderReses() {
    if (this.state.data) {
      let trs = this.state.data.map( (d, i) => {
        let orfName = d.systematic_name || 'n/a';
        return (
          <tr key={`gtr${d.id}`}>
            <td>{d.display_name}</td>
            <td>{orfName}</td>
            <td>{d.reservation_date}</td>
            <td>{d.expiration_date}</td>
            <td>{d.reference.display_name}</td>
            <td>{d.reservation_status}</td>
            <td><Link to={`/reservations/${d.id}`}><i className='fa fa-edit' /> Curate</Link></td>
          </tr>
        );
      });
      return (
        <div>
          <h2>Gene Name Reservations</h2>
          <table>
            <thead>
              <tr>
                <th>Proposed Name</th>
                <th>ORF</th>
                <th>Reservation Date</th>
                <th>Expiration Date</th>
                <th>Reference</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trs}
            </tbody>
          </table>
        </div>
      );
    }
    return <Loader />;
  }

  render() {
    return (
      <CurateLayout>
        {this.renderReses()}
      </CurateLayout>
    );
  }
}

export default GeneNameReservationIndex;
