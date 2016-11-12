/* eslint-disable react/no-set-state */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../../actions/authActions';

const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';

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
    }
  }
  
  onSignIn (googleUser) {
    let sendAuthAction = AuthActions.sendAuthRequest(googleUser.getAuthResponse().id_token);
    this.setState({ isPending: true });
    this.props.dispatch(sendAuthAction);
  }

  _renderLoginButton () {
    return <div className='g-signin2' data-onsuccess={this.onSignIn.bind(this)} id='g-login' />;
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
  loginError: React.PropTypes.string
};

function mapStateToProps(_state) {
  return {
    loginError: _state.auth.loginError,
    isAuthenticating: _state.auth.isAuthenticating
  };
}

export default connect(mapStateToProps)(Login);
