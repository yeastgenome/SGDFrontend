import React, { Component } from 'react';
import { Link } from 'react-router';

import style from './style.css';

class Home extends Component {
  render() {
    return (
      <div className={`callout ${style.loginContainer}`}>
        <p>Sign into Google using your Stanford email address, or logout of other Google accounts.</p>
        <Link className={`${style.beginLoginButton} button`} to='/login'>Login</Link>
      </div>
    );
  }
}

export default Home;
