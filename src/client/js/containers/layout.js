import React from 'react';
import Radium from 'radium';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import * as AuthActions from '../actions/auth_actions';

const AppLayout = React.createClass({
  render() {
    let onClickLogout = e => {
      e.preventDefault();
      this.props.dispatch(AuthActions.logoutAndRedirect());
    };
    // init auth nodes, either login or logout links
    let authNodes = this.props.isAuthenticated ?
      <ul style={style.authMenu} className='menu'><li><Link style={style.navLink} to='/account'><i className='fa fa-user'></i> {this.props.username}</Link></li><li><a style={style.navLink} onClick={onClickLogout} href='#'><i className='fa fa-sign-out'></i> Logout</a></li></ul> :
      <ul style={style.authMenu} className='menu'><li><Link style={style.navLink} to='/login'><i className='fa fa-sign-in'></i> Login</Link></li></ul>;
    return (
      <div>
        <nav className='top-bar' style={style.messageZone}>
          <p style={style.messageText}>Have a look at our <a>cookies policy</a> and <a>privacy policy.</a></p>
        </nav>
        <nav className='top-bar' style={style.navWrapper}>
          <div className='top-bar-left'>
            <ul className='menu' style={style.menu}>
              <li>
                <Link to='dashboard' style={style.indexLink}>
                  <img src='/static/img/sgd_logo.png' style={style.imgLogo}/>
                </Link>
              </li>
            </ul>
          </div>
         <div className='top-bar-right'>
          {authNodes}
        </div>
        </nav>
        <div className='row full-width wrapper'>
          <div className='large-12 columns'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
});

const purple = '#663882';
const red = '#C22D38';
const messageColor = '#CCC';
var style = {
  messageZone: {
    background: 'black',
    color: messageColor
  },
  imgLogo: {
    width: 250
  },
  messageText: {
    marginBottom: '0.25rem'
  },
  menu: {
    background: 'none',
    fontSize: '18px'
  },
  authMenu: {
    background: 'none',
    fontSize: '18px',
    marginTop: '0.25rem'
  },
  navWrapper: {
    background: purple
  },
  navLink: {
    color: 'white',
  },
  indexLink: {
    color: 'white',
    padding: '0.25rem'
  },
  indexText: {
    fontSize: 28
  }
};

function mapStateToProps(_state) {
  let state = _state.auth;
  return {
    isAuthenticated: state.isAuthenticated,
    isAuthenticating: state.isAuthenticating,
    username: state.username
  };
};

module.exports = Radium(connect(mapStateToProps)(AppLayout));
