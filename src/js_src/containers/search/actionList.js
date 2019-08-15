import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
class ActionList extends Component {
  render() {
    if (this.props.category === 'locus' || this.props.category === 'reference' || this.props.category === 'reserved_name') {
      let href = `curate${this.props.href}`;
      return <Link style={{ display: 'inline-block', minWidth: '6rem' }} to={href}><i className='fa fa-edit' /> Curate</Link>;
    }
    return null;
  }
}

ActionList.propTypes = {
  category: PropTypes.string,
  href: PropTypes.string,
};

export default ActionList;
