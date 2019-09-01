export function authenticateUser(data) {
  return {
    type: 'AUTHENTICATE_USER',
    payload: data
  };
}

export function logout () {
  return { type: 'LOGOUT' };
}

export function startAuthentication () {
  return { type: 'START_AUTH' };
}
