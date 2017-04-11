import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'underscore';

import TagList from '../../components/tagList';
import fetchData from '../../lib/fetchData';
import { allTags } from './litConstants';
import { updateActiveTags } from './litActions';

class Tags extends Component {
  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    fetchData(url).then( (data) => {
      // translate API format into that expected by TagList component
      let grouped = _.groupBy(data, 'tag');
      let tagNames = Object.keys(grouped);
      let clientData = tagNames.map( (d) => {
        let tagName = _.findWhere(allTags, { label: d }).name;
        let theseTags = grouped[d];
        let reducedGeneNames = theseTags.reduce( (acc, d, i) => {
          let isLast = (i === theseTags.length - 1);
          let suffix = isLast ? '' : ', ';
          acc += `${d.locus.display_name}${suffix}`;
          return acc;
        }, '');
        return {
          name: tagName,
          genes: reducedGeneNames
        };
      });
      let newActive = { data: { tags: clientData }};
      this.props.dispatch(updateActiveTags(newActive));
    });
  }

  render() {
    let _onUpdate = newEntry => {
      this.props.dispatch(updateActiveTags(newEntry));
    };
    return (
      <div>
        <TagList entry={this.props.activeTagData} onUpdate={_onUpdate} />
      </div>
    );
  }
}

Tags.propTypes = {
  activeTagData: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  id: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    activeTagData: state.lit.get('activeTagData').toJS()
  };
}

export default connect(mapStateToProps)(Tags);
