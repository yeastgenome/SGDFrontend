import React, { Component } from 'react';
import _ from 'underscore';

import style from './style.css';
import { allTags } from '../../containers/curateLit/litConstants';

class TagList extends Component {
  updateTags(newTags) {
    this.props.onUpdate(newTags, true);
  }

  handleCommentChange(_name, _comment) {
    let tagData = this.getTagData();
    let activeEntry = _.findWhere(tagData, { name: _name });
    activeEntry.comment = _comment;
    this.updateTags(tagData);
  }

  handleGeneChange(_name, _genes) {
    let tagData = this.getTagData();
    let activeEntry = _.findWhere(tagData, { name: _name });
    activeEntry.genes = _genes;
    this.updateTags(tagData);
  }

  getTagData() {
    return this.props.tags || [];
  }

  getData() {
    let tagData = this.getTagData();
    let _allTags = allTags;
    if (this.props.isTriage) _allTags = _.filter(allTags, d => d.inTriage );
    let tags = _allTags.map( (d) => {
      let existing = _.findWhere(tagData, { name: d.name });
      if (existing) {
        d = _.extend(d, existing);
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
      let newEntry = { name: _name, genes: '', comment: '' };
      tagData.push(newEntry);
    }
    this.updateTags(tagData);
  }

  renderGenes(name, value) {
    if (this.props.isReadOnly) {
      return <span>{value}</span>;
    } else {
      let _handleChange = e => { this.handleGeneChange(name, e.target.value); };
      return (
        <div>
          <label>Genes (pipe-separated)</label>
          <input className='sgd-geneList' data-type={name} onChange={_handleChange} type='text' defaultValue={value} />
        </div>
      );
    }
  }

  renderComments(name, value) {
    if (this.props.isReadOnly) {
      return <span>{value}</span>;
    } else {
      let _handleChange = e => { this.handleCommentChange(name, e.target.value); };
      return (
        <div>
           <label>Comment</label>
          <input className='sgd-comment' data-type={name} onChange={_handleChange} type='text' defaultValue={value} />
        </div>
      );
    }
  }

  renderTags() {
    let entryTags = this.getData();
    let nodes = entryTags.map( (d, i) => {
      let classSuffix = d.isSelected ? '' : style.inactive;
      let suffixNode = (d.isSelected && !this.props.isReadOnly) ? <span> <i className='fa fa-close' /></span> : null;
      let geneSuffixNode = (d.isSelected && d.hasGenes) ? this.renderGenes(d.name, d.genes) : null;
      let commentSuffixNode = d.isSelected ? this.renderComments(d.name, d.comment) : null;
      let _onClick = (e) => {
        e.preventDefault();
        this.toggleSelected(d.name);
      };
      return (
        <div key={`sTag${i}`}>
          <a className={`button small ${style.tagButton} ${classSuffix}`} onClick={_onClick}>
            {d.label}
            {suffixNode}
          </a>
          <div className={`row ${style.tagInner}`}>
            <div className='columns small-6'>
              {geneSuffixNode}
            </div>
            <div className='columns small-6'>
              {commentSuffixNode}
            </div>
          </div>
        </div>
      );
    });
    return (
      <div>
        {nodes}
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
  tags: React.PropTypes.array,
  onUpdate: React.PropTypes.func,
  isReadOnly: React.PropTypes.bool,
  isTriage: React.PropTypes.bool
};

export default TagList;
