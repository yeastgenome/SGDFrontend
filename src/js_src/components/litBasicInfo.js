import React, { Component } from 'react';

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
  abstract: React.PropTypes.string,
  citation: React.PropTypes.string,
  hideCitation: React.PropTypes.bool,
  hideGeneList: React.PropTypes.bool,
  fulltextUrl: React.PropTypes.string,
  geneList: React.PropTypes.string,
  pmid: React.PropTypes.string,
};

export default LitBasicInfo;
