export function authenticateUser (username) {
  return { type: 'AUTHENTICATE_USER', payload: username };
}

export function logout () {
  return { type: 'LOGOUT' };
}

export function startAuthentication () {
  return { type: 'START_AUTH' };
}
