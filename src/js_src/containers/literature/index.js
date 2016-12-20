import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import style from './style.css';
import LitTable from './LitTable';
import { selectActiveEntries, selectTriageEntries } from '../../selectors/litSelectors';

class LitList extends Component {
  formatEntries() {
    return this.props.isTriage ? this.props.triageEntries : this.props.curateEntries;
  }

  renderSingleTab(label, href, isActive) {
    if (isActive) {
      return <li className='tabs-title is-active'><Link aria-selected='true' to={href}>{label}</Link></li>;
    } else {
      return <li className='tabs-title'><Link to={href}>{label}</Link></li>;
    }
  }

  renderTabs() {
    return (
      <ul className='tabs'>
        {this.renderSingleTab('Triage', 'triage_literature', this.props.isTriage)}
        {this.renderSingleTab('Curate', 'literature', !this.props.isTriage)}
      </ul>
    );
  }

  render() {
    let entries = this.formatEntries();
    return (
      <div>
        <h1>Literature in Curation</h1>
        {this.renderTabs()}
        <div className={style.litTableContainer}>
          <LitTable entries={entries} fields={['citation', 'tags', 'assignees']} />
        </div>
      </div>
    );
  }
}

LitList.propTypes = {
  curateEntries: React.PropTypes.array,
  isTriage: React.PropTypes.bool,
  triageEntries: React.PropTypes.array
};

function mapStateToProps(state) {
  let _isTriage = state.routing.locationBeforeTransitions.pathname.search('triage') >= 0;
  return {
    curateEntries: selectActiveEntries(state),
    isTriage: _isTriage,
    triageEntries: selectTriageEntries(state)
  };
}

export { LitList as LitList };
export default connect(mapStateToProps)(LitList);
