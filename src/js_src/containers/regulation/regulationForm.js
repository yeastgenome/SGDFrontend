import React, { Component } from 'react';
import { connect } from 'react-redux';

class RegulationForm extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <p>form</p>
      </div>
    );
  }

}

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(RegulationForm);