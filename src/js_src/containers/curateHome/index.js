import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';

class CurateHome extends Component {
  renderNumMaybe(num) {
    if (num === 0) return null;
    return <span className='label'>{num}</span>;
  }

  render() {
    return (
      <div className='row'>
        <div className={SMALL_COL_CLASS}>
          <ul className='vertical menu'>
            <li><Link to='literature'><i className='fa fa-book' />Literature {this.renderNumMaybe(this.props.numLit)}</Link></li>
            <li><Link><i className='fa fa-users' /> Colleague Updates {this.renderNumMaybe(this.props.numColleagues)}</Link></li>
            <li><Link><i className='fa fa-sticky-note' /> Gene Name Registrations {this.renderNumMaybe(this.props.numGeneReg)}</Link></li>
          </ul>
        </div>
        <div className={LARGE_COL_CLASS}>
          <h1>Curate Home</h1>
        </div>
      </div>
    );
  }
}

CurateHome.propTypes = {
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

export { CurateHome as CurateHome };
export default connect(mapStateToProps)(CurateHome);
