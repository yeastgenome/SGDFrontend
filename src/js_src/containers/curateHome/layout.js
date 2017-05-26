import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import style from './style.css';
import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';

class CurateLayout extends Component {
  render() {
    let location = this.props.location ? this.props.location.pathname : '';
    return (
      <div className='row'>
        <div className={SMALL_COL_CLASS}>
          <ul className='vertical menu'>
            <li><Link className={(location === '/curate') ? style.activeLink : null} to='curate'><i className='fa fa-home' /> Home</Link></li>
            <li><Link className={(location === '/curate/triage') ? style.activeLink : null} to='curate/triage'><i className='fa fa-book' /> Lit Triage</Link></li>
            <li><Link className={style.disabledLink}><i className='fa fa-users' /> Colleague Updates</Link></li>
            <li><Link className={style.disabledLink}><i className='fa fa-sticky-note' /> Gene Name Registrations</Link></li>
            <li><Link className={(location === '/curate/spreadsheet_upload') ? style.activeLink : null} to='curate/spreadsheet_upload'><i className='fa fa-upload' /> Spreadsheet Upload</Link></li>
          </ul>
        </div>
        <div className={LARGE_COL_CLASS}>
          <div>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

CurateLayout.propTypes = {
  children: React.PropTypes.object,
  location: React.PropTypes.object,
  numColleagues: React.PropTypes.number,
  numGeneReg: React.PropTypes.number,
  numLit: React.PropTypes.number
};

function mapStateToProps() {
  return {
  };
}

export { CurateLayout as CurateLayout };
export default connect(mapStateToProps)(CurateLayout);
