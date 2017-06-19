import React, { Component } from 'react';

import ColleagueFormShow from './colleagues/colleagueFormShow';

class ColleaguesEdit extends Component {
  render() {
    let formatName = this.props.params.formatName;
    return (
      <div>
        <ColleagueFormShow
          isCurator={false} colleagueDisplayName={formatName} isUpdate
        />
      </div>
    );
  }
}

ColleaguesEdit.propTypes = {
  params: React.PropTypes.object
};

export default ColleaguesEdit;
