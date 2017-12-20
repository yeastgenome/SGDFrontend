import React, { Component } from 'react';
import { Link } from 'react-router';

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
  category: React.PropTypes.string,
  href: React.PropTypes.string,
};

export default ActionList;
