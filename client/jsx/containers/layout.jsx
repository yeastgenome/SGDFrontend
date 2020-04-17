import React, { Component } from 'react';
import Header from './layout/header.jsx';
import Footer from './layout/footer.jsx';
import PropTypes from 'prop-types';

class Layout extends Component {
  render() {
    return (
      <div>
        <Header />
        <div className="container" id="layout-document">
          <div className="row">
            <div className="columns small-12">{this.props.children}</div>
          </div>
        </div>
        <Footer assetRoot={window.ASSET_ROOT} />
      </div>
    );
  }
}

Layout.propTypes = {
  children: PropTypes.any,
};

module.exports = Layout;
