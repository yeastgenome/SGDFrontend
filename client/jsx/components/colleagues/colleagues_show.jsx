import React from 'react';
import { connect } from 'react-redux';

import apiRequest from '../../lib/api_request.jsx';
import ColleaguesFormShow from './colleagues_form_show.jsx';

const ColleaguesShow = React.createClass({
  componentDidMount() {
    this.fetchData();
  },

  fetchData() {
    let formatName = this.props.routeParams.formatName;
    let url = `/backend/colleagues/${formatName}`;
    apiRequest(url).then( json => {
      console.log(json);
      // let _data = _.findWhere(json, { format_name: name });
      // this.setState({ data: _data, isLoadPending: false });
    });
  },

  render () {
    return (
      <div>
        <ColleaguesFormShow
          isReadOnly={true} isCurator={false} 
          colleagueDisplayName={this.props.routeParams.formatName}
        />
      </div>
    );
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesShow);
