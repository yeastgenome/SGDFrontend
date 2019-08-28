import React, { Component } from 'react';
import PropTypes from 'prop-types';
import style from './style.css';

const GENE_COLOR = '#1f77b4';
const ALIAS_COLOR = '#d62728';
const ALIAS_CHAR = '=';
const SEPARATOR = ' ';

class Abstract extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isGenesVisible: true
    }; 
  }

  handleToggleShowGenes() {
    this.setState({ isGenesVisible: !this.state.isGenesVisible });
  }

  getGenesAsArray() {
    let gl = this.props.geneList;
    if (gl.length === 0) return [];
    return gl
      .split(SEPARATOR)
      .filter( d => d.indexOf(ALIAS_CHAR) === -1 )
      .map( d => d.replace('|', '') );
  }

  getAliasGenesAsArray() {
    let gl = this.props.geneList;
    if (gl.length === 0) return [];
    gl = gl
      .split(SEPARATOR)
      .filter( d => d.indexOf(ALIAS_CHAR) > -1 )
      .map( (d) => {
        return d.split(ALIAS_CHAR)[0];
      })
      .map( d => d.replace('|', '') );
    return gl;
  }

  getHighlightedAbstract() {
    let abstract = this.props.abstract;
    if (this.props.hideGeneList || !this.state.isGenesVisible) return abstract;
    let genes = this.getGenesAsArray();
    let aliasGenes = this.getAliasGenesAsArray();
    genes.forEach( (d) => {
      let geneRegex = new RegExp(d, 'g');
      abstract = abstract.replace(geneRegex, `<span style="background:${GENE_COLOR}; color: white; font-weight: bold;">${d}</span>`);
    });
    aliasGenes.forEach( (d) => {
      let geneRegex = new RegExp(d, 'g');
      abstract = abstract.replace(geneRegex, `<span style="background:${ALIAS_COLOR}; color: white; font-weight: bold;">${d}</span>`);
    });
    return abstract;
  }

  renderGenesText() {
    if (this.props.hideGeneList || !this.state.isGenesVisible) return null;
    if (this.props.geneList === '') return <p className='label secondary'>No gene names in abstract</p>;
    return <textarea defaultValue={this.props.geneList} />;
  }

  renderLinks() {
    let pubmedUrl = `https://www.ncbi.nlm.nih.gov/pubmed/${this.props.pmid}`;
    return (
      <div className={style.linkContainer}>
        <span><a href={this.props.fulltextUrl} target='_new'>Full Text</a> PubMed: <a href={pubmedUrl} target='_new'>{this.props.pmid}</a></span>
      </div>
    );
  }


  renderCheck() {
    if (this.props.hideGeneList || this.props.geneList === '') return null;
    return (
      <div>
        <input type='checkbox' onChange={this.handleToggleShowGenes.bind(this)} checked={this.state.isGenesVisible} />
        <label onClick={this.handleToggleShowGenes.bind(this)}>Show Gene Names in Abstract</label>
      </div>
    );
  }

  render() {
    let abstract = this.getHighlightedAbstract();
    return (
      <div className='row'>
        <div className='columns small-9'>
          <p dangerouslySetInnerHTML={{ __html: abstract }} />
        </div>
        <div className='columns small-3'>
          {this.renderLinks()}
          {this.renderGenesText()}
          {this.renderCheck()}
        </div>
      </div>
    );
  }
}

Abstract.propTypes = {
  abstract: PropTypes.string,
  fulltextUrl: PropTypes.string,
  geneList: PropTypes.string,
  hideGeneList: PropTypes.bool,
  pmid: PropTypes.string
};

export default Abstract;
