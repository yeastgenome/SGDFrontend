import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import { selectTriageEntries } from '../../selectors/litSelectors';
import { promoteEntry, updateTriageEntries } from './triageActions';

const TRIAGE_URL = '/reference/triage';
// const PROMOTE_URL_SUFFIX = 'promote';

class LitTriageIndex extends Component {
  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    fetchData(TRIAGE_URL).then( (data) => {
      this.props.dispatch(updateTriageEntries(data.entries));
    });
  }

  promoteEntry(id) {
    this.props.dispatch(promoteEntry(id));
    // let url = `${TRIAGE_URL}/${id}/${PROMOTE_URL_SUFFIX}`;
    // let fetchOptions = {
    //   type: 'PUT',
    //   headers: {
    //     'X-CSRF-Token': window.CSRF_TOKEN,        
    //   }
    // };
    // fetchData(url, fetchOptions).then( () => {
    //   this.props.dispatch(promoteEntry(id));
    // });
  }

  renderEntries() {
    let nodes = this.props.triageEntries.map( (d) => {
      let handlePromoteClick = (e) => {
        e.preventDefault();
        this.promoteEntry(d.curation_id);
      };
      return (
        <div key={'te' + d.curation_id}>
          <h5>{d.basic.citation}</h5>
          <div>
            <a className='button secondary small'><i className='fa fa-trash' /> Discard</a>
            <a className='button small' onClick={handlePromoteClick}><i className='fa fa-check' /> Add to Database</a>
          </div>
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
