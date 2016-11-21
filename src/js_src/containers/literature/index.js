import React, { Component } from 'react';
import { connect } from 'react-redux';

import LitList from './litList';

class LiteratureIndexComponent extends Component {
  formatEntries() {
    return this.props.entries;
  }

  render() {
    let entries = this.formatEntries();
    return (
      <div>
        <h1>Literature in Curation</h1>
        <hr />
        <a className='button' href='#'><i className='fa fa-plus' /> New Reference</a>
        <p>{entries.length.toLocaleString()} references in curation</p>
        <LitList entries={entries} />
      </div>
    );
  }
}

LiteratureIndexComponent.propTypes = {
  entries: React.PropTypes.array
};


function mapStateToProps(state) {
  return {
    entries: state.lit.activeEntries
  };
}


export { LiteratureIndexComponent as LiteratureIndexComponent };
export default connect(mapStateToProps)(LiteratureIndexComponent);
