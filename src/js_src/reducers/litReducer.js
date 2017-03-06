/*eslint-disable no-case-declarations, no-redeclare */
import { fromJS } from 'immutable';
import _ from 'underscore';

// temp fixture
const DEFAULT_STATE = fromJS({
  triageEntries: [],
});

export default function litReducer(state = DEFAULT_STATE, action) {
  let triageEntries;
  switch (action.type) {
  case 'UPDATE_TRIAGE_ENTRY':
    triageEntries = state.get('triageEntries').toJS();
    let targetEntry = _.findWhere(triageEntries, { curation_id: action.payload.curation_id });
    let targetI = _.indexOf(triageEntries, targetEntry);
    triageEntries[targetI] = action.payload;
    return state.set('triageEntries', fromJS(triageEntries));
  case 'REMOVE_TRIAGE':
    triageEntries = state.get('triageEntries').toJS();
    let deletedEntry = _.findWhere(triageEntries, { curation_id: action.payload });
    triageEntries = _.without(triageEntries, deletedEntry);
    return state.set('triageEntries', fromJS(triageEntries));
  case 'UPDATE_TRIAGE_ENTRIES':
    // update old array
    triageEntries = state.get('triageEntries').toJS();
    let newTriageEntries = action.payload.entries;
    newTriageEntries.forEach( (d) => {
      triageEntries = updateTriage(triageEntries, d, action.payload.username);
    });
    return state.set('triageEntries', fromJS(triageEntries));
  default:
    return state;
  }
}

// update or add entry unless the assignee is currentUser
function updateTriage(allEntries, entry, currentUser) {
  let thisEntry = _.findWhere(allEntries, { curation_id: entry.curation_id });
  if (!thisEntry) {
    allEntries.push(entry);
    return allEntries;
  } else if (thisEntry.data.assignee === currentUser) {
    return allEntries;
  } else {
    thisEntry = entry;
    return allEntries;
  }
}
