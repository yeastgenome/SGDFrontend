import React, { Component } from 'react';

import style from './style.css';
import { makeFieldDisplayName } from '../lib/searchHelpers';

class CategoryLabel extends Component {
  renderIcon() {
    let color = CAT_COLORS[this.props.category];
    return <span className={style.catIcon} style={{ backgroundColor: color }} />;
  }

  render() {
    let label = makeFieldDisplayName(this.props.category);
    let labelNode = this.props.hideLabel ? null : <span className={style.catLabel}> {label}</span>;
    return <span>{this.renderIcon()}{labelNode}</span>;
  }
}

CategoryLabel.propTypes = {
  category: React.PropTypes.string,
  hideLabel: React.PropTypes.bool
};

export default CategoryLabel;

const CAT_COLORS = {
  locus: '#1f77b4',
  reference: '#ff7f0e',
  biological_process: '#2ca02c',
  cellular_component: '#9467bd',
  molecular_function: '#8c564b',
  phenotype: '#e377c2',
  strain: '#bcbd22',
  resource: '#17becf',
  contig: '#7f7f7f',
  download: '#d62728',
  colleague: '#ff9896',
  observable: '#f7b6d2',
  reserved_name: '#aec7e8'
};
