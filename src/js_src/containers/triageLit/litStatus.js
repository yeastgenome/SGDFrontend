import React, { Component } from 'react';
import Select from 'react-select';
import { connect } from 'react-redux';

import style from './style.css';
import { allTags } from '../curateLit/litConstants';
import { selectActiveLitEntry } from '../../selectors/litSelectors';
import { updateTags } from '../../actions/litActions';

class LitStatus extends Component {
  render() {
    // TEMP
    // let d = {
    //   id: '#12345abc',
    //   pmid: '123456',
    //   title: 'Lorem Ipsum',
    //   citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
    //   tags: ['tag A', 'tag B']
    // };
    let tagOptions = allTags.map( d => { 
      return { label: d, value: d };
    });
    let onChangeTags = (newTags) => {
      let updateAction = updateTags(newTags);
      this.props.dispatch(updateAction);
    };
    return (
      <div className={style.statusContainer}>
        <label>Tags</label>
        <Select
          onChange={onChangeTags}
          options={tagOptions}
          value={this.props.activeEntry.tags}
          multi
        />
        <label>Assignees</label>
        <Select
          options={[]}
          multi
        />
        <div className={`row ${style.actionContainer}`}>
          <div className='columns small-6'>
          </div>
          <div className='columns small-6 text-right'>
            <span>Updated 1/1/17</span>
            <a className='button' href='#'><i className='fa fa-save' /> Save</a>
          </div>
        </div>
      </div>
    );
  }
}

LitStatus.propTypes = {
  activeEntry: React.PropTypes.object,
  dispatch: React.PropTypes.func
};

function mapStateToProps(state) {
  return {
    activeEntry: selectActiveLitEntry(state)
  };
}
export default connect(mapStateToProps)(LitStatus);

