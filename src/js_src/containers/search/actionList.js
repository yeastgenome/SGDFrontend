import React, { Component } from 'react';
import { Link } from 'react-router';

import style from './style.css';

class ActionList extends Component {
  render() {
    let href = this.props.href;
    let publicUrl = `http://yeastgenome.org${href}`;
    return (
      <ul className={`menu simple ${style.actionMenu}`}>
        <li>
          <Link to={href}><i className='fa fa-edit' /> Curate</Link>
        </li>
        <li>
          <a href={publicUrl} target='_new'><i className='fa fa-globe' /> View on SGD</a>
        </li>
        <li>
          <a href='#'><i className='fa fa-cart-plus' /> Add to Batch</a>
        </li>
      </ul>
    );
  }
}

ActionList.propTypes = {
  href: React.PropTypes.string,
  id: React.PropTypes.string
};

export default ActionList;
