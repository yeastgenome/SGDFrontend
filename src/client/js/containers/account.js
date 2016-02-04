import React from 'react';
import { connect } from 'react-redux';

const Account = React.createClass({
  render() {
    return <h1>Account</h1>
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(Account);
