import React from 'react';
import { connect } from 'react-redux';

const Home = React.createClass({
  render() {
    return <h1>Home</h1>
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(Home);
