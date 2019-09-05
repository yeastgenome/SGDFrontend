import React, { Component} from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import * as AuthActions from '../actions/auth_actions';
import style from './style.css';
import SearchBar from './searchBar';
import curateLogo from './curateLogo.png';
import Loader from './loader/index';
import { clearError, clearMessage } from '../../actions/metaActions';
import {Route,Switch} from 'react-router-dom';

//Curator Interfaces
import CurateHome from '../../containers/curateHome';
import { requireAuthentication } from '../../containers/authenticateComponent';
import TriageIndex from '../../containers/triage';
import ColleaguesIndex from '../../containers/colleagues/index';

import GeneNameReservationIndex from '../../containers/reserve/index';
import GeneNameReservation from '../../containers/reserve/show';
import GeneNameReservationEdit from '../../containers/reserve/edit';
import GeneNameReservationStandardize from '../../containers/reserve/standardize';
import ColleaguesShow from '../../containers/colleagues/show';
import SpreadsheetUpload from '../../containers/spreadsheetUpload/index';
import Settings from '../../containers/settings/index';
import NewsLetter from '../../containers/newsLetter/index';
import PostTranslationModification from '../../containers/postTraslationModificaition/index';
import Help from '../../containers/help';
import Search from '../../containers/search';
import PublicHome from '../../containers/publicHome';
import GoogleLogin from '../../containers/googleLogin';
import NewReference from '../../containers/newReference';
import CurateLit from '../../containers/curateLit/layout';
import Regulation from '../../containers/regulation/index';
import LocusLayout from '../../containers/locus/layout';
import FileCurate from '../../containers/fileCurate';
import FileCurateUpdate from '../../containers/fileCurate/updateFile.js';
import NotFound from '../../containers/curateHome/notFound';

class LayoutComponent extends Component {
  renderSearch () {
    if (this.props.isAuthenticated) {
      return (
        <div>
          <ul className={`menu ${style.authMenu}`}>
            <li><SearchBar /></li>
          </ul>
        </div>
      );
    }
    return null;
  }

  renderPublicMenu() {
    return (
      <ul className={`menu ${style.topMenu}`}>
        <li>
          <Link className={style.indexLink} to='/'>
            <img className={style.imgLogo} src={curateLogo} />
          </Link>
        </li>
        <li>
          <Link to='help'>
            <span><i className='fa fa-question-circle' /> Help</span>
          </Link>
        </li>
      </ul>
    );
  }

  renderAuthedMenu() {
    return (
      <ul className={`menu ${style.topMenu}`}>
        <li>
          <Link className={style.indexLink} to='/'>
            <img className={style.imgLogo} src={curateLogo} />
          </Link>
        </li>
        <li>
          <Link to='/'>
            <span><i className='fa fa-home' /> Curation Home</span>
          </Link>
        </li>
        <li>
          <Link to='help'>
            <span><i className='fa fa-question-circle' /> Help</span>
          </Link>
        </li>
        <li>
          <a className={style.navLink} href='/signout'><i className='fa fa-sign-out' /> Logout</a>
        </li>
      </ul>
    );
  }
  
  renderError() {
    if (!this.props.error) return null;
    let handleClick = () => {
      this.props.dispatch(clearError());
    };
    return (
      <div className={`alert callout ${style.errorContainer}`}>
        <h3 className={style.closeIcon} onClick={handleClick}><i className='fa fa-close' /></h3>
        <p>
          {this.props.error}
        </p>
      </div>
    );
  }

  renderMessage() {
    if (!this.props.message) return null;
    let handleClick = () => {
      this.props.dispatch(clearMessage());
    };
    return (
      <div className={`primary callout ${style.errorContainer}`}>
        <h3 className={style.closeIcon} onClick={handleClick}><i className='fa fa-close' /></h3>
        <p dangerouslySetInnerHTML={{ __html: this.props.message}} />
      </div>
    );
  }

  renderBody() {
    return this.props.children;
  }

  render() {
    // init auth nodes, either login or logout links
    let menuNode = this.props.isAuthenticated ? this.renderAuthedMenu() : this.renderPublicMenu();
    let devNoticeNode = null;
    if (process.env.DEMO_ENV === 'development') {
      devNoticeNode = <div className={`warning callout ${style.demoWarning}`}><i className='fa fa-exclamation-circle' /> Demo</div>;
    }
    return (
      <div>
        {this.renderMessage()}
        {this.renderError()}
        {devNoticeNode}
        <nav className={`top-bar ${style.navWrapper}`}>
          <div className='top-bar-left'>
            {menuNode}
          </div>
          <div className='top-bar-right'>
            {this.renderSearch()}
          </div>
        </nav>
        <div className={`row ${style.contentRow}`}>
          <Loader />
          <div className={`large-12 columns ${style.contentContainer}`}>
            {this.renderBody()}
          </div>
        </div>
        <Switch>
          <Route component={requireAuthentication(GeneNameReservationIndex)} path='/reservations' exact />
          <Route component={requireAuthentication(GeneNameReservation)} path='/reservations/:id' exact />
          <Route component={requireAuthentication(GeneNameReservationEdit)} path='/reservations/:id/edit' exact />
          <Route component={requireAuthentication(GeneNameReservationStandardize)} path='/reservations/:id/standardize' exact />
        </Switch>
        <Switch>
          <Route component={requireAuthentication(CurateHome)} path='/' exact />
          <Route component={requireAuthentication(TriageIndex)} path='/triage' />
          <Route component={requireAuthentication(ColleaguesIndex)} path='/colleagues/triage' exact />
          <Route component={requireAuthentication(ColleaguesShow)} path='/colleagues/triage/:id' />
          <Route component={requireAuthentication(SpreadsheetUpload)} path='/spreadsheet_upload' />
          <Route component={requireAuthentication(Settings)} path='/settings' />
          <Route component={requireAuthentication(NewsLetter)} path='/newsletter' />
          <Route component={requireAuthentication(PostTranslationModification)} path='/ptm' />
          <Route component={Help} path='/help' />
          <Route component={requireAuthentication(Search)} path='/search' />
          <Route component={PublicHome} path='/login' />
          <Route component={GoogleLogin} path='/google_login' />
          <Route component={requireAuthentication(NewReference)} path='/curate/reference/new' />
          <Route component={requireAuthentication(CurateLit)} path='/curate/reference/:id' />
          <Route component={requireAuthentication(Regulation)} path='/regulation' />
          <Route component={requireAuthentication(LocusLayout)} path='/curate/locus/:id' />
          <Route component={requireAuthentication(FileCurate)} path='/file_curate' />
          <Route component={requireAuthentication(FileCurateUpdate)} path='/file_curate_update' />
          <Route component={NotFound} path='*' />
        </Switch>
      </div>
    );
  }
}

LayoutComponent.propTypes = {
  children: PropTypes.node,
  error: PropTypes.string,
  message: PropTypes.string,
  dispatch: PropTypes.func,
  isAuthenticated: PropTypes.bool,
};

function mapStateToProps(state) {
  return {
    error: state.meta.get('error'),
    message: state.meta.get('message'),
    isAuthenticated: state.auth.get('isAuthenticated'),
  };
}

export { LayoutComponent as LayoutComponent };
export default connect(mapStateToProps)(LayoutComponent);
