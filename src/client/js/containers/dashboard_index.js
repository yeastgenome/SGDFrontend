import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

const DashboardIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>SGD</h1>
        <hr />
        <p><Link to='/dashboard/files/new'><i className='fa fa-upload'/> Upload a dataset</Link></p>
      </div>
    )
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(DashboardIndex);
