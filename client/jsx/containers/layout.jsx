import React, { Component } from 'react';

import Header from './layout/header.jsx';
import Footer from './layout/footer.jsx';

const Layout = React.createClass({
  render () {
    return (
      <div>
        <ul className='large-social-links show-for-large-up'>
          <li><a href='/suggestion' target='_blank' id='email-header' className='webicon mail medium'>Email Us</a></li>
          <li><a href='http://twitter.com/#!/yeastgenome' target='_blank' id='twitter' className='webicon twitter medium'>Twitter</a></li>
          <li><a href='https://www.facebook.com/pages/Saccharomyces-Genome-Database-SGD/139140876128200' target='_blank' className='webicon facebook medium' id='facebook'>Facebook</a></li>
          <li><a href='https://www.linkedin.com/company/saccharomyces-genome-database' target='_blank' className='webicon linkedin medium' id='linkedin'>Linkedin</a></li>
          <li><a href='https://www.youtube.com/SaccharomycesGenomeDatabase' target='_blank' id='youtube' className='webicon youtube medium'>YouTube</a></li>
          <li><a href='/feed' target='_blank' id='rss' className='webicon rss medium'>RSS</a></li>
        </ul>
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
