import React, { Component } from 'react';
import PhenotypeList from '../../components/editableList/phenotypeList';

class CurateLitPhenotype extends Component {
  render() {
    return (
      <div>
        <h5>Phenotype Annotations</h5>
        <PhenotypeList />
      </div>
    );
  }
}

export default CurateLitPhenotype;
