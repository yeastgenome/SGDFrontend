import React, { Component } from 'react';

const Header = require('./layout/header.jsx');
const Footer = require('./layout/footer.jsx');

const Layout = React.createClass({
  render () {
    return (
      <div>
        <Header {...this.props}/>
        <div className='container'>
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
