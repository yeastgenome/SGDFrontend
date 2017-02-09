import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import style from './style.css';
import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';
import AuthorResponseDrawer from './authorResponseDrawer';
import { selectActiveLitEntry, selectActiveLitId, selectCurrentSection } from '../../selectors/litSelectors';
import LitStatus from '../triageLit/litStatus';

const BASE_CURATE_URL = '/annotate/reference';
const SECTIONS = [
  'basic',
  'loci',
  'protein',
  'phenotypes',
  'go',
  'datasets',
  'regulation',
  'interaction',
  'actions'
];

class CurateLitLayout extends Component {
  renderHeader() {
    let d = this.props.activeEntry;
    return (
      <div>
        <h3>{d.citation}</h3>
        <AuthorResponseDrawer />
        <LitStatus />
      </div>
    );
  }

  renderSectionsNav() {
    let baseUrl = `${BASE_CURATE_URL}/${this.props.activeId}`;
    let current = this.props.currentSection;
    return SECTIONS.map( (d) => {
      let relative = d;
      if (relative === 'basic') relative = '';
      let isActive = (current === relative);
      let url = `${baseUrl}/${relative}`;
      let _className = isActive ? style.activeNavLink : style.navLink;
      return <li key={`lit${d}`}><Link className={_className} to={url}>{d}</Link></li>;
    });
  }

  render() {
    return (
      <div className='row'>
        <div className={SMALL_COL_CLASS}>
          <ul className='vertical menu'>
            {this.renderSectionsNav()}
          </ul>
        </div>
        <div className={LARGE_COL_CLASS}>
          {this.renderHeader()}
          <div>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

CurateLitLayout.propTypes = {
  activeEntry: React.PropTypes.object,
  activeId: React.PropTypes.string,
  children: React.PropTypes.node,
  currentSection: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    activeEntry: selectActiveLitEntry(state),
    activeId: selectActiveLitId(state),
    currentSection: selectCurrentSection(state)
  };
}

export { CurateLitLayout as CurateLitLayout };
export default connect(mapStateToProps)(CurateLitLayout);
