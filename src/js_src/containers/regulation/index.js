import React, { Component } from 'react';
import { connect } from 'react-redux';
import CurateLayout from '../curateHome/layout';

class Regulation extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <CurateLayout>
        <div>
          <p>Component template </p>
        </div>
      </CurateLayout>
    );
  }

}

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(Regulation);