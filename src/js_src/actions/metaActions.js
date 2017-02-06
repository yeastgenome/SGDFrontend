export function setError (message) {
  return { type: 'SET_ERROR', payload: message };
}

export function clearError () {
  return { type: 'CLEAR_ERROR' };
}
