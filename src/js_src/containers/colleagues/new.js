import React, { Component } from 'react';

import ColleagueFormShow from './colleagueFormShow';

class Colleagues extends Component {
  render() {
    return (
      <div>
        <ColleagueFormShow
          isCurator={false} 
        />
      </div>
    );
  }
}

export default Colleagues;
