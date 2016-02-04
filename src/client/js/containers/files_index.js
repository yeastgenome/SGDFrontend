import React from 'react';
import { connect } from 'react-redux';

const FilesIndex = React.createClass({
  render() {
    return <h1>Files#Index</h1>
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(FilesIndex);
