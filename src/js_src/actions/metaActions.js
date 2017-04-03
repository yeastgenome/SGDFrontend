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

export function setNotReady () {
  return { type: 'SET_NOT_READY' };
}

export function setPending () {
  return { type: 'SET_PENDING' };
}

export function setReady () {
  return { type: 'SET_READY' };
}

export function finishPending () {
  return { type: 'FINISH_PENDING' };
}
