import React, { Component } from 'react';
import _ from 'underscore';

import { allTags } from '../curateLit/litConstants';

class TagList extends Component {
  getData() {
    let tagData = this.props.entry.data.tags || [];
    return allTags.map( (d) => {
      let existing = _.findWhere(tagData, { name: d.name });
      if (existing) {
        d.isSelected = true;
        // create a string of genes
      } else {
        d.isSelected = false;
      }
      return d;
    });
  }

  toggleSelected() {
  }

  renderCommentSection(d) {
    if (!d.isSelected) return null;
    return (
      <div className='row'>
        <div className='column small-6'>
          <label>Genes</label>
          <input type='text' />
        </div>
        <div className='column small-6'>
          <label>Comment</label>
          <input type='text' />
        </div>
      </div>
    );
  }

  renderSingleCheck(d) {
    let _onChange = () => {
      this.toggleSelected(d.name);
    };
    return (
      <label>
        <input type='checkbox' onChange={_onChange} value={d.isSelected} />
        {d.name}
      </label>
    );
  }

  renderChecks() {
    return this.getData().map( (d, i) => {
      return (
        <div key={'check' + i}>
          {this.renderSingleCheck(d)}
          {this.renderCommentSection(d)}
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        <span>Tags</span>
        {this.renderChecks()}
      </div>
    );
  }
}

TagList.propTypes = {
  entry: React.PropTypes.object,
  onChange: React.PropTypes.func
};

export default TagList;
