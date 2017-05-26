import React, { Component } from 'react';

import style from './style.css';
import Abstract from './abstract';

class LitBasicInfo extends Component {
  renderCitation() {
    if (this.props.hideCitation) return null;
    return <h4 dangerouslySetInnerHTML={{ __html: this.props.citation }} />;
  }

  renderLinks() {
    let pubmedUrl = `https://www.ncbi.nlm.nih.gov/pubmed/${this.props.pmid}`;
    return (
      <div className={style.linkContainer}>
        <span><a href={this.props.fulltextUrl} target='_new'>Full Text</a> PubMed: <a href={pubmedUrl} target='_new'>{this.props.pmid}</a></span>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderCitation()}
        {this.renderLinks()}
        <Abstract abstract={this.props.abstract} geneList={this.props.geneList} hideGeneList={this.props.hideGeneList} />
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
