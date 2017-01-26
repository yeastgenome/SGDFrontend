import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import style from './style.css';
import LitTable from './LitTable';
import { selectTriageEntries } from '../../selectors/litSelectors';

class LitList extends Component {
  renderSingleTab(label, href, isActive, total) {
    let totalNode = <span className='badge'>{total.toLocaleString()}</span>;
    if (isActive) {
      return <li className='tabs-title is-active'><Link aria-selected='true' to={href}>{label} {totalNode}</Link></li>;
    } else {
      return <li className='tabs-title'><Link to={href}>{label} {totalNode}</Link></li>;
    }
  }

  render() {
    let entries = this.props.triageEntries;
    return (
      <div>
        <h1>Literature Triage</h1>
        <div className={style.litTableContainer}>
          <LitTable entries={entries} fields={['citation', 'tags', 'assignees']} />
        </div>
      </div>
    );
  }
}

LitList.propTypes = {
  isTriage: React.PropTypes.bool,
  triageEntries: React.PropTypes.array
};

function mapStateToProps(state) {
  let _isTriage = state.routing.locationBeforeTransitions.pathname.search('triage') >= 0;
  return {
    isTriage: _isTriage,
    triageEntries: selectTriageEntries(state)
  };
}

export { LitList as LitList };
export default connect(mapStateToProps)(LitList);
