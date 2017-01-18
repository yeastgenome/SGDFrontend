export function authenticateUser () {
  return { type: 'AUTHENTICATE_USER' };
}

export function logout () {
  return { type: 'LOGOUT' };
}

export function startAuthentication () {
  return { type: 'START_AUTH' };
}
