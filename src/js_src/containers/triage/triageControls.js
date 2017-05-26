import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'underscore';

import fetchData from '../../lib/fetchData';
import { updateTriageEntry, updateActiveTags, removeEntry } from './triageActions';
import { setMessage, setError } from '../../actions/metaActions';
import TagList from '../../components/tagList';
import Loader from '../../components/loader';

const TRIAGE_URL = '/reference/triage';
const PROMOTE_URL_SUFFIX = 'promote';

class TriageControls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false
    };
  }

  getAssignee() {
    return this.props.entry.data.assignee;
  }

  saveUpdatedEntry(updatedEntry, ignoreServerUpdate=false) {
    this.props.dispatch(updateTriageEntry(updatedEntry));
    if (ignoreServerUpdate) return;
    let url = `${TRIAGE_URL}/${updatedEntry.curation_id}`;
    let fetchOptions = {
      type: 'PUT',
      data: JSON.stringify(updatedEntry),
      contentType: 'application/json',
      processData: false,
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions);
  }

  handleDiscardEntry(e) {
    e.preventDefault();
    let id = this.props.entry.curation_id;
    this.props.dispatch(removeEntry(id));
    let message = `${this.props.entry.basic.citation} discarded.`;
    this.props.dispatch(setMessage(message));
    let url = `${TRIAGE_URL}/${id}`;
    let fetchOptions = {
      type: 'DELETE',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions).then( () => {
      this.props.dispatch(removeEntry(id));
    });
  }

  getDataFromTagInputs(tagClassName) {
    let geneListEls = this.refs.tagList.getElementsByClassName(tagClassName);
    let tagData = [];
    for (var i = geneListEls.length - 1; i >= 0; i--) {
      let el = geneListEls[i];
      let geneTagType = el.dataset.type;
      let simpleValue = el.value || '';
      tagData.push({
        value: simpleValue,
        type: geneTagType
      });
    }
    return tagData;
  }

  handlePromoteEntry(e) {
    e.preventDefault();
    // generate tag data from DOM
    let tagGeneData = this.getDataFromTagInputs('sgd-geneList');
    let tagCommentData = this.getDataFromTagInputs('sgd-comment');
    let tempEntry = this.props.entry;
    let tags = tempEntry.data.tags || [];
    tags.forEach( (d) => {
      let thisGenes = _.findWhere(tagGeneData, { type: d.name });
      if (thisGenes) d.genes = thisGenes.value;
      let thisComments = _.findWhere(tagCommentData, { type: d.name });
      if (thisComments) d.comment = thisComments.value;
    });
    tempEntry.data.tags = tags;
    // promotion request
    this.setState({ isPending: true });
    let id = this.props.entry.curation_id;
    let url = `${TRIAGE_URL}/${id}/${PROMOTE_URL_SUFFIX}`;
    let fetchOptions = {
      type: 'PUT',
      data: JSON.stringify(tempEntry),
      timeout: 20000,
      contentType: 'application/json',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions).then( (data) => {
      tempEntry.sgdid = data.sgdid;
      this.props.dispatch(removeEntry(id));
      this.props.dispatch(updateActiveTags(tempEntry));
      // scroll to top of page
      window.scrollTo(0, 0);
    }).catch( () => {
      this.props.dispatch(setError('There was an error adding the reference.'));
      this.setState({ isPending: false });
      // scroll to top of page
      window.scrollTo(0, 0);
    });
  }

  renderOpenClaim() {
    let handleClaim = (e) => {
      e.preventDefault();
      let updatedEntry = this.props.entry;
      updatedEntry.data.assignee = this.props.username;
      this.saveUpdatedEntry(updatedEntry);
    };
    return (
      <div>
        <label>Unclaimed</label>
        <a className='button' onClick={handleClaim}>Claim</a>
      </div>
    );
  }

  renderTags() {
    return (
      <div ref='tagList'>
        <TagList entry={this.props.entry} onUpdate={this.saveUpdatedEntry.bind(this)} />
      </div>
    );
  }

  render() {
    if (this.state.isPending) return <Loader />;
    let aUser = this.getAssignee();
    if (!aUser) {
      return this.renderOpenClaim();
    } else if (aUser !== this.props.username) {
      return <p>Claimed by {aUser}</p>;
    }
    let handleUnclaim = (e) => {
      e.preventDefault();
      let updatedEntry = this.props.entry;
      updatedEntry.data.assignee = null;
      this.saveUpdatedEntry(updatedEntry);
    };
    return (
      <div>
        <div className='row'>
          <div className='columns small-6'>
            <p>You have claimed this reference. <a onClick={handleUnclaim}>Unclaim</a></p>
          </div>
          <div className='columns small-6 text-right'>
            <a className='button' onClick={this.handlePromoteEntry.bind(this)}><i className='fa fa-check' /> Add to Database</a>
            <a className='button secondary' onClick={this.handleDiscardEntry.bind(this)}><i className='fa fa-trash' /> Discard</a>
          </div>
        </div>
        {this.renderTags()}
      </div>
    );
  }
}

TriageControls.propTypes = {
  entry: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  username: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    username: state.auth.get('username')
  };
}

export default connect(mapStateToProps)(TriageControls);
