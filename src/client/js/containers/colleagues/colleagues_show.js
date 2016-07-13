import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import ColleaguesFormShow from './colleagues_form_show';

const ColleaguesShow = React.createClass({
  render () {
    return (
      <div>
        <ul className='menu simple'>
          <li><Link to='/curate/colleagues'><i className='fa fa-chevron-left' /> All Colleagues</Link></li>
          <li><Link to={`/curate/colleagues/${this.props.routeParams.colleagueDisplayName}/edit`}><i className='fa fa-edit' /> Edit</Link></li>
        </ul>
        <ColleaguesFormShow
          isReadOnly={true} isCurator={true} 
          colleagueDisplayName={this.props.routeParams.colleagueDisplayName}
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
