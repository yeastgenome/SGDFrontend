import React from 'react';
import Loader from '../../components/widgets/loader';

const COLLEAGUE_GET_URL = '/colleagues';

const ColleaguesShow = React.createClass({
  getInitialState () {
    return {
      data: null,
      isPending: false
    };
  },

  render () {
    if (this.state.isPending) return <Loader />;
    return <h1>ColleaguesShow</h1>;
  },

  componentDidMount() {
    this._fetchData();
  },

  _fetchData () {
    this.setState({ isPending: true });
    let displayName = this.props.routeParams.colleagueDisplayName;
    fetch(`${COLLEAGUE_GET_URL}/${displayName}`, {
      credentials: 'same-origin',
    }).then( response => {
      return response.json();
    }).then( json => {
      this.setState({ data: json, isPending: false });
    });
  }
});

export default ColleaguesShow;
