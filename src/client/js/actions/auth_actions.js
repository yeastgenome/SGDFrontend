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
    function checkStatus(response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        const error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
    };
    // send POST request to server to get credentials, dispatch reception action
    fetch(AUTH_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': state.csrfToken,        
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: paramStr
      })
      .then(checkStatus)  
      .then(function handleAuthResponse (response) {
        dispatch(receiveAuthResponseAndRedirect('user123'));
      }).catch(function handleAuthRequestError (error) {
         dispatch(setLoginError());
      });
  };
};

export function setCSRFToken (token) {
  return {
    type: 'SET_CSRF_TOKEN',
    payload: token
  };
};

export function receiveAuthResponseAndRedirect (email) {
  return function (dispatch, getState) {
    dispatch(receiveAuthenticationResponse(email));
    let redirectUrl = getState().routing.location.query.next || '/dashboard';
    dispatch(routeActions.push(redirectUrl));
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

export function setLoginError () {
  return {
    type: 'SET_LOGIN_ERROR'
  };
};
