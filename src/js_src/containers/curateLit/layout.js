import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import style from './style.css';
import { SMALL_COL_CLASS, LARGE_COL_CLASS } from '../../constants';
import fetchData from '../../lib/fetchData';
import LoadingPage from '../../components/loadingPage';
// import AuthorResponseDrawer from './authorResponseDrawer';
import CategoryLabel from '../../components/categoryLabel';
import updateTitle from '../../lib/updateTitle';
import { selectActiveLitEntry } from '../../selectors/litSelectors';
import { updateActiveEntry } from './litActions';
import { setNotReady, finishPending } from '../../actions/metaActions';
import { PREVIEW_URL } from '../../constants.js';

const BASE_CURATE_URL = '/curate/reference';
const SECTIONS = [
  'tags',
];

class CurateLitLayout extends Component {
  componentDidMount() {
    this.props.dispatch(setNotReady());
    this.fetchData();
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  fetchData() {
    let id = this.props.params.id;
    let url = `/reference/${id}`;
    fetchData(url).then( (data) => {
      if (this._isMounted) {
        updateTitle(data.citation);
        this.props.dispatch(updateActiveEntry(data));
        this.props.dispatch(finishPending());
      }
    });
  }

  renderHeader() {
    let d = this.props.activeEntry;
    let previewUrl = `${PREVIEW_URL}/reference/${this.props.params.id}`;
    return (
      <div>
        <h3 style={{ display: 'inline-block', marginRight: '0.5rem' }}><CategoryLabel category='reference' hideLabel isPageTitle /> {d.citation}</h3>
        <span style={{ display: 'inline-block' }}><a href={previewUrl} target='_nwe'><i className='fa fa-file-image-o' aria-hidden='true'></i> preview</a></span>
        <hr style={{ margin: '1rem 0' }} />
      </div>
    );
  }

  renderSectionsNav() {
    let baseUrl = `${BASE_CURATE_URL}/${this.props.params.id}`;
    let current = this.props.pathname.replace(baseUrl, '');
    return SECTIONS.map( (d) => {
      let relative;
      if (d === 'tags') {
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
  children: React.PropTypes.node,
  dispatch: React.PropTypes.func,
  params: React.PropTypes.object,
  pathname: React.PropTypes.string,
  isReady: React.PropTypes.bool
};

function mapStateToProps(state) {
  return {
    activeEntry: selectActiveLitEntry(state),
    pathname: state.routing.locationBeforeTransitions.pathname,
    isReady: state.meta.get('isReady')
  };
}

export { CurateLitLayout as CurateLitLayout };
export default connect(mapStateToProps)(CurateLitLayout);
