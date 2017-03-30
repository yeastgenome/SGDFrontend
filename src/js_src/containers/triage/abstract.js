import React, { Component } from 'react';

const GENE_COLOR = '#1f77b4';
const ALIAS_COLOR = '#d62728';
const ALIAS_CHAR = '=';

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
      .split(',')
      .filter( d => d.indexOf(ALIAS_CHAR) === -1 )
      .map( d => d.replace(' ', '') );
  }

  getAliasGenesAsArray() {
    let gl = this.props.geneList;
    if (gl.length === 0) return [];
    gl = gl
      .split(',')
      .filter( d => d.indexOf(ALIAS_CHAR) > -1 )
      .map( (d) => {
        return d.split(ALIAS_CHAR)[0];
      })
      .map( d => d.replace(' ', '') );
    return gl;
  }

  getHighlightedAbstract() {
    let abstract = this.props.abstract;
    if (!this.state.isGenesVisible) return abstract;
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
    if (!this.state.isGenesVisible) return null;
    if (this.props.geneList === '') return <p className='label secondary'>No gene names in abstract</p>;
    return <textarea defaultValue={this.props.geneList} />;
  }

  renderCheck() {
    if (this.props.geneList === '') return null;
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
      <div>
        <p dangerouslySetInnerHTML={{ __html: abstract }} />
        {this.renderGenesText()}
        {this.renderCheck()}
      </div>
    );
  }
}

Abstract.propTypes = {
  abstract: React.PropTypes.string,
  geneList: React.PropTypes.string,
};

export default Abstract;
