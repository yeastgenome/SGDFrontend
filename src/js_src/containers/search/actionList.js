import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
class ActionList extends Component {
  render() {
    let action_categories = ['locus', 'reference', 'reserved_name', 'download'];
    if(action_categories.includes(this.props.category)){
      if(this.props.category == 'download'){
        let dname = this.props.display_name ? this.props.display_name : '';
        return(
        <Link
          style={{ display: 'inline-block', minWidth: '6rem' }}
          to={{pathname:'file_curate_update', search:`?name=${dname.replace(/<[^>]*>?/gm, '')}`}}
        >
          <i className='fa fa-edit' /> Curate
        </Link>);
      }
      else{
        let href = `curate${this.props.href}`;
        return <Link style={{ display: 'inline-block', minWidth: '6rem' }} to={href}><i className='fa fa-edit' /> Curate</Link>;
      }

    }
    return null;
  }
}

ActionList.propTypes = {
  category: PropTypes.string,
  href: PropTypes.string,
  display_name: PropTypes.string
};

export default ActionList;
