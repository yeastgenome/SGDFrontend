import React from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../actions/auth_actions';

const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';

const Login = React.createClass({
  render() {
    // expose onSignIn to global window so google API can find
    if (window) {
      window.onSignIn = this.onSignIn
    }

    return (
      <div>
        <h1>Login</h1>
        <hr />
        <script src="https://apis.google.com/js/platform.js" async defer />
        <div className="g-signin2" data-onsuccess="onSignIn"></div>
      </div>
    );
  },

  // append script tag to head to force render google login
  componentDidMount () {
    if (document) {
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
