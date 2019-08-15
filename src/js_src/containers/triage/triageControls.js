/*eslint-disable no-unreachable */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import style from './style.css';
import fetchData from '../../lib/fetchData';
import { updateTriageEntry, updateLastPromoted, removeEntry } from './triageActions';
import { setMessage, setError, clearError } from '../../actions/metaActions';
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
    fetchData(url, fetchOptions).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an updating entry.';
      this.props.dispatch(setError(errorMessage));
      this.setState({ isPending: false });
    });
  }

  handleDiscardEntry(e) {
    e.preventDefault();
    let id = this.props.entry.curation_id;
    let message = `${this.props.entry.basic.citation} discarded.`;
    let url = `${TRIAGE_URL}/${id}`;
    let fetchOptions = {
      type: 'DELETE',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions).then( () => {
      this.props.dispatch(removeEntry(id));
      this.props.dispatch(setMessage(message));
    }).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an error deleting the reference.';
      this.props.dispatch(setError(errorMessage));
      this.setState({ isPending: false });
    });
  }

  handlePromoteEntry(e) {
    e.preventDefault();
    let entry = this.props.entry;
    // promotion request
    this.setState({ isPending: true });
    let id = this.props.entry.curation_id;
    let url = `${TRIAGE_URL}/${id}/${PROMOTE_URL_SUFFIX}`;
    entry.tags = entry.tags || [];
    let fetchOptions = {
      type: 'PUT',
      data: JSON.stringify(entry),
      timeout: 60000,
      contentType: 'application/json',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
      }
    };
    fetchData(url, fetchOptions).then( (data) => {
      this.props.dispatch(removeEntry(id));
      this.props.dispatch(updateLastPromoted(data));
      this.props.dispatch(clearError());
      // scroll to top of page
      window.scrollTo(0, 0);
    }).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an error adding the reference.';
      this.props.dispatch(setError(errorMessage));
      this.setState({ isPending: false });
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
    let handleTagUpdate = (newTags) => {
      let newEntry = this.props.entry;
      newEntry.tags = newTags;
      this.saveUpdatedEntry(newEntry, true);
    };
    return (
      <div ref='tagList'>
        <TagList tags={this.props.entry.tags} onUpdate={handleTagUpdate.bind(this)} isTriage />
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
        {this.renderTags()}
        <div className='row'>
          <div className={`columns small-6 ${style.triageControls}`}>
            <p>You have claimed this reference. <a onClick={handleUnclaim}>Unclaim</a></p>
          </div>
          <div className={`${style.dbControls}`}>
            <a className='button' onClick={this.handlePromoteEntry.bind(this)}><i className='fa fa-check' /> Add to Database</a>
            <a className='button secondary' onClick={this.handleDiscardEntry.bind(this)}><i className='fa fa-trash' /> Discard</a>
          </div>
        </div>
      </div>
    );
  }
}

TriageControls.propTypes = {
  entry: PropTypes.object,
  dispatch: PropTypes.func,
  username: PropTypes.string
};

function mapStateToProps(state) {
  return {
    username: state.auth.get('username')
  };
}

export default connect(mapStateToProps)(TriageControls);
