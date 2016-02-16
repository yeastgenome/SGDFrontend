import React from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../actions/auth_actions';

const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';

const Login = React.createClass({
  render() {
    return (
      <div>
        <h1>Login</h1>
        <hr />
        <div className="g-signin2" data-onsuccess="onSignIn"></div>
      </div>
    );
  },

  // google login setup, adjusted for react
  componentDidMount () {
    if (document) {
      // expose onSignIn to global window so google API can find
      if (window) window.onSignIn = this.onSignIn
      // manually add google sign in script
      let scriptTag = document.createElement('script');
      scriptTag.type = 'text/javascript';
      scriptTag.src = GOOGLE_PLATFORM_URL;
      document.head.appendChild(scriptTag);
    }
  },

  onSignIn (googleUser) {
    let sendAuthAction = AuthActions.sendAuthRequest(googleUser.getAuthResponse().id_token);
    this.props.dispatch(sendAuthAction);
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(Login);
