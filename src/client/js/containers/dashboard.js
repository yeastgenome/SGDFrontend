import React from 'react';
import { Link } from 'react-router';

const Dashboard = React.createClass({
  render() {
    return (
      <div className='row'>
        <div className='columns small-2'>
          <ul className='vertical menu'>
            <li>
              <Link to='/dashboard' className='btn btn-default'><i className='fa fa-home' /> Home</Link>
            </li>
            <li>
              <Link to='/dashboard/files/new' className='btn btn-default'><i className='fa fa-upload' /> Upload</Link>
            </li>
          </ul>
        </div>
        <div className='columns small-10'>
          {this.props.children}
        </div>
      </div>
    );
  }
});

export default Dashboard;
