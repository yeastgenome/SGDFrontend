import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import { selectActiveLitEntry } from '../../selectors/litSelectors';

class LitStatus extends Component {
  render() {
    return (
      <div className={style.statusContainer}>
        <div className={`row ${style.actionContainer}`}>
          <div className='columns small-6' />
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
  };
}
export default connect(mapStateToProps)(LitStatus);

