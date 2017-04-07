import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import style from './style.css';
import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';
import fetchData from '../../lib/fetchData';
import LoadingPage from '../../components/loadingPage';
// import AuthorResponseDrawer from './authorResponseDrawer';
import CategoryLabel from '../../components/categoryLabel';
// import TagList from '../../components/tagList';
import { selectActiveLitEntry, selectActiveLitId, selectCurrentSection } from '../../selectors/litSelectors';
import { updateActiveEntry } from '../../actions/litActions';
import { setNotReady, finishPending } from '../../actions/metaActions';

const BASE_CURATE_URL = '/curate/reference';
const SECTIONS = [
  'basic',
  'tags',
  'protein',
  'phenotypes',
  'go',
  'datasets',
  'regulation',
  'interaction',
];

class CurateLitLayout extends Component {
  componentDidMount() {
    this.props.dispatch(setNotReady());
    this.fetchData();
  }

  fetchData() {
    let id = this.props.params.id;
    let url = `/reference/${id}`;
    fetchData(url).then( (data) => {
      this.props.dispatch(updateActiveEntry(data));
      this.props.dispatch(finishPending());
    });
  }

  renderHeader() {
    let d = this.props.activeEntry;
    // <TagList entry={this.props.activeTagData} isReadOnly />
    return (
      <div>
        <h3><CategoryLabel category='reference' hideLabel /> {d.citation}</h3>
      </div>
    );
  }

  renderSectionsNav() {
    let baseUrl = `${BASE_CURATE_URL}/${this.props.activeId}`;
    let current = this.props.currentSection;
    return SECTIONS.map( (d) => {
      let relative;
      if (d === 'basic') {
        relative = '';
      } else {
        relative = `/${d}`;
      }
      let isActive = (current === relative);
      let url = `${baseUrl}${relative}`;
      let _className = isActive ? style.activeNavLink : style.navLink;
      return <li key={`lit${d}`}><Link className={_className} to={url}>{d}</Link></li>;
    });
  }

  render() {
    if (!this.props.isReady) return <LoadingPage />;
    return (
      <div>
        {this.renderHeader()}
        <div className='row'>
          <div className={SMALL_COL_CLASS}>
            <ul className='vertical menu'>
              {this.renderSectionsNav()}
            </ul>
          </div>
          <div className={LARGE_COL_CLASS}>
            <div>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CurateLitLayout.propTypes = {
  activeEntry: React.PropTypes.object,
  activeTagData: React.PropTypes.object,
  activeId: React.PropTypes.string,
  children: React.PropTypes.node,
  currentSection: React.PropTypes.string,
  dispatch: React.PropTypes.func,
  params: React.PropTypes.object,
  isReady: React.PropTypes.bool
};

function mapStateToProps(state) {
  return {
    activeEntry: selectActiveLitEntry(state),
    activeTagData: state.lit.get('activeTagData').toJS(),
    activeId: selectActiveLitId(state),
    currentSection: selectCurrentSection(state),
    isReady: state.meta.get('isReady')
  };
}

export { CurateLitLayout as CurateLitLayout };
export default connect(mapStateToProps)(CurateLitLayout);
