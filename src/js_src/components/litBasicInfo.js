import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Abstract from './abstract';

class LitBasicInfo extends Component {
  renderCitation() {
    if (this.props.hideCitation) return null;
    return <h4 dangerouslySetInnerHTML={{ __html: this.props.citation }} />;
  }

  render() {
    return (
      <div>
        {this.renderCitation()}
        <Abstract {...this.props} />
      </div>
    );
  }
}

LitBasicInfo.propTypes = {
  abstract: PropTypes.string,
  citation: PropTypes.string,
  hideCitation: PropTypes.bool,
  hideGeneList: PropTypes.bool,
  fulltextUrl: PropTypes.string,
  geneList: PropTypes.string,
  pmid: PropTypes.string,
};

export default LitBasicInfo;
