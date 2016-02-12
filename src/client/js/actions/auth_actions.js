import 'isomorphic-fetch';
import { routeActions } from 'react-router-redux';

const AUTH_URL = '/signin';

export function authenticateUser () {
  return { type: 'AUTHENTICATE_USER' };
};

export function logout () {
  return { type: 'LOGOUT' };
};

export function logoutAndRedirect () {
  return (dispatch, state) => {
    dispatch(logout());
    dispatch(routeActions.push('/login'));
  }
};

export function sendAuthRequest (googleToken) {
  return function (dispatch, getState) {
    let state = getState().auth;
    // format params as JSON string without wrapping brackets
    let paramObj = { google_token: googleToken };
    let paramStr = JSON.stringify(paramObj)
      .substr(1, JSON.stringify(paramObj).length - 2)
      .replace(/"/g, '')
      .replace(/:/g, '=');
    // send POST request to server to get credentials, dispatch reception action
    fetch(AUTH_URL, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-Token': state.csrfToken,        
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: paramStr
    }).then( function handleAuthResponse (response) {
      console.log('i got an auth response ', response)
    });
  };
};

export function setCSRFToken (token) {
  return {
    type: 'SET_CSRF_TOKEN',
    payload: token
  };
};

export function receiveAuthenticationResponse (_email) {
  return {
    type: 'RECEIVE_AUTH_RESPONSE',
    payload: {
      email: _email, 
    }
  };
};
