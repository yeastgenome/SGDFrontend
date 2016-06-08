import React from 'react';
import { connect } from 'react-redux';

const ColleaguesEdit = React.createClass({
  render() {
    return <h1>ColleaguesEdit</h1>;
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesEdit);
