import React, { Component } from 'react';

import LitBasicInfo from './litBasicInfo';
import LitStatus from './litStatus';

class TriageLit extends Component {
  render() {
    let d = { citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open' };
    return (
      <div>
        <h3>{d.citation}</h3>
        <div>
          <LitStatus isTriage={true} />
          <LitBasicInfo />
        </div>
      </div>
    );
  }
}

export default TriageLit;
