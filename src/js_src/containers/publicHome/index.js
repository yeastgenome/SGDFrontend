import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import t from 'tcomb-form';

import style from './style.css';
import FlexiForm from '../../components/forms/flexiForm';
import { authenticateUser } from '../../actions/authActions';

const DEFAULT_AUTH_LANDING = '/';

class Login extends Component {
  renderDBLogin() {
    let loginSchema = t.struct({
      username: t.String,
      password: t.String
    });
    let loginOptions = {
      fields: {
        password: {
          type: 'password'
        }
      }
    };
    let _onSuccess = (data) => {
      let nextUrl = this.props.queryParams.next || DEFAULT_AUTH_LANDING;
      this.props.dispatch(authenticateUser(data.username));
      this.props.dispatch(push(nextUrl));
    };
    return (
      <div className='columns small-6'>
        <h5>Option 1</h5>
        <p>Enter your database username and password.</p>
        <div style={{ margin: '0 auto', maxWidth: '20rem', textAlign: 'left' }}>
          <FlexiForm requestMethod='POST' tFormOptions={loginOptions} tFormSchema={loginSchema} onSuccess={_onSuccess} submitText='Login' updateUrl='/db_sign_in' />
        </div>
      </div>
    );
  }

  renderGLogin() {
    return (
      <div className='columns small-6'>
        <h5>Option 2</h5>
        <p>Sign into Google using your Stanford email address, or logout of other Google accounts.</p>
        <Link className={`${style.beginLoginButton} button`} to='/google_login'>Verify SUNet ID with Google</Link>
      </div>
    );
  }

  render() {
    return (
      <div className={`callout ${style.loginContainer}`}>
        <div className='row'>
          {this.renderDBLogin()}
          {this.renderGLogin()}
        </div>
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
