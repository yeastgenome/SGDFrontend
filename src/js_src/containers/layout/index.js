import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

// import * as AuthActions from '../actions/auth_actions';
import style from './style.css';
import SearchBar from './searchBar';
import curateLogo from './curateLogo.png';
import Loader from './loader/index';
import LoadingPage from '../../components/loadingPage';
import { clearError, clearMessage } from '../../actions/metaActions';

class LayoutComponent extends Component {
  renderAuthedMenu() {
    return (
      <div>
        <ul className={`menu ${style.authMenu}`}>
          <li><a className={style.navLink} href='/'>
            <i className='fa fa-sign-out' /> Logout</a>
          </li>
          <li><SearchBar /></li>
        </ul>
      </div>
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
    if (!this.props.isReady) return <LoadingPage />;
    return this.props.children;
  }

  render() {
    // init auth nodes, either login or logout links
    let authNodes = this.props.isAuthenticated ? this.renderAuthedMenu() : null;
    return (
      <div>
        {this.renderMessage()}
        {this.renderError()}
        <div className='row'>
          <div className='columns small-12'>
            <Link className={style.indexLink} to='curate'>
              <img className={style.imgLogo} src={curateLogo} /><i>Saccharomyces</i> Genome Database <span className='label'>Curator</span>
            </Link>
          </div>
        </div>
        <nav className={`top-bar ${style.navWrapper}`}>
          <div className='top-bar-left'>
            <ul className={`menu ${style.topMenu}`}>
              <li>
                <Link to='curate'>
                  <span><i className='fa fa-home' /> Home</span>
                </Link>
              </li>
              <li>
                <Link to='help'>
                  <span><i className='fa fa-question-circle' /> Help</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className='top-bar-right'>
            {authNodes}
          </div>
        </nav>
        <div className={`row ${style.contentRow}`}>
          <Loader />
          <div className={`large-12 columns ${style.contentContainer}`}>
            {this.renderBody()}
          </div>
        </div>
      </div>
    );
  }
}

LayoutComponent.propTypes = {
  children: PropTypes.node,
  error: React.PropTypes.string,
  message: React.PropTypes.string,
  dispatch: React.PropTypes.func,
  isAuthenticated: React.PropTypes.bool,
  isReady: React.PropTypes.bool,
};

function mapStateToProps(state) {
  return {
    error: state.meta.get('error'),
    message: state.meta.get('message'),
    isAuthenticated: state.auth.get('isAuthenticated'),
    isReady: state.meta.get('isReady')
  };
}

export { LayoutComponent as LayoutComponent };
export default connect(mapStateToProps)(LayoutComponent);
