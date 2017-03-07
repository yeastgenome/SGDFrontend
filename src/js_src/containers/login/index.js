/* eslint-disable react/no-set-state */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import style from '../publicHome/style.css';
import fetchData from '../../lib/fetchData';
import Loader from '../../components/loader';
import { authenticateUser } from '../../actions/authActions';
import { setError } from '../../actions/metaActions';

const AUTH_URL = '/signin';
const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';
const DEFAULT_AUTH_LANDING = '/curate';

let _this;

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: false
    };
  }
  
  // google login setup, adjusted for react
  componentDidMount () {
    if (document) {
      // expose onSignIn to global window so google API can find
      if (window) window.onSignIn = this.onSignIn;
      // manually add google sign in script
      let scriptTag = document.createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.src = GOOGLE_PLATFORM_URL;
      document.head.appendChild(scriptTag);
      // hack to let onSignIn work
      _this = this;
    }
  }

  fetchAuth(googleToken) {
    let params = JSON.stringify({ google_token: googleToken });
    let fetchOptions = {
      type: 'POST',
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN,        
        'Content-Type': 'application/json'
      },
      data: params
    };
    fetchData(AUTH_URL, fetchOptions).then( (data) => {
      this.setState({ isPending: false });
      let nextUrl = this.props.queryParams.next || DEFAULT_AUTH_LANDING;
      this.props.dispatch(authenticateUser(data.username));
      this.props.dispatch(push(nextUrl));
    }).catch( () => {
      this.setState({ isPending: false });
      this.props.dispatch(setError('There was an error with your login. Make sure that you are logged into Google with your Stanford email address. You may need to refresh the page.'));
    });
  }
  
  onSignIn (googleUser) {
    _this.setState({ isPending: true });
    _this.fetchAuth(googleUser.getAuthResponse().id_token);
  }

  _renderLoginButton () {
    if (this.state.isPending) {
      return <Loader />;
    }
    return <div className='g-signin2' data-onsuccess='onSignIn' data-theme='dark' id='g-login' />;
  }

  render () {
    return (
      <div className={`callout ${style.loginContainer}`}>
        <p>You must login to Google with your Stanford email address. You may need to refresh after changing accounts.</p>
        {this._renderLoginButton()}
      </div>
    );
  }
}

Login.propTypes = {
  dispatch: React.PropTypes.func,
  queryParams: React.PropTypes.object
};

function mapStateToProps(_state) {
  return {
    queryParams: _state.routing.locationBeforeTransitions.query
  };
}

export default connect(mapStateToProps)(Login);
