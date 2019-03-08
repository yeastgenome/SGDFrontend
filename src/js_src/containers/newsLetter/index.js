import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';

// import fetchData from '../../lib/fetchData';
// const DATA_URL = '/colleagues_subscriptions';

class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data:null
    };
  }

  render() {
    return (
      <CurateLayout>
        {<h1>NewsLetter</h1>}
      </CurateLayout>);
  }
}

// export default connect(mapStateToProps)(NewsLetter);
export default NewsLetter;
