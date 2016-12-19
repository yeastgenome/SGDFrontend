import React, { Component } from 'react';
import { connect } from 'react-redux';

// import LitList from './litList';

import style from './style.css';
import LitTable from './LitTable';
import { selectTriageEntries } from '../../selectors/litSelectors';

class TriageLit extends Component {
  formatEntries() {
    return this.props.entries;
  }

  renderTabs() {
    return (
      <ul className='tabs'>
        <li className='tabs-title is-active'><a aria-selected='true'>Triage</a></li>
        <li className='tabs-title'><a>Curating</a></li>
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

TriageLit.propTypes = {
  entries: React.PropTypes.array
};


function mapStateToProps(state) {
  return {
    entries: selectTriageEntries(state)
  };
}


export { TriageLit as TriageLit };
export default connect(mapStateToProps)(TriageLit);
