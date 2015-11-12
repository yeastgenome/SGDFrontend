import React, { Component } from 'react';

const Header = require('./layout/header.jsx');
const Footer = require('./layout/footer.jsx');

const Layout = React.createClass({
  render () {
    return (
      <div>
        <Header {...this.props}/>
        <div className='container'>
          {this.props.children}
        </div>
        <Footer />
      </div>
    );
  }
});

module.exports = Layout;
