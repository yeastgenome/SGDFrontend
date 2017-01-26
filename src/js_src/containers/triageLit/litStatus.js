import React, { Component } from 'react';
import Select from 'react-select';
import { connect } from 'react-redux';

import style from './style.css';
import { selectActiveLitEntry, selectUsers } from '../../selectors/litSelectors';
import { updateAssignees } from '../../actions/litActions';

class LitStatus extends Component {
  renderMoveButton() {
    if (this.props.isTriage) {
      return <a className='button primary' href='#'><i className='fa fa-check-circle-o' /> Add to Database</a>;
    }
    return null;
  }

  render() {
    let onChangeAssignees = (curators) => {
      let updateAction = updateAssignees(curators);
      this.props.dispatch(updateAction);
    };
    return (
      <div className={style.statusContainer}>
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

