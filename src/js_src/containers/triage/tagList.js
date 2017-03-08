import React, { Component } from 'react';
import _ from 'underscore';

import { allTags } from '../curateLit/litConstants';

class TagList extends Component {
  updateTags(newTags) {
    let newEntry = this.props.entry;
    newEntry.data.tags = newTags;
    this.props.onUpdate(newEntry, true);
  }

  getTagData() {
    return this.props.entry.data.tags || [];
  }

  getData() {
    let tagData = this.getTagData();
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

  toggleSelected(_name) {
    let tagData = this.getTagData();
    let isExisting = _.findWhere(tagData, { name: _name });
    if (isExisting) {
      tagData = tagData.filter( d => d.name !== _name );
    } else {
      let newEntry = { name: _name, genes: [] };
      tagData.push(newEntry);
    }
    this.updateTags(tagData);
  }

  renderCommentSection(d) {
    if (!d.isSelected) return null;
    // let tagData = this.getTagData();
    // let tagEntry = _.findWhere(tagData, { name: d.name });
    let _onChange = () => {
      // e.target.value;
    };
    return (
      <div className='row'>
        <div className='column small-6'>
          <label>Genes</label>
          <input className='sgd-geneList' data-tag-label={d.label} data-tag-name={d.name} type='text' onChange={_onChange} />
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
        <input type='checkbox' onChange={_onChange} checked={d.isSelected} />
        {d.label}
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
  onUpdate: React.PropTypes.func
};

export default TagList;
