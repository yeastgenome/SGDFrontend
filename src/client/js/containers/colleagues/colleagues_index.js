import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

const ColleaguesIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>Colleagues</h1>
        <hr />
        <Link to='/curate/colleagues/new' className='button small'>Add New Colleague</Link>
      </div>
    );
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesIndex);
