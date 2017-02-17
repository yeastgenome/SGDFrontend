import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import { selectTriageEntries } from '../../selectors/litSelectors';
import { updateTriageEntries } from './triageActions';

const TRIAGE_URL = '/reference/triage';

class LitTriageIndex extends Component {
  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    fetchData(TRIAGE_URL).then( (data) => {
      this.props.dispatch(updateTriageEntries(data.entries));
    });
  }

  renderEntries() {
    let nodes = this.props.triageEntries.map( (d) => {
      return (
        <div key={'te' + d.curation_id}>
          <h5>{d.basic.citation}</h5>
          <a className='button secondary small'><i className='fa fa-trash' /> Discard</a>
          <p dangerouslySetInnerHTML={{ __html: d.basic.abstract }} />
        </div>
      );
    });
    return (
      <div>
        {nodes}
      </div>
    );
  }

  render() {
    return (
      <div>
        <h1>Literature Triage</h1>
        <div className={style.litTableContainer}>
          {this.renderEntries()}
        </div>
      </div>
    );
  }
}

LitTriageIndex.propTypes = {
  dispatch: React.PropTypes.func,
  triageEntries: React.PropTypes.array
};

function mapStateToProps(state) {
  return {
    triageEntries: selectTriageEntries(state)
  };
}

export { LitTriageIndex as LitTriageIndex };
export default connect(mapStateToProps)(LitTriageIndex);
