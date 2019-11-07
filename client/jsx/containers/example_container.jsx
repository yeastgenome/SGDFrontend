import React from 'react';
import { connect } from 'react-redux';

const ExampleContainer = React.createClass({
  render() {
    return <h1>Example</h1>
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ExampleContainer);
