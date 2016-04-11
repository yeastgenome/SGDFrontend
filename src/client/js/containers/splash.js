import React from 'react';
import { Link } from 'react-router';

const SplashContainer = React.createClass({
  render() {
    return (
      <div>
        <h1>SGD Curator</h1>
        <hr />
        <Link to='/login' className='button'>Login</Link>
      </div>
    );
  }
});

export default SplashContainer;
