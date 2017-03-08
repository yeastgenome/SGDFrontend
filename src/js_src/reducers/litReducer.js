/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';
import _ from 'underscore';

const DEFAULT_STATE = fromJS({
  activeLitEntry: {
    lastUpdated: (new Date())
  },
  triageEntries: [],
});

export default function litReducer(state = DEFAULT_STATE, action) {
  let triageEntries;
  switch (action.type) {
  case 'UPDATE_ACTIVE_ENTRY':
    return state.set('activeLitEntry', fromJS(action.payload));
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
    triageEntries = state.get('triageEntries').toJS();
    let newTriageEntries = replaceTriage(triageEntries, action.payload.entries, action.payload.username);
    return state.set('triageEntries', fromJS(newTriageEntries));
  default:
    return state;
  }
}

function replaceTriage(oldEntries, newEntries, currentUsername) {
  newEntries.forEach( (d, i) => {
    let oldEntry = _.findWhere(oldEntries, { curation_id: d.curation_id });
    if (!oldEntry) {
      oldEntries.push(d);
    // replace if assignee changes and current version not claimed to self
    } else if (oldEntry.data.assignee !== d.data.assignee && oldEntry.data.assignee !== currentUsername) {
      oldEntries[i] = d;
    }
  });
  return oldEntries;
}
