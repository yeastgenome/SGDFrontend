import React from 'react';
import { connect } from 'react-redux';

import ColleaguesFormShow from './colleagues_form_show.jsx';

const ColleaguesShow = React.createClass({
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
