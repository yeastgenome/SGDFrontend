export function updateTags (newTags) {
  newTags = newTags.map( d => d.value );
  return { type: 'UPDATE_TAGS', payload: newTags };
}

export function updateAssignees (newTags) {
  return { type: 'UPDATE_ASSIGNEES', payload: newTags };
}

export function updateActiveEntry (newEntry) {
  newEntry.lastUpdated = (new Date());
  return { type: 'UPDATE_ACTIVE_ENTRY', payload: newEntry };
}

