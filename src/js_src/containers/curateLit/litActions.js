export function updateActiveEntry (newEntry) {
  newEntry.lastUpdated = (new Date());
  return { type: 'UPDATE_ACTIVE_ENTRY', payload: newEntry };
}


export function updateActiveTags (updatedEntry) {
  return {
    type: 'UPDATE_ACTIVE_TAGS',
    payload: updatedEntry
  };
}
