import React, { Component } from 'react';
// import Select from 'react-select';
import _ from 'underscore';

import style from './style.css';
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
    let tags = allTags.map( (d) => {
      let existing = _.findWhere(tagData, { name: d.name });
      if (existing) {
        d.isSelected = true;
        // create a string of genes
      } else {
        d.isSelected = false;
      }
      return d;
    });
    if (this.props.isReadOnly) {
      tags = tags.filter( d => d.isSelected );
    }
    return tags;
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

  renderTags() {
    let entryTags = this.getData();
    let nodes = entryTags.map( (d, i) => {
      let classSuffix = d.isSelected ? '' : style.inactive;
      let suffixNode = d.isSelected ? <span> <i className='fa fa-close' /></span> : null;
      let geneSuffixNode = (d.isSelected && d.hasGenes) ? <input className='sgd-geneList' data-name={d.name} type='text' /> : null;
      let commentSuffixNode = d.isSelected ? <input type='text' /> : null;
      let sectionLabelNode = d.sectionLabel ? <h5>{d.sectionLabel}</h5> : null;
      let _onClick = (e) => {
        e.preventDefault();
        this.toggleSelected(d.name);
      };
      return (
        <div key={`sTag${i}`}>
          {sectionLabelNode}
          <div className='row'>
            <div className='columns small-4'>
              <a className={`button small ${classSuffix}`} onClick={_onClick}>
                {d.label}
                {suffixNode}
              </a>
            </div>
            <div className='columns small-4'>
              {geneSuffixNode}
            </div>
            <div className='columns small-4'>
              {commentSuffixNode}
            </div>
          </div>
        </div>
      );
    });
    return (
      <div>
        <div className='row'>
          <div className='columns small-4'>
            Tag
          </div>
          <div className='columns small-4'>
            Genes
          </div>
          <div className='columns small-4'>
            Comment
          </div>
        </div>
        <div>
          {nodes}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderTags()}
      </div>
    );
  }
}

TagList.propTypes = {
  entry: React.PropTypes.object,
  onUpdate: React.PropTypes.func,
  isReadOnly: React.PropTypes.bool
};

export default TagList;
