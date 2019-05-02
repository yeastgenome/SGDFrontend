import React, { Component } from 'react';
import { connect } from 'react-redux';

class FileUpload extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <p>File upload</p>
      </div>
    );
  }

}

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(FileUpload);