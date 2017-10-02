import React, { Component } from 'react';
import { connect } from 'react-redux';

import TagList from '../../components/tagList';
import fetchData from '../../lib/fetchData';
import { clearTags, updateTags } from './litActions';

class Tags extends Component {
  componentDidMount() {
    this.fetchData();
  }

  handleSave(e) {
    e.preventDefault();
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    console.log(this.props.activeTags);
    let options = {
      data: JSON.stringify({ tags: this.props.activeTags }),
      type: 'PUT'
    };
    fetchData(url, options).then( data => {
      this.props.dispatch(updateTags(data));
    });
  }

  fetchData() {
    let id = this.props.id;
    let url = `/reference/${id}/tags`;
    this.props.dispatch(clearTags());
    fetchData(url).then( data => {
      // // translate API format into that expected by TagList component
      // let grouped = _.groupBy(data, 'tag');
      // let tagNames = Object.keys(grouped);
      // let clientData = tagNames.map( (d) => {
      //   let tagName = _.findWhere(allTags, { label: d }).name;
      //   let theseTags = grouped[d];
      //   let reducedGeneNames = theseTags.reduce( (acc, d, i) => {
      //     let isLast = (i === theseTags.length - 1);
      //     let suffix = isLast ? '' : ', ';
      //     let locusName = d.locus ? d.locus.display_name : '';
      //     acc += `${locusName}${suffix}`;
      //     return acc;
      //   }, '');
      //   return {
      //     name: tagName,
      //     genes: reducedGeneNames
      //   };
      // });
      this.props.dispatch(updateTags(data));
    });
  }

  render() {
    let _onUpdate = newEntry => {
      this.props.dispatch(updateTags(newEntry));
    };
    return (
      <div>
        <TagList tags={this.props.activeTags} onUpdate={_onUpdate} />
        <a className='button' onClick={this.handleSave.bind(this)} style={{ marginTop: '1rem' }}>Save</a>
      </div>
    );
  }
}

Tags.propTypes = {
  activeTags: React.PropTypes.array,
  dispatch: React.PropTypes.func,
  id: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    activeTags: state.lit.get('activeTags').toJS()
  };
}

export default connect(mapStateToProps)(Tags);
