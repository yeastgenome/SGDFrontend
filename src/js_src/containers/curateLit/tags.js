import React, { Component } from 'react';
import { connect } from 'react-redux';

import TagList from '../../components/tagList';

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
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(Tags);
