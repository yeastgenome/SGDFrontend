import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import ColleaguesFormShow from './colleagues_form_show';

const ColleaguesShow = React.createClass({
  render () {
    return (
      <div>
        <ColleaguesFormShow
          isReadOnly={true} isCurator={true} 
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
