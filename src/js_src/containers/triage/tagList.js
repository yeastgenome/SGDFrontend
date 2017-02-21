import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'underscore';

import { allTags } from '../curateLit/litConstants';

class TagList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: allTags
    }; 
  }

  componentDidUpdate() {
  }

  toggleSelected(_value) {
    let newState = this.state;
    let targetEntry = _.findWhere(newState.data, { value:  _value });
    targetEntry.isSelected = !targetEntry.isSelected;
    this.setState(newState);
  }

  renderCommentSection(d) {
    if (!d.isSelected) return null;
    let onTypeGenes = (e) => {
      let newVal = e.currentTarget.value;
      let newState = this.state;
      let targetEntry = _.findWhere(newState.data, { value:  d.value });
      targetEntry.genes = newVal;
      this.setState(newState);
    };
    return (
      <div className='row'>
        <div className='column small-6'>
          <label>Genes</label>
          <input onChange={onTypeGenes} type='text' />
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
      this.toggleSelected(d.value);
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

TagList.propTypes = {
  dispatch: React.PropTypes.func,
  id: React.PropTypes.number
};

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(TagList);
