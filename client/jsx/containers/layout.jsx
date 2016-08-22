import React, { Component } from 'react';

import Header from './layout/header.jsx';
import Footer from './layout/footer.jsx';

const Layout = React.createClass({
  render () {
    return (
      <div>
        <Header />
        <div className='container' id='layout-document'>
          <div className='row'>
            <div className='columns small-12'>
              {this.props.children}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
});

module.exports = Layout;
