import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';
import { clearError, setError } from '../../actions/metaActions';
import CurateLayout from '../curateHome/layout';

const REFRESH_URL = '/refresh_homepage_cache';
const UPLOAD_TIMEOUT = 10000;

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false,
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    this.uploadData();
  }

  uploadData() {
    this.setState({ isPending: true });
    fetchData(REFRESH_URL, {
      type: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': this.props.csrfToken
      },
      timeout: UPLOAD_TIMEOUT,
    }).then( () => {
      this.setState({
        isPending: false,
      });
      this.props.dispatch(clearError());
    }).catch( (data) => {
      let errorMessage = data ? data.error : 'There was an error clearing cache. Please try again.';
      this.props.dispatch(setError(errorMessage));
      this.setState({ isPending: false });
    });
  }

  renderForm() {
    return (
      <form ref='form' onSubmit={this.handleSubmit.bind(this)}>
        <input className='button' type='submit' value='Clear homepage cache' />
      </form>
    );
  }

  render() {
    let state = this.state;
    let node;
    if (state.isPending) {
      node = <Loader />;
    }else {
      node = this.renderForm();
    }
    return (
      <CurateLayout>
        <div>
          <h2>Settings</h2>
          <hr />
          <div>
            <p>Click to clear the cache on the homepage so new blog posts and events will be visible.  It will automatically clear after 24 hours.</p>
            {node}
          </div>
          <hr />
        </div>
      </CurateLayout>
    );
  }
}

Settings.propTypes = {
  csrfToken: PropTypes.string,
  dispatch: PropTypes.func
};

function mapStateToProps(state) {
  return {
    csrfToken: state.auth.csrfToken
  };
}

export { Settings as Settings };
export default connect(mapStateToProps)(Settings);
