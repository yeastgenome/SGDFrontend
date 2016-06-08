import React from 'react';
import { connect } from 'react-redux';

const ColleaguesShow = React.createClass({
  render() {
    return <h1>ColleaguesShow</h1>;
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesShow);
