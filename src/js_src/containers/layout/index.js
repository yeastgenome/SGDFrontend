import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

// import * as AuthActions from '../actions/auth_actions';
import style from './style.css';
import SearchBar from './searchBar';
import sgdMiniLogo from './sgdMiniLogo.png';
import { clearError } from '../../actions/metaActions';

class Layout extends Component {
  renderAuthedMenu() {
    return (
      <div>
        <ul className={`menu ${style.authMenu}`}>
          <li><a className={style.navLink} href='/'>
            <i className='fa fa-sign-out' /> Logout</a>
          </li>
          <li className={style.lastItem}>
            <Link className={style.navLink} to='batch'>
              <i className='fa fa-shopping-cart' /> Batch <span className='label'>1</span>
            </Link>
          </li>
          <li><SearchBar /></li>
        </ul>
      </div>
    );
  }

  renderPublicMenu() {
    return (
      <ul className={`menu ${style.authMenu}`}>
        <li>
          <Link className={style.navLink} to='/login'><i className='fa fa-sign-in' /> Login</Link>
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

  render() {
    // init auth nodes, either login or logout links
    let authNodes = this.props.isAuthenticated ? this.renderAuthedMenu() : this.renderPublicMenu();
    return (
      <div>
        {this.renderError()}
        <nav className={`top-bar ${style.navWrapper}`}>
          <div className='top-bar-left'>
            <ul className={`menu ${style.menu}`}>
              <li>
                <Link className={style.indexLink} to='curate'>
                  <img className={style.imgLogo} src={sgdMiniLogo} />
                  <span className={`${style.logoText} ${style.navLink}`}>SGD Curator</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className='top-bar-right'>
            {authNodes}
          </div>
        </nav>
        <div className={`row ${style.contentRow}`}>
          <div className={`large-12 columns ${style.contentContainer}`}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

Layout.propTypes = {
  children: PropTypes.node,
  error: React.PropTypes.string,
  dispatch: React.PropTypes.func,
  isAuthenticated: React.PropTypes.bool
};

function mapStateToProps(state) {
  return {
    error: state.meta.get('error'),
    isAuthenticated: state.auth.get('isAuthenticated')
  };
}

export default connect(mapStateToProps)(Layout);
