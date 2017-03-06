export function assignTriageEntry (_id, _username) {
  return {
    type: 'ASSIGN_TRIAGE_ENTRY',
    payload: {
      id: _id,
      username: _username
    }
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
