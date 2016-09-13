import React from 'react';
import { connect } from 'react-redux';

import ColleaguesFormShow from './colleagues_form_show.js';

const ColleaguesEdit = React.createClass({
  render () {
    return (
      <ColleaguesFormShow isUpdate={this._isUpdate()} colleagueDisplayName={this.props.routeParams.formatName} isCurator={true} />
    );
  },

  // true if edit page,not /new
  _isUpdate () {
    return (typeof this.props.routeParams.formatName === 'string');
  }
});

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(ColleaguesEdit);
