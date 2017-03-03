import React, { Component } from 'react';
import { connect } from 'react-redux';

import fetchData from '../../lib/fetchData';
import { assignTriageEntry, removeEntry } from './triageActions';
import { setMessage } from '../../actions/metaActions';
import TagList from './tagList';

const TRIAGE_URL = '/reference/triage';
const PROMOTE_URL_SUFFIX = 'promote';

class TriageControls extends Component {
  getAssignee() {
    return this.props.entry.data.assignee;
  }

  updateEntry() {
    let entry = this.props.entry;
    let url = `${TRIAGE_URL}/${entry.curation_id}`;
    let fetchOptions = {
      type: 'PUT',
      data: JSON.stringify(entry),
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

  handlePromoteEntry(e) {
    e.preventDefault();
    let id = this.props.entry.curation_id;
    this.props.dispatch(removeEntry(id));
    let message = `${this.props.entry.basic.citation} added to database.`;
    this.props.dispatch(setMessage(message));
    let url = `${TRIAGE_URL}/${id}/${PROMOTE_URL_SUFFIX}`;
    let fetchOptions = {
      type: 'PUT',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions).then( () => {
      this.props.dispatch(removeEntry(id));
    });
  }

  renderOpenClaim() {
    let handleClaim = (e) => {
      e.preventDefault();
      let action = assignTriageEntry(this.props.entry.curation_id, this.props.username);
      this.props.dispatch(action);
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
      <div>
        <a className='button secondary small'>Get list of genes from abstract</a>
        <TagList id={this.props.entry.curation_id} />
      </div>
    );
  }

  render() {
    let aUser = this.getAssignee();
    if (!aUser) {
      return this.renderOpenClaim();
    } else if (aUser !== this.props.username) {
      return <p>Claimed by {aUser}</p>;
    }
    let handleUnclaim = (e) => {
      e.preventDefault();
      let action = assignTriageEntry(this.props.entry.curation_id, null);
      this.props.dispatch(action);
    };
    return (
      <div>
        <label>You have claimed this reference. <a onClick={handleUnclaim}>Unclaim</a></label>
        <div className='row'>
          <div className='column small-6'>
            {this.renderTags()}
          </div>
          <div className='column small-6 text-right'>
            <a className='button' onClick={this.handlePromoteEntry.bind(this)}><i className='fa fa-check' /> Add to Database</a>
            <a className='button secondary' onClick={this.handleDiscardEntry.bind(this)}><i className='fa fa-trash' /> Discard</a>
          </div>
        </div>
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
