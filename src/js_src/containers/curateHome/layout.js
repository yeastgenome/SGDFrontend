import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';

class CurateLayout extends Component {
  renderNumMaybe(num) {
    if (num === 0) return null;
    return <span className='label'>{num}</span>;
  }

  render() {
    return (
      <div className='row'>
        <div className={SMALL_COL_CLASS}>
          <ul className='vertical menu'>
            <li><Link to='curate'><i className='fa fa-home' /> Home</Link></li>
            <li><Link to='literature'><i className='fa fa-book' /> Literature {this.renderNumMaybe(this.props.numLit)}</Link></li>
            <li><Link><i className='fa fa-users' /> Colleague Updates {this.renderNumMaybe(this.props.numColleagues)}</Link></li>
            <li><Link><i className='fa fa-sticky-note' /> Gene Name Registrations {this.renderNumMaybe(this.props.numGeneReg)}</Link></li>
            <li><Link to='curate/spreadsheet_upload'><i className='fa fa-upload' /> Spreadsheet Upload</Link></li>
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
  numColleagues: React.PropTypes.number,
  numGeneReg: React.PropTypes.number,
  numLit: React.PropTypes.number
};

function mapStateToProps() {
  return {
    numColleagues: 0,
    numGeneReg: 3,
    numLit: 0
  };
}

export { CurateLayout as CurateLayout };
export default connect(mapStateToProps)(CurateLayout);
