import React from 'react';
import { connect } from 'react-redux';

const ColleaguesIndex = React.createClass({
  render() {
    return <h1>ColleaguesIndex</h1>
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesIndex);
