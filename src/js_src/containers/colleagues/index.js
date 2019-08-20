import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import CurateLayout from '../curateHome/layout';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';

const DATA_URL = '/colleagues/triage';

class ColleagueTriageIndex extends Component {
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

  renderColleagues() {
    if (this.state.data) {
      if (this.state.data.length === 0) return <div><h2>Colleague Updates</h2><p>No updates have been submitted.</p></div>;
      let trs = this.state.data.map( (d, i) => {
        return (
          <tr key={`gtr${d.id}`}>
            <td>{`${d.first_name} ${d.last_name}`}</td>
            <td>{d.type}</td>
            <td>{d.submission_date}</td>
            <td><Link to={`/colleagues/triage/${d.id}`}><i className='fa fa-edit' /> Curate</Link></td>
          </tr>
        );
      });
      return (
        <div>
          <h2>Colleague Updates</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Submission Date</th>
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
        {this.renderColleagues()}
      </CurateLayout>
    );
  }
}

export default ColleagueTriageIndex;
