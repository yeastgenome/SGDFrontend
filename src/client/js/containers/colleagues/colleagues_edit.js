import React from 'react';
import { connect } from 'react-redux';

import Loader from '../../components/widgets/loader';
import ColleaguesFormShow from './colleagues_form_show';

const ColleaguesEdit = React.createClass({
  render () {
    return (
      <ColleaguesFormShow isUpdate={this._isUpdate()} colleagueDisplayName={this.props.routeParams.colleagueDisplayName} isCurator={true} />
    );
  },

  // true if edit page,not /new
  _isUpdate () {
    return (typeof this.props.routeParams.colleagueDisplayName === 'string');
  }

});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesEdit);
