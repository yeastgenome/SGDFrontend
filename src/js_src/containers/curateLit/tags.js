import React, { Component } from 'react';
import { connect } from 'react-redux';

import TagList from '../../components/tagList';
import { selectActiveLitId } from '../../selectors/litSelectors';

class Tags extends Component {
  render() {
    // TEMP
    let _entry = {
      data: {
        tags: []
      }
    };
    return (
      <div>
        <TagList entry={_entry} />
      </div>
    );
  }
}

Tags.propTypes = {
  id: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    id: selectActiveLitId(state),
  };
}

export default connect(mapStateToProps)(Tags);
