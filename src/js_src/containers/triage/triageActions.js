export function updateTriageEntry (updatedEntry) {
  return {
    type: 'UPDATE_TRIAGE_ENTRY',
    payload: updatedEntry
  };
}

export function removeEntry (id) {
  return { type: 'REMOVE_TRIAGE', payload: id };
}

export function updateTriageEntries (newEntries, username, total) {
  return {
    type: 'UPDATE_TRIAGE_ENTRIES',
    payload: {
      entries: newEntries,
      username: username,
      total: total
    }
  };
}

export function updateLastPromoted (litObj) {
  return {
    type: 'UPDATE_LAST_PROMOTED',
    payload: litObj
  };
}

export function clearLastPromoted () {
  return {
    type: 'CLEAR_LAST_PROMOTED'
  };
}

