import React from 'react';
import { connect } from 'react-redux';
import createReactClass from 'create-react-class';

const ExampleContainer = createReactClass({
  render() {
    return <h1>Example</h1>;
  },
});

function mapStateToProps(_state) {
  return {};
}

module.exports = connect(mapStateToProps)(ExampleContainer);
