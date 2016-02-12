import React from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../actions/auth_actions';

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
        <div className="g-signin2" data-onsuccess="onSignIn"></div>
      </div>
    );
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
