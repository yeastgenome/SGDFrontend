import React from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../actions/auth_actions';

const GOOGLE_PLATFORM_URL = 'https://apis.google.com/js/platform.js';

const Login = React.createClass({
  // hide google login button by default to prevent auto login
  getInitialState() {
    return {
      googleLoginVisible: true
    };
  },

  render() {
    return (
      <div>
        {this._renderLoginError()}
        <h1>Login</h1>
        <hr />
        {this._renderLoginButton()}
      </div>
    );
  },

  _renderLoginButton () {
    if (this.state.googleLoginVisible) {
      return <div id='g-login' className="g-signin2" data-onsuccess="onSignIn"></div>;
    }
    const _onClick = e => {
      e.preventDefault();
      this.setState({ googleLoginVisible: true });
    };
    return <a className='button' onClick={_onClick}>Login with Google</a>;
  },

  _renderLoginError () {
    if (!this.props.loginError) return null;
    return (
      <div className='alert callout'>
        <p>
          There was an error with your login.  Make sure that you are signed into Google with your Stanford email address.  You may have to logout of gmail, and login with your Stanford email.
        </p>
      </div>
    );
  },

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
  },

  // render google button if just toggled visible
  componentDidUpdate(prevProps, prevState) {
    if (this.state.googleLoginVisible) {
      gapi.signin2.render('g-login', {
        'onsuccess': this.onSignIn
      });
    }
  },

  onSignIn (googleUser) {
    let sendAuthAction = AuthActions.sendAuthRequest(googleUser.getAuthResponse().id_token);
    this.props.dispatch(sendAuthAction);
  }
});

function mapStateToProps(_state) {
  return {
    loginError: _state.auth.loginError
  };
}

export default connect(mapStateToProps)(Login);
