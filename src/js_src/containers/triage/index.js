import React, { Component } from 'react';
import { connect } from 'react-redux';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import getPusherClient from '../../lib/getPusherClient';
import { selectTriageEntries } from '../../selectors/litSelectors';
import CategoryLabel from '../../components/categoryLabel';
import LitBasicInfo from '../../components/litBasicInfo';
import { updateTriageEntries, clearActiveTags } from './triageActions';
import { setPending, finishPending } from '../../actions/metaActions';
import TagList from '../../components/tagList';
import TriageControls from './triageControls';

// const REF_BASE_URL = '/curate/reference';
const TRIAGE_URL = '/reference/triage';
const CHANNEL = 'sgd';
const EVENT = 'triageUpdate';

const PREVIEW_BASE_URL = 'https://curate.qa.yeastgenome.org';

class LitTriageIndex extends Component {
  componentDidMount() {
    this.props.dispatch(setPending());
    this.fetchData();
    this.listenForUpdates();
  }

  componentWillUnmount() {
    this.channel.unbind(EVENT);
  }

  listenForUpdates() {
    let pusher = getPusherClient();
    this.channel = pusher.subscribe(CHANNEL);
    this.channel.bind(EVENT, () => {
      this.fetchData();
    });
  }

  fetchData() {
    fetchData(TRIAGE_URL).then( (data) => {
      this.props.dispatch(updateTriageEntries(data.entries, this.props.username));
      this.props.dispatch(finishPending());
    });
  }

  renderBasicRef(d) {
    return (
      <LitBasicInfo
        abstract={d.basic.abstract}
        citation={d.basic.citation}
        fulltextUrl={d.basic.fulltext_url}
        geneList={d.basic.abstract_genes}
        pmid={d.basic.pmid.toString()}
      />
    );
  }

  renderEntries() {
    let nodes = this.props.triageEntries.map( (d) => {
      return (
        <div className={`callout ${style.triageEntryContiner}`} key={'te' + d.curation_id}>
          {this.renderBasicRef(d)}
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
    let d = this.props.activeTagData;
    return (
      <div className='callout success'>
        <div>
          <h3 className='text-right'><i className={`fa fa-close ${style.closeIcon}`} onClick={onClear} /></h3>
        </div>
        <h5><a href={`${PREVIEW_BASE_URL}/reference/${d.sgdid}`} target='_new'><CategoryLabel category='reference' hideLabel /> {d.basic.citation}</a> added to database.</h5>
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
