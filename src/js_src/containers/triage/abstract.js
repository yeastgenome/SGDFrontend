import React, { Component } from 'react';

const GENE_COLOR = '#1f77b4';
const ALIAS_COLOR = '#d62728';
const ALIAS_CHAR = '=';

class Abstract extends Component {
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
    let genes = this.getGenesAsArray();
    let aliasGenes = this.getAliasGenesAsArray();
    let abstract = this.props.abstract;
    genes.forEach( (d) => {
      abstract = abstract.replace(d, `<span style="background:${GENE_COLOR}; color: white; font-weight: bold;">${d}</span>`);
    });
    aliasGenes.forEach( (d) => {
      abstract = abstract.replace(d, `<span style="background:${ALIAS_COLOR}; color: white; font-weight: bold;">${d}</span>`);
    });
    return abstract;
  }

  render() {
    let abstract = this.getHighlightedAbstract();
    return (
      <p dangerouslySetInnerHTML={{ __html: abstract }} />
    );
  }
}

Abstract.propTypes = {
  abstract: React.PropTypes.string,
  geneList: React.PropTypes.string,
  isHighlightVisible: React.PropTypes.bool
};

export default Abstract;
