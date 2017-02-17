import React, { Component } from 'react';

// import style from './style.css';

class LitList extends Component {
  render() {
    return <div>{this.props.entries.length}</div>;
  }
}

LitList.propTypes = {
  entries: React.PropTypes.array
};

export default LitList;
