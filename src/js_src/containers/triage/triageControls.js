import React, { Component } from 'react';
import { connect } from 'react-redux';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import { assignTriageEntry, promoteEntry, removeEntry } from './triageActions';
import { setMessage } from '../../actions/metaActions';
import TagList from './tagList';

const TRIAGE_URL = '/reference/triage';
const PROMOTE_URL_SUFFIX = 'promote';

class TriageControls extends Component {
  componentDidUpdate(prevProps) {
    // change is current user
    if (this.props.entry.data.assignee === this.props.username) {
      console.log(this.props.entry);
      if (this.props.entry !== prevProps.entry) this.updateEntry();
    }
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
      this.props.dispatch(promoteEntry(id));
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
      this.props.dispatch(promoteEntry(id));
    });
  }

  renderAssign() {
    let assignee = this.props.entry.data.assignee;
    let node;
    if (assignee) {
      node = (
        <div>
          <span>{assignee}</span>
        </div>
      ); 
    } else {
      let handleClaim = (e) => {
        e.preventDefault();
        let action = assignTriageEntry(this.props.entry.curation_id, this.props.username);
        this.props.dispatch(action);
      };
      node = (
        <div>
          <span>No Assignee <a onClick={handleClaim}>Claim</a></span>
        </div>
      );
    }
    return (
      <div>
        <label>Assignee</label>
        {node}
      </div>
    );
  }

  renderTags() {
    return (
      <Dropdown>
        <DropdownTrigger className='button small'>Tags <i className='fa fa-caret-down' /></DropdownTrigger>
        <DropdownContent className={`dropdownContent ${style.tagList}`}>
          <TagList id={this.props.entry.curation_id} />
        </DropdownContent>
      </Dropdown>
    );
  }

  render() {
    return (
      <div className='row'>
        {this.renderAssign()}
        <div className='column small-6'>
          {this.renderTags()}
        </div>
        <div className='column small-6 text-right'>
          <a className='button small' onClick={this.handlePromoteEntry.bind(this)}><i className='fa fa-check' /> Add to Database</a>
          <a className='button secondary small' onClick={this.handleDiscardEntry.bind(this)}><i className='fa fa-trash' /> Discard</a>
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
