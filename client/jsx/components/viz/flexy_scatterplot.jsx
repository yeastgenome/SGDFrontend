import React from 'react';
import { connect } from 'react-redux';
import d3 from 'd3';

const FlexyScatterplot = React.createClass({
  getInitialState () {
    return {
      dataResults: []   
    };
  },

  render () {
    return <h1>FlexyScatterplot</h1>
  },

  _fetchData () {

  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(FlexyScatterplot);
