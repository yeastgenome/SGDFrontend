import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import _ from 'underscore';

import ColleaguesSearchResults from './search_results';
import Loader from '../../components/widgets/loader';
import apiRequest from '../../lib/api_request';

const TRIAGED_COLLEAGUE_URL = '/colleagues/triage';

const ColleaguesIndex = React.createClass({
  getInitialState() {
    return {
      data: null,
      isPending: false,
    };
  },

  render () {
    return (
      <div>
        <h1>Triaged Colleague Updates</h1>
        <hr />
        <a className='button' onClick={this._fetchData}><i className='fa fa-refresh' /> Refresh</a>
        {this._renderTable()}
      </div>
    );
  },

  componentDidMount() {
    this._fetchData();
  },

  _renderTable () {
    if (this.state.isPending) return <Loader />;
    if (!this.state.data) return null;
    let rowNodes = this.state.data.map( d => {
      let url = `curate/colleagues/triage/${d.id}`;
      return (
        <tr key={`ctr${d.id}`}>
          <td><Link to={url}>{d.name}</Link></td>
          <td>{d.receivedAt.toDateString()} {d.receivedAt.toLocaleTimeString()}</td>
        </tr>
      );
    });
    return (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Time Received</th>
          </tr>
        </thead>
        <tbody>
          {rowNodes}
        </tbody>
      </table>
    );
  },

  _fetchData () {
    this.setState({ isPending: true });
    apiRequest(TRIAGED_COLLEAGUE_URL).then( response => {
      let formattedData = response.map( d => {
        let formattedName;
        if (d.data.last_name && d.data.first_name) {
          formattedName = `${d.data.last_name}, ${d.data.first_name}`;
        } else {
          formattedName = '(no name provided)';
        }
        return {
          name: formattedName,
          receivedAt: new Date(d.created_at),
          id: d.triage_id
        };
      });
      this.setState({
        isPending: false,
        data: formattedData,

      });
    });
  }
});

const GRAY = '#cacaca';
const styles = {
  tabList: {
    marginTop: '1rem',
    marginLeft: 0,
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${GRAY}`
  },
  tab: {
    display: 'inline',
    padding: '0.75rem',
    cursor: 'pointer'
  },
  activeTab: {
    background: GRAY
  }
};

export default Radium(ColleaguesIndex);
