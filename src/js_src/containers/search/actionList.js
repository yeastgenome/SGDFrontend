import React, { Component } from 'react';
import { Link } from 'react-router';

class ActionList extends Component {
  render() {
    if (this.props.category === 'locus' || this.props.category === 'reference') {
      let href = `annotate${this.props.href}`;
      return <Link to={href}><i className='fa fa-edit' /> Curate</Link>;
    }
    return null;
  }
}

ActionList.propTypes = {
  category: React.PropTypes.string,
  href: React.PropTypes.string,
};

export default ActionList;
