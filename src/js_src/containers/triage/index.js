import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import { selectTriageEntries } from '../../selectors/litSelectors';
import CategoryLabel from '../../components/categoryLabel';
import { updateTriageEntries, clearActiveTags } from './triageActions';
import TagList from './tagList';
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

  renderMessage() {
    if (!this.props.isTagVisible) return null;
    let onClear = () => {
      this.props.dispatch(clearActiveTags());
    };
    return (
      <div className='callout success'>
        <div>
          <h3 className='text-right'><i className={`fa fa-close ${style.closeIcon}`} onClick={onClear} /></h3>
        </div>
        <h5><a><CategoryLabel category='reference' hideLabel /> {this.props.activeTagData.basic.citation}</a> added to database.</h5>
        <TagList entry={this.props.activeTagData} isReadOnly />
      </div>
    );
  }

  render() {
    return (
      <div>
        <h1>Literature Triage</h1>
        {this.renderMessage()}
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
  username: React.PropTypes.string,
  isTagVisible: React.PropTypes.bool,
  activeTagData: React.PropTypes.object
};

function mapStateToProps(state) {
  return {
    triageEntries: selectTriageEntries(state),
    username: state.auth.get('username'),
    activeTagData: state.lit.get('activeTagData').toJS(),
    isTagVisible: state.lit.get('isTagVisible')
  };
}

export { LitTriageIndex as LitTriageIndex };
export default connect(mapStateToProps)(LitTriageIndex);
