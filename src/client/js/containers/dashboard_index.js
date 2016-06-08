import React from 'react';
import { Link } from 'react-router';

const DashboardIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>SGD Curator</h1>
        <hr />
        <p><Link to='/dashboard/files/new'><i className='fa fa-upload'/> Upload a dataset</Link></p>
      </div>
    );
  }
});

export default DashboardIndex;
