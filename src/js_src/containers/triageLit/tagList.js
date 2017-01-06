import React, { Component } from 'react';
import _ from 'underscore';

import { allTags } from '../curateLit/litConstants';

class TagList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: allTags
    }; 
  }

  toggleSelected(_name) {
    let newState = this.state;
    let targetEntry = _.findWhere(newState.data, { name:  _name });
    targetEntry.isSelected = !targetEntry.isSelected;
    this.setState(newState);
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
    return this.state.data.map( (d, i) => {
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

export default TagList;
