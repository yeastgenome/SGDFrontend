import React, { Component } from 'react';
import Select from 'react-select';
import { connect } from 'react-redux';

import style from './style.css';
import { allTags } from '../curateLit/litConstants';
import { selectActiveLitEntry, selectUsers } from '../../selectors/litSelectors';
import { updateAssignees, updateTags } from '../../actions/litActions';

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
    let onChangeAssignees = (curators) => {
      let updateAction = updateAssignees(curators);
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
          onChange={onChangeAssignees}
          options={this.props.users}
          value={this.props.activeEntry.assignees}
          labelKey='name' valueKey='username'
          multi
        />
        <div className={`row ${style.actionContainer}`}>
          <div className='columns small-6'>
            <a className='button primary' href='#'><i className='fa fa-check-circle-o' /> Move to Curation</a>
          </div>
          <div className='columns small-6 text-right'>
            <span className={style.updateTime}>Updated {this.props.activeEntry.lastUpdated.toLocaleString()}</span>
            <a className='button' href='#'><i className='fa fa-save' /> Save</a>
          </div>
        </div>
      </div>
    );
  }
}

LitStatus.propTypes = {
  activeEntry: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  users: React.PropTypes.array
};

function mapStateToProps(state) {
  return {
    activeEntry: selectActiveLitEntry(state),
    users: selectUsers(state)
  };
}
export default connect(mapStateToProps)(LitStatus);

