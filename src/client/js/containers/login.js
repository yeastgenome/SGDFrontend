import React from 'react';
import { connect } from 'react-redux';
import * as AuthActions from '../actions/auth_actions';

const Login = React.createClass({
  render() {
    let _onClick = e => {
      e.preventDefault()
      this.props.dispatch(AuthActions.authenticateUser());
    };

    return (
      <div>
        <h1>Login</h1>
        <a className='btn btn-default' onClick={_onClick}>Login</a>
      </div>
    );
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(Login);
