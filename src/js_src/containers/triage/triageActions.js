export function updateTags (newTags) {
  newTags = newTags.map( d => d.value );
  return { type: 'UPDATE_TAGS', payload: newTags };
}

export function updateAssignees (newTags) {
  return { type: 'UPDATE_ASSIGNEES', payload: newTags };
}

export function updateTriageEntries (newEntries) {
  return { type: 'UPDATE_TRIAGE_ENTRIES', payload: newEntries };
}
