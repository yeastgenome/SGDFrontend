import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  isAuthenticated: false,
  isAuthenticating: false,
  csrfToken: null
});

export default function authReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'SET_CSRF_TOKEN':
    return state.set('csrfToken', action.payload);
  case 'START_AUTH':
    return state.set('isAuthenticating', true);
  case 'AUTHENTICATE_USER':
    return state
      .set('isAuthenticated', true)
      .set('isAuthenticating', false)
      .set('loginError', false);
  case 'LOGOUT':
    return state
      .set('isAuthenticated', false)
      .set('isAuthenticating', false);
  default:
    return state;
  }
}
