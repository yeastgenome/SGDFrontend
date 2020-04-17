import React from 'react';
import createReactClass from 'create-react-class';

const Layout = createReactClass({
  render() {
    return (
      <div className="sgd-loader-container">
        <div className="sgd-loader" />
      </div>
    );
  },
});

module.exports = Layout;
