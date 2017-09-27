export function updateData (payload) {
  return { type: 'UPDATE_LOCUS_DATA', payload: payload };
}

export function setPending () {
  return { type: 'SET_LOCUS_PENDING' };
}

export function clearPending () {
  return { type: 'CLEAR_LOCUS_PENDING' };
}
