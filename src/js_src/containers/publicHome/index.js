import React, { Component } from 'react';
import { Link } from 'react-router';

import style from './style.css';

class Home extends Component {
  render() {
    return (
      <div className={`callout ${style.loginContainer}`}>
        <Link to='/login'>Click here to begin login.</Link>
      </div>
    );
  }
}

export default Home;
