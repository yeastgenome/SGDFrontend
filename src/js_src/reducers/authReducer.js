import _ from 'underscore';

const DEFAULT_STATE = {
  isAuthenticated: false,
  isAuthenticating: false,
  csrfToken: null,
  loginError: false
};

export default function authReducer(_state, action) {
  if (typeof _state === 'undefined') return DEFAULT_STATE;
  let state = _.clone(_state);
  switch (action.type) {
  case 'SET_CSRF_TOKEN':
    state.csrfToken = action.payload;
    return state;
  case 'START_AUTH':
    state.isAuthenticating = true;
    return state;
  case 'AUTHENTICATE_USER':
    state.isAuthenticated = true;
    state.isAuthenticating = false;
    state.loginError = false;
    return state;
  case 'LOGOUT':
    state.isAuthenticated = false;
    state.isAuthenticating = false;
    return state;
  case 'SET_LOGIN_ERROR':
    state.loginError = true;
    state.isAuthenticating = false;
    return state;
  default:
    return state;
  }
}
