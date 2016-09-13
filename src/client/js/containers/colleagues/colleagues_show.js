import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import ColleaguesFormShow from './colleagues_form_show';

const ColleaguesShow = React.createClass({
  render () {
    return (
      <div>
        <p>
          <Link to={`/curate/colleagues/${this.props.routeParams.formatName}/edit`}><i className='fa fa-edit' /> Colleague Update Form</Link>
        </p>
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
