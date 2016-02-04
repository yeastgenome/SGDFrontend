import { routeActions } from 'react-router-redux';

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
