import React, { Component } from 'react';
import { connect } from 'react-redux';

// import fetchData from '../../lib/fetchData';
import { removeEntry } from './triageActions';

// const TRIAGE_URL = '/reference/triage';
// const PROMOTE_URL_SUFFIX = 'promote';

class TriageControls extends Component {
  handleDiscardEntry(e) {
    e.preventDefault();
    let id = this.props.id;
    this.props.dispatch(removeEntry(id));
    // let url = `${TRIAGE_URL}/${id}`;
    // let fetchOptions = {
    //   type: 'DELETE',
    //   headers: {
    //     'X-CSRF-Token': window.CSRF_TOKEN,        
    //   }
    // };
    // fetchData(url, fetchOptions).then( () => {
    //   this.props.dispatch(promoteEntry(id));
    // });
  }

  handlePromoteEntry(e) {
    e.preventDefault();
    let id = this.props.id;
    this.props.dispatch(removeEntry(id));
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

  render() {
    return (
      <div>
        <a className='button secondary small' onClick={this.handleDiscardEntry.bind(this)}><i className='fa fa-trash' /> Discard</a>
        <a className='button small' onClick={this.handlePromoteEntry.bind(this)}><i className='fa fa-check' /> Add to Database</a>
      </div>
    );
  }
}

TriageControls.propTypes = {
  dispatch: React.PropTypes.func,
  id: React.PropTypes.number
};

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(TriageControls);
