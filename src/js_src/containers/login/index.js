/* eslint-disable react/no-set-state */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import fetchData from '../../lib/fetchData';
import { authenticateUser, setLoginError } from '../../actions/authActions';

const AUTH_URL = '/signin';
const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';

let _this;

class Login extends Component {
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
    fetchData(AUTH_URL, fetchOptions).then( () => {
      let nextUrl = this.props.queryParams.next || '/';
      this.props.dispatch(authenticateUser());
      this.props.dispatch(push(nextUrl));
    }).catch( () => {
      this.props.dispatch(setLoginError());
    });
  }
  
  onSignIn (googleUser) {
    _this.setState({ isPending: true });
    _this.fetchAuth(googleUser.getAuthResponse().id_token);
  }

  _renderLoginButton () {
    return <div className='g-signin2' data-onsuccess='onSignIn' id='g-login' />;
  }

  _renderLoginError () {
    if (!this.props.loginError) return null;
    return (
      <div className='alert callout'>
        <p>
          There was an error with your login.  Make sure that you are signed into Google with your Stanford email address.  You may have to logout of gmail, and login with your Stanford email.
        </p>
      </div>
    );
  }

  render () {
    return (
      <div>
        {this._renderLoginError()}
        <h1>Login</h1>
        <hr />
        {this._renderLoginButton()}
      </div>
    );
  }
}

Login.propTypes = {
  dispatch: React.PropTypes.func,
  loginError: React.PropTypes.bool,
  queryParams: React.PropTypes.object
};

function mapStateToProps(_state) {
  return {
    loginError: _state.auth.loginError,
    queryParams: _state.routing.locationBeforeTransitions.query
  };
}

export default connect(mapStateToProps)(Login);
