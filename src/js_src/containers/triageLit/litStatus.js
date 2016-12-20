import React, { Component } from 'react';
import Select from 'react-select';
import { connect } from 'react-redux';

import style from './style.css';
import { allTags } from '../curateLit/litConstants';
import { selectActiveLitEntry, selectUsers } from '../../selectors/litSelectors';
import { updateAssignees, updateTags } from '../../actions/litActions';

class LitStatus extends Component {
  renderMoveButton() {
    if (this.props.isTriage) {
      return <a className='button primary' href='#'><i className='fa fa-check-circle-o' /> Move to Curation</a>;
    }
    return null;
  }

  render() {
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
            <div>
              {this.renderMoveButton()}
              <a className='button secondary' href='#'><i className='fa fa-trash' /> Archive</a>
            </div>           
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
  isTriage: React.PropTypes.bool,
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

