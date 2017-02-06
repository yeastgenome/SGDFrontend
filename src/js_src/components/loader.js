import React, { Component } from 'react';

import style from './style.css';

class Loader extends Component {
  render() {
    return <div className={style.sgdLoaderContainer}><div className={style.sgdLoader} /></div>;
  }
}

export default Loader;
