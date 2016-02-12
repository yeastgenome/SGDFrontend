import _ from 'underscore';

const DEFAULT_STATE = {
  isAuthenticated: false,
  isAuthenticating: false,
  username: null,
  csrfToken: null
};

const authReducer = function (_state, action) {
  let state = _.clone(_state);
  switch (action.type) {
    case 'RECEIVE_AUTH_RESPONSE':
      state.isAuthenticated = true;
      state.isAuthenticating = false;
      state.username = action.payload.username;
      return state;
      break;
    case 'LOGOUT':
      state.isAuthenticated = false;
      state.isAuthenticating = false;
      state.username = null;
      return state;
      break;
    default:
      return DEFAULT_STATE;
  }
};

module.exports = authReducer;
