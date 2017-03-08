export function updateTriageEntry (updatedEntry) {
  return {
    type: 'UPDATE_TRIAGE_ENTRY',
    payload: updatedEntry
  };
}

export function updateActiveTags (updatedEntry) {
  return {
    type: 'UPDATE_ACTIVE_TAGS',
    payload: updatedEntry
  };
}

export function clearActiveTags () {
  return {
    type: 'CLEAR_ACTIVE_TAGS'
  };
}

export function removeEntry (id) {
  return { type: 'REMOVE_TRIAGE', payload: id };
}

export function updateTags (newTags) {
  newTags = newTags.map( d => d.value );
  return { type: 'UPDATE_TAGS', payload: newTags };
}

export function updateTriageEntries (newEntries, username) {
  return {
    type: 'UPDATE_TRIAGE_ENTRIES',
    payload: {
      entries: newEntries,
      username: username
    }
  };
}
