import React from "react";
import { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

class ResultsContainer extends Component {
  constructor(props) {}
}

function mapStateToProps(state) {
  return state;
}
export default connect(mapStateToProps)(ResultsContainer);
