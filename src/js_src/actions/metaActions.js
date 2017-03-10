export function setError (message) {
  return { type: 'SET_ERROR', payload: message };
}

export function clearError () {
  return { type: 'CLEAR_ERROR' };
}

export function setMessage (message) {
  return { type: 'SET_MESSAGE', payload: message };
}

export function clearMessage () {
  return { type: 'CLEAR_MESSAGE' };
}
