import React, { Component } from 'react';
import { connect } from 'react-redux';

import TagList from '../../components/tagList';
import fetchData from '../../lib/fetchData';

class Tags extends Component {
  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    fetchData(url).then( (data) => {
      console.log(data);
    });
  }

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

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(Tags);
