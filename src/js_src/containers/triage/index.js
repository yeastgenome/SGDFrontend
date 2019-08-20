import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import style from './style.css';
import AnnotationSummary from '../../components/annotationSummary';
import fetchData from '../../lib/fetchData';
import getPusherClient from '../../lib/getPusherClient';
import { selectTriageEntries } from '../../selectors/litSelectors';
import LitBasicInfo from '../../components/litBasicInfo';
import { updateTriageEntries, clearLastPromoted } from './triageActions';
import { setPending, finishPending } from '../../actions/metaActions';
import TriageControls from './triageControls';
import CurateLayout from '../curateHome/layout';

// const REF_BASE_URL = '/curate/reference';
const TRIAGE_URL = '/reference_triage';
const CHANNEL = 'sgd';
const EVENT = 'triageUpdate';
const MAX_TRIAGE_NODES = 100;

// const PREVIEW_BASE_URL = 'https://preview.qa.yeastgenome.org';

class LitTriageIndex extends Component {
  componentDidMount() {
    this.props.dispatch(setPending());
    this.fetchData();
    this.listenForUpdates();
    this._isMounted = true;
  }

  componentWillUnmount() {
    this.channel.unbind(EVENT);
    this._isMounted = false;
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
      if (this._isMounted) {
        this.props.dispatch(updateTriageEntries(data.entries, this.props.username, data.total));
        this.props.dispatch(finishPending());
      }
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
    let all = this.props.triageEntries;
    let triageEntries = all.slice(0, MAX_TRIAGE_NODES);
    let topMsgNode = (triageEntries.length) ? <p>{this.props.triageTotal.toLocaleString()} triage entries</p> : null;
    let msgNode = (triageEntries.length) ? <p>Showing {MAX_TRIAGE_NODES} of {this.props.triageTotal.toLocaleString()}. To show more, remove some items from above.</p> : null;
    let nodes = triageEntries.map( (d) => {
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
        {topMsgNode}
        {nodes}
        {msgNode}
      </div>
    );
  }

  renderMessage() {
    let d = this.props.lastPromoted;
    if (!d) return null;
    let onClear = () => {
      this.props.dispatch(clearLastPromoted());
    };
    return (
      <div className='callout success'>
        <div>
          <h3 className='text-right'><i className={`fa fa-close ${style.closeIcon}`} onClick={onClear} /></h3>
        </div>
        <AnnotationSummary annotations={[d]} hideMessage />
      </div>
    );
  }

  render() {
    return (
      <CurateLayout>
        <div>
          <div className={style.litTableContainer}>
            {this.renderMessage()}
            <Link to='curate/reference/new'>Add Reference by PMID</Link>
            {this.renderEntries()}
          </div>
        </div>
      </CurateLayout>
    );
  }
}

LitTriageIndex.propTypes = {
  dispatch: PropTypes.func,
  triageEntries: PropTypes.array,
  triageTotal: PropTypes.number,
  username: PropTypes.string,
  isTagVisible: PropTypes.bool,
  lastPromoted: PropTypes.object
};

function mapStateToProps(state) {
  let _lastPromoted =  state.lit.get('lastPromoted') ? state.lit.get('lastPromoted').toJS() : null;
  return {
    triageEntries: selectTriageEntries(state),
    triageTotal: state.lit.get('triageTotal'),
    username: state.auth.get('username'),
    lastPromoted: _lastPromoted,
    isTagVisible: state.lit.get('isTagVisible')
  };
}

export { LitTriageIndex as LitTriageIndex };
export default connect(mapStateToProps)(LitTriageIndex);
