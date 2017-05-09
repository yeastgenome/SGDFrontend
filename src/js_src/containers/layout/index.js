import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

// import * as AuthActions from '../actions/auth_actions';
import style from './style.css';
import SearchBar from './searchBar';
import curateLogo from './curateLogo.png';
import Loader from './loader/index';
import { clearError, clearMessage } from '../../actions/metaActions';

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
          <Link className={style.indexLink} to='curate'>
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
          <Link className={style.indexLink} to='curate'>
            <img className={style.imgLogo} src={curateLogo} />
          </Link>
        </li>
        <li>
          <Link to='curate'>
            <span><i className='fa fa-home' /> Curation Home</span>
          </Link>
        </li>
        <li>
          <Link to='help'>
            <span><i className='fa fa-question-circle' /> Help</span>
          </Link>
        </li>
        <li>
          <a className={style.navLink} href='/'><i className='fa fa-sign-out' /> Logout</a>
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
    return (
      <div>
        {this.renderMessage()}
        {this.renderError()}
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
