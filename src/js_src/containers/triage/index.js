import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import { selectTriageEntries } from '../../selectors/litSelectors';
import { updateTriageEntries } from './triageActions';
import TriageControls from './triageControls';

const TRIAGE_URL = '/reference/triage';
const REFRESH_INTERVAL = 7000;
const TIME_VAR = 'refreshTimeout';

class LitTriageIndex extends Component {
  componentDidMount() {
    this.fetchData();
    // create the refresh timer
    this.clearRefreshTimer();
    this[TIME_VAR] = setInterval(this.fetchData.bind(this), REFRESH_INTERVAL);
  }

  componentWillUnmount() {
    this.clearRefreshTimer();
  }

  clearRefreshTimer() {
    if (this[TIME_VAR]) clearInterval(this[TIME_VAR]);
  }

  fetchData() {
    fetchData(TRIAGE_URL).then( (data) => {
      this.props.dispatch(updateTriageEntries(data.entries, this.props.username));
    });
  }

  renderLinks(d) {
    let pubmedUrl = `https://www.ncbi.nlm.nih.gov/pubmed/${d.basic.pmid}`;
    return (
      <div>
        <span><a href={d.basic.fulltext_url} target='_new'>Full Text</a> PubMed: <a href={pubmedUrl} target='_new'>{d.basic.pmid}</a></span>
      </div>
    );
  }

  renderEntries() {
    let nodes = this.props.triageEntries.map( (d) => {
      return (
        <div className={`callout ${style.triageEntryContiner}`} key={'te' + d.curation_id}>
          <h4 dangerouslySetInnerHTML={{ __html: d.basic.citation }} />
          <p dangerouslySetInnerHTML={{ __html: d.basic.abstract }} />
          {this.renderLinks(d)}
          <div className={style.triageControls}>
            <TriageControls entry={d} />
          </div>
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
  triageEntries: React.PropTypes.array,
  username: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    triageEntries: selectTriageEntries(state),
    username: state.auth.get('username')
  };
}

export { LitTriageIndex as LitTriageIndex };
export default connect(mapStateToProps)(LitTriageIndex);
